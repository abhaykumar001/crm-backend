import { Router } from 'express';
import leadController from '../controllers/lead.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all lead routes
router.use(authenticate);

/**
 * @route   POST /api/v1/leads
 * @desc    Create a new lead
 * @access  Private (admin, hr, team_leader, agent)
 */
router.post('/', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.createLead
);

/**
 * @route   GET /api/v1/leads
 * @desc    Get leads with filters and pagination
 * @access  Private (admin, hr, team_leader, agent)
 */
router.get('/', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.getLeads
);

/**
 * @route   GET /api/v1/leads/stats
 * @desc    Get lead statistics
 * @access  Private (admin, hr, team_leader)
 */
router.get('/stats', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.getLeadStats
);

/**
 * @route   POST /api/v1/leads/bulk-assign
 * @desc    Bulk assign leads to agent
 * @access  Private (admin, hr, team_leader)
 */
router.post('/bulk-assign', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.bulkAssignLeads
);

/**
 * @route   GET /api/v1/leads/:id
 * @desc    Get single lead by ID
 * @access  Private (admin, hr, team_leader, agent - own leads)
 */
router.get('/:id', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.getLeadById
);

/**
 * @route   PUT /api/v1/leads/:id
 * @desc    Update lead
 * @access  Private (admin, hr, team_leader, agent - own leads)
 */
router.put('/:id', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.updateLead
);

/**
 * @route   DELETE /api/v1/leads/:id
 * @desc    Delete lead (soft delete)
 * @access  Private (admin, hr, team_leader)
 */
router.delete('/:id', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.deleteLead
);

/**
 * @route   POST /api/v1/leads/:id/assign
 * @desc    Assign lead to agent
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/assign', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.assignLead
);

/**
 * @route   POST /api/v1/leads/:id/auto-assign
 * @desc    Auto-assign lead to best available agent
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/auto-assign', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.autoAssignLead
);

/**
 * @route   PUT /api/v1/leads/:id/status
 * @desc    Update lead status
 * @access  Private (admin, hr, team_leader, agent - own leads)
 */
router.put('/:id/status', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.updateLeadStatus
);

/**
 * @route   POST /api/v1/leads/:id/notes
 * @desc    Add note to lead
 * @access  Private (admin, hr, team_leader, agent - own leads)
 */
router.post('/:id/notes', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.addNote
);

/**
 * @route   GET /api/v1/leads/:id/history
 * @desc    Get lead history
 * @access  Private (admin, hr, team_leader, agent - own leads)
 */
router.get('/:id/history', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.getLeadHistory
);

/**
 * @route   GET /api/v1/leads/agent/:agentId/workload
 * @desc    Get agent workload statistics
 * @access  Private (admin, hr, team_leader)
 */
router.get('/agent/:agentId/workload', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.getAgentWorkload
);

/**
 * @route   GET /api/v1/leads/pending-assignments
 * @desc    Get pending assignments for current agent
 * @access  Private (agent, team_leader)
 */
router.get('/pending-assignments', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.getPendingAssignments
);

/**
 * @route   POST /api/v1/leads/:id/assign-round-robin
 * @desc    Assign lead via round-robin algorithm
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/assign-round-robin', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.assignLeadRoundRobin
);

/**
 * @route   POST /api/v1/leads/:id/assign-manual
 * @desc    Manually assign lead to specific agent
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/assign-manual', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.assignLeadManual
);

/**
 * @route   POST /api/v1/leads/:id/assign-multiple
 * @desc    Assign lead to multiple agents
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/assign-multiple', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.assignLeadToMultiple
);

/**
 * @route   POST /api/v1/leads/:id/reassign
 * @desc    Reassign lead from one agent to another
 * @access  Private (admin, hr, team_leader)
 */
router.post('/:id/reassign', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.reassignLead
);

/**
 * @route   POST /api/v1/leads/:id/accept
 * @desc    Agent accepts lead assignment
 * @access  Private (agent, team_leader)
 */
router.post('/:id/accept', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.acceptLeadAssignment
);

/**
 * @route   POST /api/v1/leads/:id/reject
 * @desc    Agent rejects lead assignment
 * @access  Private (agent, team_leader)
 */
router.post('/:id/reject', 
  requireRole('admin', 'hr', 'team_leader', 'agent'),
  leadController.rejectLeadAssignment
);

/**
 * @route   GET /api/v1/leads/:id/assignment-history
 * @desc    Get lead assignment history
 * @access  Private (admin, hr, team_leader)
 */
router.get('/:id/assignment-history', 
  requireRole('admin', 'hr', 'team_leader'),
  leadController.getLeadAssignmentHistory
);

export default router;
