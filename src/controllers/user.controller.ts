import { Request, Response } from 'express';
import userService from '../services/user.service';
import { 
  createUserSchema, 
  updateUserSchema, 
  assignRoleSchema,
  changePasswordSchema,
  updateProfileSchema,
  userQuerySchema
} from '../middleware/validation/user.validation';

interface ValidationError {
  details: Array<{ message: string }>;
}

export class UserController {

  /**
   * Get users with filters and pagination
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = userQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const result = await userService.getUsers(value);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getUsers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }

  /**
   * Get single user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in getUserById:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user'
      });
    }
  }

  /**
   * Create a new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const createdBy = (req as any).user.id;
      const user = await userService.createUser(value, createdBy);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in createUser:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create user'
        });
      }
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const updatedBy = (req as any).user.id;
      const user = await userService.updateUser(userId, value, updatedBy);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const deletedBy = (req as any).user.id;
      
      // Prevent self-deletion
      if (userId === deletedBy) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      await userService.deleteUser(userId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  /**
   * Activate user
   */
  async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const activatedBy = (req as any).user.id;
      const user = await userService.activateUser(userId, activatedBy);

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in activateUser:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to activate user'
      });
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const deactivatedBy = (req as any).user.id;
      
      // Prevent self-deactivation
      if (userId === deactivatedBy) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
        return;
      }

      const user = await userService.deactivateUser(userId, deactivatedBy);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in deactivateUser:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to deactivate user'
      });
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = assignRoleSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const assignedBy = (req as any).user.id;
      const result = await userService.assignRole(userId, value.roleId, assignedBy);

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error in assignRole:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to assign role'
      });
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const roleId = parseInt(req.params.roleId);
      
      if (isNaN(userId) || isNaN(roleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID or role ID'
        });
        return;
      }

      const removedBy = (req as any).user.id;
      await userService.removeRole(userId, roleId, removedBy);

      res.status(200).json({
        success: true,
        message: 'Role removed successfully'
      });
    } catch (error: any) {
      console.error('Error in removeRole:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove role'
      });
    }
  }

  /**
   * Get user performance metrics
   */
  async getUserPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const { dateFrom, dateTo } = req.query;
      const filters: any = {};
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const performance = await userService.getUserPerformance(userId, filters);

      res.status(200).json({
        success: true,
        message: 'User performance retrieved successfully',
        data: performance
      });
    } catch (error: any) {
      console.error('Error in getUserPerformance:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user performance'
      });
    }
  }

  /**
   * Get user's leads
   */
  async getUserLeads(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getUserLeads(userId, { page, limit });

      res.status(200).json({
        success: true,
        message: 'User leads retrieved successfully',
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getUserLeads:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user leads'
      });
    }
  }

  /**
   * Get user's deals
   */
  async getUserDeals(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getUserDeals(userId, { page, limit });

      res.status(200).json({
        success: true,
        message: 'User deals retrieved successfully',
        data: result.deals,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getUserDeals:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user deals'
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const changedBy = (req as any).user.id;
      await userService.changePassword(userId, value.newPassword, changedBy);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      console.error('Error in changePassword:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const updatedBy = (req as any).user.id;
      const user = await userService.updateProfile(userId, value, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }
}

export default new UserController();