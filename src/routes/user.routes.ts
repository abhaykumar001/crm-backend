import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get users with filters and pagination
 * @access  Private (admin, hr, team_leader)
 */
router.get('/', 
  requireRole('admin', 'hr', 'team_leader'),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user details by ID
 * @access  Private (admin, hr, team_leader)
 */
router.get('/:id', 
  requireRole('admin', 'hr', 'team_leader'),
  userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (admin, hr)
 */
router.post('/', 
  requireRole('admin', 'hr'),
  userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (admin, hr)
 */
router.put('/:id', 
  requireRole('admin', 'hr'),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (admin)
 */
router.delete('/:id', 
  requireRole('admin'),
  userController.deleteUser
);

/**
 * @route   PUT /api/v1/users/:id/activate
 * @desc    Activate user
 * @access  Private (admin, hr)
 */
router.put('/:id/activate', 
  requireRole('admin', 'hr'),
  userController.activateUser
);

/**
 * @route   PUT /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (admin, hr)
 */
router.put('/:id/deactivate', 
  requireRole('admin', 'hr'),
  userController.deactivateUser
);

/**
 * @route   POST /api/v1/users/:id/assign-role
 * @desc    Assign role to user
 * @access  Private (admin, hr)
 */
router.post('/:id/assign-role', 
  requireRole('admin', 'hr'),
  userController.assignRole
);

/**
 * @route   DELETE /api/v1/users/:id/roles/:roleId
 * @desc    Remove role from user
 * @access  Private (admin, hr)
 */
router.delete('/:id/roles/:roleId', 
  requireRole('admin', 'hr'),
  userController.removeRole
);

/**
 * @route   GET /api/v1/users/:id/performance
 * @desc    Get user performance metrics
 * @access  Private (admin, hr, team_leader)
 */
router.get('/:id/performance', 
  requireRole('admin', 'hr', 'team_leader'),
  userController.getUserPerformance
);

/**
 * @route   GET /api/v1/users/:id/leads
 * @desc    Get user's leads
 * @access  Private (admin, hr, team_leader)
 */
router.get('/:id/leads', 
  requireRole('admin', 'hr', 'team_leader'),
  userController.getUserLeads
);

/**
 * @route   GET /api/v1/users/:id/deals
 * @desc    Get user's deals
 * @access  Private (admin, hr, team_leader)
 */
router.get('/:id/deals', 
  requireRole('admin', 'hr', 'team_leader'),
  userController.getUserDeals
);

/**
 * @route   PUT /api/v1/users/:id/change-password
 * @desc    Change user password
 * @access  Private (admin, hr)
 */
router.put('/:id/change-password', 
  requireRole('admin', 'hr'),
  userController.changePassword
);

/**
 * @route   PUT /api/v1/users/:id/profile
 * @desc    Update user profile
 * @access  Private (admin, hr, own profile)
 */
router.put('/:id/profile', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  userController.updateProfile
);

export default router;
