import { Request, Response } from 'express';
import { dealService } from '../services/deal.service';
import { 
  createDealSchema, 
  updateDealSchema, 
  dealQuerySchema, 
  dealApprovalSchema,
  createPaymentSchema,
  commissionCalculationSchema,
  dealStatusUpdateSchema
} from '../middleware/validation/deal.validation';
import logger from '../utils/logger';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
}

class DealController {
  // Get all deals with filtering and pagination
  async getDeals(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = dealQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0]; // Assuming first role is primary

      const result = await dealService.getDeals(value, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deals retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in getDeals controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get deal by ID
  async getDealById(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const deal = await dealService.getDealById(dealId, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deal retrieved successfully',
        data: deal
      });
    } catch (error) {
      logger.error('Error in getDealById controller:', error);
      
      if ((error as Error).message === 'Deal not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or access denied'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Create new deal
  async createDeal(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = createDealSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const deal = await dealService.createDeal(value, userId);

      return res.status(201).json({
        success: true,
        message: 'Deal created successfully',
        data: deal
      });
    } catch (error) {
      logger.error('Error in createDeal controller:', error);
      
      if ((error as Error).message.includes('not found') || (error as Error).message.includes('inactive')) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Update deal
  async updateDeal(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const { error, value } = updateDealSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const deal = await dealService.updateDeal(dealId, value, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deal updated successfully',
        data: deal
      });
    } catch (error) {
      logger.error('Error in updateDeal controller:', error);
      
      if ((error as Error).message === 'Deal not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or access denied'
        });
      }

      if ((error as Error).message.includes('not found') || (error as Error).message.includes('inactive')) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Delete deal
  async deleteDeal(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const result = await dealService.deleteDeal(dealId, userId, userRole);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Error in deleteDeal controller:', error);
      
      if ((error as Error).message === 'Deal not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or access denied'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Approve or reject deal
  async approveDeal(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const { error, value } = dealApprovalSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const { action, comments, rejectionReason } = value;

      const deal = await dealService.approveDeal(dealId, action, comments, rejectionReason, userId);

      return res.status(200).json({
        success: true,
        message: `Deal ${action}d successfully`,
        data: deal
      });
    } catch (error) {
      logger.error('Error in approveDeal controller:', error);
      
      if ((error as Error).message === 'Deal not found') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found'
        });
      }

      if ((error as Error).message === 'Deal is not in pending status') {
        return res.status(400).json({
          success: false,
          message: 'Deal is not in pending status'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Add payment record
  async addPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const { error, value } = createPaymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const payment = await dealService.addPayment(dealId, value, userId);

      return res.status(201).json({
        success: true,
        message: 'Payment record added successfully',
        data: payment
      });
    } catch (error) {
      logger.error('Error in addPayment controller:', error);
      
      if ((error as Error).message === 'Deal not found') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get deal payments
  async getDealPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const payments = await dealService.getDealPayments(dealId, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deal payments retrieved successfully',
        data: payments
      });
    } catch (error) {
      logger.error('Error in getDealPayments controller:', error);
      
      if ((error as Error).message === 'Deal not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or access denied'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get deal pipeline statistics
  async getDealPipeline(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const pipeline = await dealService.getDealPipeline(userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deal pipeline retrieved successfully',
        data: pipeline
      });
    } catch (error) {
      logger.error('Error in getDealPipeline controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Calculate commission
  async calculateCommission(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = commissionCalculationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { dealId, agentId, commissionType } = value;
      const commission = await dealService.calculateCommission(dealId, agentId, commissionType);

      return res.status(200).json({
        success: true,
        message: 'Commission calculated successfully',
        data: commission
      });
    } catch (error) {
      logger.error('Error in calculateCommission controller:', error);
      
      if ((error as Error).message === 'Deal not found') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Update deal status
  async updateDealStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID'
        });
      }

      const { error, value } = dealStatusUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const deal = await dealService.updateDeal(dealId, {
        status: value.status,
        closingDate: value.closingDate,
        notes: value.reason ? `Status updated: ${value.reason}` : undefined
      }, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Deal status updated successfully',
        data: deal
      });
    } catch (error) {
      logger.error('Error in updateDealStatus controller:', error);
      
      if ((error as Error).message === 'Deal not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or access denied'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get deals by lead ID
  async getDealsByLead(req: AuthenticatedRequest, res: Response) {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      // Use the existing getDeals method with leadId filter
      const result = await dealService.getDeals({
        page: 1,
        limit: 100, // Get all deals for this lead
        leadId
      } as any, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Lead deals retrieved successfully',
        data: result.deals
      });
    } catch (error) {
      logger.error('Error in getDealsByLead controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get deals by project ID
  async getDealsByProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const userId = req.user!.id;
      const userRole = req.user!.roles[0];

      const result = await dealService.getDeals({
        page: 1,
        limit: 100,
        projectId
      }, userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Project deals retrieved successfully',
        data: result.deals
      });
    } catch (error) {
      logger.error('Error in getDealsByProject controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}

export const dealController = new DealController();