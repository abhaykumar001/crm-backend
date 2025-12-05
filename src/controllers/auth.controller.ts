import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import prisma from '../config/database';
import { CustomError, asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

// Interfaces
interface RegisterBody {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  designation?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// Generate JWT token
const generateToken = (userId: number, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId, email }, 
    secret, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
};

// Generate refresh token
const generateRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId, type: 'refresh' }, 
    secret, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as any
  );
};

// Validation rules
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('mobileNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid mobile number'),
  
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, mobileNumber, designation }: RegisterBody = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new CustomError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      designation,
      joiningDate: new Date(),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobileNumber: true,
      designation: true,
      joiningDate: true,
      isActive: true,
      createdAt: true,
    }
  });

  // Assign default 'agent' role to new users
  const agentRole = await prisma.role.findUnique({
    where: { name: 'agent' }
  });

  if (agentRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: agentRole.id,
      }
    });
  }

  // Generate tokens
  const token = generateToken(user.id, user.email);
  // Note: RefreshToken functionality will be added after Prisma client update

  logger.info(`New user registered: ${user.email}`, { userId: user.id });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginBody = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { 
      email
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

  if (!user || !user.isActive || user.deletedAt) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Extract roles and permissions safely
  const roles = user.roles?.map((userRole: any) => userRole.role?.name).filter(Boolean) || [];
  const permissions = user.roles?.flatMap((userRole: any) => 
    userRole.role?.permissions?.map((rolePermission: any) => rolePermission.permission?.name).filter(Boolean) || []
  ) || [];

  // Generate tokens
  const token = generateToken(user.id, user.email);
  // Note: RefreshToken functionality will be added after Prisma client update

  logger.info(`User logged in: ${user.email}`, { userId: user.id });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        ...userWithoutPassword,
        role: roles[0] || 'agent', // Primary role for backwards compatibility
        roles: [...new Set(roles)],
        permissions: [...new Set(permissions)]
      },
      token,
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { 
      id: userId
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
    throw new CustomError('User not found', 404);
  }

  // Extract roles and permissions safely
  const roles = user.roles?.map((userRole: any) => userRole.role?.name).filter(Boolean) || [];
  const permissions = user.roles?.flatMap((userRole: any) => 
    userRole.role?.permissions?.map((rolePermission: any) => rolePermission.permission?.name).filter(Boolean) || []
  ) || [];

  res.status(200).json({
    success: true,
    data: {
      user: {
        ...user,
        role: roles[0] || 'agent', // Primary role for backwards compatibility
        roles: [...new Set(roles)],
        permissions: [...new Set(permissions)]
      }
    }
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Note: RefreshToken functionality will be added after Prisma client update
  
  logger.info(`User logged out: ${req.user!.email}`, { userId: req.user!.id });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Note: RefreshToken functionality will be implemented after Prisma client update
  throw new CustomError('Refresh token functionality not yet implemented', 501);
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new CustomError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedNewPassword,
      updatedAt: new Date()
    }
  });

  // Note: Refresh token invalidation will be added after Prisma client update

  logger.info(`Password changed for user: ${user.email}`, { userId });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});
