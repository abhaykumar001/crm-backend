import { Request, Response } from 'express';
import leadService from '../services/lead.service';
import leadAssignmentService from '../utils/lead-assignment.util';
import leadAssignmentServiceNew from '../services/leadAssignment.service';
import { 
  createLeadSchema, 
  updateLeadSchema, 
  assignLeadSchema, 
  updateStatusSchema, 
  addNoteSchema,
  scheduleFollowUpSchema,
  leadQuerySchema,
  callLogSchema,
  bulkAssignSchema,
  bulkStatusUpdateSchema
} from '../middleware/validation/lead.validation';

export class LeadController {

  /**
   * Create a new lead
   */
  async createLead(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createLeadSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const lead = await leadService.createLead(value, userId);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead
      });
    } catch (error: any) {
      console.error('Error in createLead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create lead'
      });
    }
  }

  /**
   * Get leads with filters and pagination
   */
  async getLeads(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = leadQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      // Convert string dates to Date objects
      if (value.dateFrom) value.dateFrom = new Date(value.dateFrom);
      if (value.dateTo) value.dateTo = new Date(value.dateTo);

      const result = await leadService.getLeads(value);

      res.status(200).json({
        success: true,
        message: 'Leads retrieved successfully',
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getLeads:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve leads'
      });
    }
  }

  /**
   * Get single lead by ID
   */
  async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      const lead = await leadService.getLeadById(leadId);

      res.status(200).json({
        success: true,
        message: 'Lead retrieved successfully',
        data: lead
      });
    } catch (error: any) {
      console.error('Error in getLeadById:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve lead'
      });
    }
  }

  /**
   * Update lead
   */
  async updateLead(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateLeadSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const lead = await leadService.updateLead(leadId, value, userId);

      res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        data: lead
      });
    } catch (error: any) {
      console.error('Error in updateLead:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update lead'
      });
    }
  }

  /**
   * Delete lead (soft delete)
   */
  async deleteLead(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      const userId = (req as any).user.id;
      await leadService.deleteLead(leadId, userId);

      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteLead:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete lead'
      });
    }
  }

  /**
   * Assign lead to agent
   */
  async assignLead(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = assignLeadSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const success = await leadAssignmentService.assignLead(
        leadId, 
        value.agentId, 
        userId, 
        value.reason
      );

      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Failed to assign lead'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Lead assigned successfully'
      });
    } catch (error: any) {
      console.error('Error in assignLead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign lead'
      });
    }
  }

  /**
   * Auto-assign lead
   */
  async autoAssignLead(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      const userId = (req as any).user.id;
      const assignedAgentId = await leadAssignmentService.autoAssignLead(leadId, userId);

      if (!assignedAgentId) {
        res.status(404).json({
          success: false,
          message: 'No available agents for assignment'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Lead auto-assigned successfully',
        data: { assignedAgentId }
      });
    } catch (error: any) {
      console.error('Error in autoAssignLead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to auto-assign lead'
      });
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const lead = await leadService.updateLeadStatus(leadId, value, userId);

      res.status(200).json({
        success: true,
        message: 'Lead status updated successfully',
        data: lead
      });
    } catch (error: any) {
      console.error('Error in updateLeadStatus:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update lead status'
      });
    }
  }

  /**
   * Add note to lead
   */
  async addNote(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = addNoteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const note = await leadService.addNote(leadId, value.content, value.isPrivate, userId);

      res.status(201).json({
        success: true,
        message: 'Note added successfully',
        data: note
      });
    } catch (error: any) {
      console.error('Error in addNote:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add note'
      });
    }
  }

  /**
   * Get lead history
   */
  async getLeadHistory(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid lead ID'
        });
        return;
      }

      const lead = await leadService.getLeadById(leadId);
      
      // Combine different types of history
      const history = [
        ...lead.activities.map((activity: any) => ({
          type: 'activity',
          date: activity.createdAt,
          description: activity.description,
          user: activity.causer?.name || 'System',
          data: activity.properties
        })),
        ...lead.actionHistory.map((action: any) => ({
          type: 'action',
          date: action.actionDate,
          description: `${action.action}: ${action.oldValue} → ${action.newValue}`,
          user: 'System',
          data: action
        })),
        ...lead.assignedHistory.map((assignment: any) => ({
          type: 'assignment',
          date: assignment.assignedAt,
          description: `Assigned to ${assignment.agent.name}`,
          user: 'System',
          data: assignment
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.status(200).json({
        success: true,
        message: 'Lead history retrieved successfully',
        data: history
      });
    } catch (error: any) {
      console.error('Error in getLeadHistory:', error);
      const statusCode = error.message === 'Lead not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve lead history'
      });
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, dateFrom, dateTo } = req.query;
      
      const filters: any = {};
      if (agentId) filters.agentId = parseInt(agentId as string);
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const stats = await leadService.getLeadStats(filters);

      res.status(200).json({
        success: true,
        message: 'Lead statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      console.error('Error in getLeadStats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve lead statistics'
      });
    }
  }

  /**
   * Bulk assign leads
   */
  async bulkAssignLeads(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = bulkAssignSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const userId = (req as any).user.id;
      const { leadIds, agentId, reason } = value;

      const results = await Promise.allSettled(
        leadIds.map((leadId: number) => 
          leadAssignmentService.assignLead(leadId, agentId, userId, reason)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      res.status(200).json({
        success: true,
        message: `Bulk assignment completed. ${successful} successful, ${failed} failed.`,
        data: {
          total: leadIds.length,
          successful,
          failed
        }
      });
    } catch (error: any) {
      console.error('Error in bulkAssignLeads:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk assign leads'
      });
    }
  }

  /**
   * Get agent workload
   */
  async getAgentWorkload(req: Request, res: Response): Promise<void> {
    try {
      const agentId = parseInt(req.params.agentId);
      if (isNaN(agentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid agent ID'
        });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const performance = await leadAssignmentService.getAgentPerformance(agentId, days);

      res.status(200).json({
        success: true,
        message: 'Agent workload retrieved successfully',
        data: performance
      });
    } catch (error: any) {
      console.error('Error in getAgentWorkload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve agent workload'
      });
    }
  }

  /**
   * Assign lead via round-robin (NEW)
   * POST /api/leads/:id/assign-round-robin
   */
  async assignLeadRoundRobin(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const { sourceId } = req.body;
      const assignedBy = (req as any).user.id;

      if (!sourceId) {
        res.status(400).json({
          success: false,
          message: 'sourceId is required'
        });
        return;
      }

      const result = await leadAssignmentServiceNew.assignLeadRoundRobin(
        leadId,
        sourceId,
        assignedBy
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in assignLeadRoundRobin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign lead'
      });
    }
  }

  /**
   * Manually assign lead to specific agent (NEW)
   * POST /api/leads/:id/assign-manual
   */
  async assignLeadManual(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const { agentId } = req.body;
      const assignedBy = (req as any).user.id;

      if (!agentId) {
        res.status(400).json({
          success: false,
          message: 'agentId is required'
        });
        return;
      }

      const result = await leadAssignmentServiceNew.assignLeadManually(
        leadId,
        agentId,
        assignedBy
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in assignLeadManual:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign lead'
      });
    }
  }

  /**
   * Assign lead to multiple agents (NEW)
   * POST /api/leads/:id/assign-multiple
   */
  async assignLeadToMultiple(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const { agentIds } = req.body;
      const assignedBy = (req as any).user.id;

      if (!agentIds || !Array.isArray(agentIds)) {
        res.status(400).json({
          success: false,
          message: 'agentIds array is required'
        });
        return;
      }

      const result = await leadAssignmentServiceNew.assignLeadToMultipleAgents({
        leadId,
        agentIds,
        assignedBy
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in assignLeadToMultiple:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign lead'
      });
    }
  }

  /**
   * Reassign lead from one agent to another (NEW)
   * POST /api/leads/:id/reassign
   */
  async reassignLead(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const { fromAgentId, toAgentId, reason } = req.body;
      const reassignedBy = (req as any).user.id;

      if (!fromAgentId || !toAgentId) {
        res.status(400).json({
          success: false,
          message: 'fromAgentId and toAgentId are required'
        });
        return;
      }

      const result = await leadAssignmentServiceNew.reassignLead(
        leadId,
        fromAgentId,
        toAgentId,
        reassignedBy,
        reason
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in reassignLead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reassign lead'
      });
    }
  }

  /**
   * Agent accepts lead assignment (NEW)
   * POST /api/leads/:id/accept
   */
  async acceptLeadAssignment(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const agentId = (req as any).user.id;

      const result = await leadAssignmentServiceNew.acceptLeadAssignment(
        leadId,
        agentId
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in acceptLeadAssignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to accept assignment'
      });
    }
  }

  /**
   * Agent rejects lead assignment (NEW)
   * POST /api/leads/:id/reject
   */
  async rejectLeadAssignment(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);
      const agentId = (req as any).user.id;
      const { reason } = req.body;

      const result = await leadAssignmentServiceNew.rejectLeadAssignment(
        leadId,
        agentId,
        reason
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in rejectLeadAssignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject assignment'
      });
    }
  }

  /**
   * Get lead assignment history (NEW)
   * GET /api/leads/:id/assignment-history
   */
  async getLeadAssignmentHistory(req: Request, res: Response): Promise<void> {
    try {
      const leadId = parseInt(req.params.id);

      const history = await leadAssignmentServiceNew.getLeadAssignmentHistory(leadId);

      res.status(200).json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error: any) {
      console.error('Error in getLeadAssignmentHistory:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get assignment history'
      });
    }
  }

  /**
   * Get pending assignments for agent (NEW)
   * GET /api/leads/pending-assignments
   */
  async getPendingAssignments(req: Request, res: Response): Promise<void> {
    try {
      const agentId = (req as any).user.id;

      const pendingAssignments = await leadAssignmentServiceNew.getPendingAssignments(agentId);

      res.status(200).json({
        success: true,
        data: pendingAssignments,
        count: pendingAssignments.length
      });
    } catch (error: any) {
      console.error('Error in getPendingAssignments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get pending assignments'
      });
    }
  }
}

export default new LeadController();
