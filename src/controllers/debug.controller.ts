import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { asyncHandler } from '../middleware/error.middleware';

// @desc    Check users in database
// @route   GET /api/v1/debug/users
// @access  Public (remove this in production!)
export const checkUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
    }
  });

  const userCount = await prisma.user.count();

  res.json({
    success: true,
    count: userCount,
    users: users
  });
});

// @desc    Debug auth - Check user and password
// @route   POST /api/v1/debug/auth
// @access  Public (remove this in production!)
export const debugAuth = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    return res.status(200).json({
      success: true,
      debug: {
        userFound: false,
        message: 'No user found with this email'
      }
    });
  }

  // Test common passwords
  const testPasswords = ['admin123', 'password123', 'Admin@123', '12345678'];
  const passwordTests: any = {};
  
  for (const testPass of testPasswords) {
    passwordTests[testPass] = await bcrypt.compare(testPass, user.password);
  }

  return res.status(200).json({
    success: true,
    debug: {
      userFound: true,
      userId: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      passwordHashPrefix: user.password.substring(0, 20),
      rolesCount: user.roles?.length || 0,
      roles: user.roles?.map((ur: any) => ur.role?.name) || [],
      passwordTests,
      matchingPassword: Object.keys(passwordTests).find(key => passwordTests[key]) || 'none'
    }
  });
});
