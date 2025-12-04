import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  refreshToken,
  changePassword,
  registerValidation,
  loginValidation
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { body } from 'express-validator';

const router = Router();

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validate(registerValidation), register);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(loginValidation), login);

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getMe);

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, logout);

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   PUT /api/v1/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', 
  authenticate,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  ]),
  changePassword
);

export default router;
