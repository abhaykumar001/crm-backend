import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { 
  PrismaClientKnownRequestError, 
  PrismaClientValidationError, 
  PrismaClientInitializationError 
} from '@prisma/client/runtime/library';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Create custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Prisma errors
const handlePrismaError = (error: any): { message: string; statusCode: number } => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined;
        const fieldName = field ? field[0] : 'field';
        return {
          message: `A record with this ${fieldName} already exists.`,
          statusCode: 409
        };
      
      case 'P2025':
        // Record not found
        return {
          message: 'Record not found.',
          statusCode: 404
        };
      
      case 'P2003':
        // Foreign key constraint violation
        return {
          message: 'Related record not found.',
          statusCode: 400
        };
      
      case 'P2014':
        // Required relation missing
        return {
          message: 'Required relation is missing.',
          statusCode: 400
        };
      
      default:
        return {
          message: 'Database error occurred.',
          statusCode: 500
        };
    }
  }

  if (error instanceof PrismaClientValidationError) {
    return {
      message: 'Invalid data provided.',
      statusCode: 400
    };
  }

  if (error instanceof PrismaClientInitializationError) {
    return {
      message: 'Database connection error.',
      statusCode: 500
    };
  }

  return {
    message: 'Database error occurred.',
    statusCode: 500
  };
};

// Handle JWT errors
const handleJWTError = (error: any): { message: string; statusCode: number } => {
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token. Please log in again.',
      statusCode: 401
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Token has expired. Please log in again.',
      statusCode: 401
    };
  }

  return {
    message: 'Authentication error.',
    statusCode: 401
  };
};

// Main error handler middleware
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { message, statusCode } = error;

  // Handle Prisma errors
  if (error.name?.includes('Prisma')) {
    const prismaError = handlePrismaError(error);
    message = prismaError.message;
    statusCode = prismaError.statusCode;
  }

  // Handle JWT errors
  if (error.name?.includes('Token') || error.name === 'JsonWebTokenError') {
    const jwtError = handleJWTError(error);
    message = jwtError.message;
    statusCode = jwtError.statusCode;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    message = 'Validation failed. Please check your input.';
    statusCode = 400;
  }

  // Default to 500 server error
  if (!statusCode) {
    statusCode = 500;
    message = 'Internal server error';
  }

  // Log error
  logger.error({
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        originalError: error.message 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
