import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { CustomError } from './error.middleware';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Verify JWT token and attach user to request
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from database with roles and permissions
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true,
        deletedAt: null
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new CustomError('User not found or inactive', 401);
    }

    // Extract roles and permissions
    const roles = user.roles.map((userRole: any) => userRole.role.name);
    const permissions = user.roles.flatMap((userRole: any) => 
      userRole.role.permissions.map((rolePermission: any) => rolePermission.permission.name)
    );

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: [...new Set(roles)] as string[], // Remove duplicates
      permissions: [...new Set(permissions)] as string[] // Remove duplicates
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new CustomError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new CustomError('Token expired', 401));
    }
    next(error);
  }
};

// Check if user has required role
export const requireRole = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    const hasRole = requiredRoles.some(role => 
      req.user!.roles.includes(role)
    );

    if (!hasRole) {
      return next(new CustomError('Insufficient permissions - role required', 403));
    }

    next();
  };
};

// Check if user has required permission
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    const hasPermission = requiredPermissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(new CustomError('Insufficient permissions', 403));
    }

    next();
  };
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    // Use the authenticate middleware
    await authenticate(req, res, next);
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Check if user owns the resource or has admin privileges
export const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    // Admin can access any resource
    if (req.user.roles.includes('admin')) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId || parseInt(resourceUserId) !== req.user.id) {
      return next(new CustomError('Access denied - resource ownership required', 403));
    }

    next();
  };
};
