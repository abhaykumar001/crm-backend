import { Router } from 'express';
import { dealController } from '../controllers/deal.controller';
import { authenticate, requirePermission, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/deals
 * @desc    Get all deals with filtering and pagination
 * @access  Private (deals.view permission)
 * @query   page, limit, search, status, agentId, projectId, minValue, maxValue, startDate, endDate, sortBy, sortOrder
 */
router.get(
  '/',
  requirePermission('deals.view'),
  dealController.getDeals
);

/**
 * @route   POST /api/v1/deals
 * @desc    Create a new deal
 * @access  Private (deals.create permission)
 * @body    leadId, projectId, agentId?, dealValue, commissionRate, status?, dealDate?, closingDate?, paymentTerms?, notes?
 */
router.post(
  '/',
  requirePermission('deals.create'),
  dealController.createDeal
);

/**
 * @route   GET /api/v1/deals/pipeline
 * @desc    Get deal pipeline statistics
 * @access  Private (deals.view permission)
 */
router.get(
  '/pipeline',
  requirePermission('deals.view'),
  dealController.getDealPipeline
);

/**
 * @route   POST /api/v1/deals/commission
 * @desc    Calculate commission for a deal
 * @access  Private (deals.edit permission or admin role)
 */
router.post(
  '/commission',
  requireRole('admin', 'hr', 'team_leader'),
  dealController.calculateCommission
);

/**
 * @route   GET /api/v1/deals/lead/:leadId
 * @desc    Get all deals for a specific lead
 * @access  Private (deals.view permission)
 * @param   leadId - Lead ID
 */
router.get(
  '/lead/:leadId',
  requirePermission('deals.view'),
  dealController.getDealsByLead
);

/**
 * @route   GET /api/v1/deals/project/:projectId
 * @desc    Get all deals for a specific project
 * @access  Private (deals.view permission)
 * @param   projectId - Project ID
 */
router.get(
  '/project/:projectId',
  requirePermission('deals.view'),
  dealController.getDealsByProject
);

/**
 * @route   GET /api/v1/deals/:id
 * @desc    Get deal by ID
 * @access  Private (deals.view permission)
 * @param   id - Deal ID
 */
router.get(
  '/:id',
  requirePermission('deals.view'),
  dealController.getDealById
);

/**
 * @route   PUT /api/v1/deals/:id
 * @desc    Update deal
 * @access  Private (deals.edit permission or own deal)
 * @param   id - Deal ID
 * @body    leadId?, projectId?, agentId?, dealValue?, commissionRate?, status?, dealDate?, closingDate?, paymentTerms?, notes?
 */
router.put(
  '/:id',
  requirePermission('deals.edit'),
  dealController.updateDeal
);

/**
 * @route   DELETE /api/v1/deals/:id
 * @desc    Delete deal (soft delete)
 * @access  Private (deals.delete permission or admin role)
 * @param   id - Deal ID
 */
router.delete(
  '/:id',
  requireRole('admin', 'hr', 'team_leader'),
  dealController.deleteDeal
);

/**
 * @route   POST /api/v1/deals/:id/approve
 * @desc    Approve or reject a deal
 * @access  Private (admin, hr, or team_leader role)
 * @param   id - Deal ID
 * @body    action ('approve' | 'reject'), comments?, rejectionReason?
 */
router.post(
  '/:id/approve',
  requireRole('admin', 'hr', 'team_leader'),
  dealController.approveDeal
);

/**
 * @route   PUT /api/v1/deals/:id/status
 * @desc    Update deal status
 * @access  Private (deals.edit permission)
 * @param   id - Deal ID
 * @body    status, reason?, closingDate?
 */
router.put(
  '/:id/status',
  requirePermission('deals.edit'),
  dealController.updateDealStatus
);

/**
 * @route   POST /api/v1/deals/:id/payment
 * @desc    Add payment record to deal
 * @access  Private (deals.edit permission or admin role)
 * @param   id - Deal ID
 * @body    paymentAmount, paymentDate?, paymentMethod, transactionId?, receiptNumber?, notes?
 */
router.post(
  '/:id/payment',
  requirePermission('deals.edit'),
  dealController.addPayment
);

/**
 * @route   GET /api/v1/deals/:id/payments
 * @desc    Get all payment records for a deal
 * @access  Private (deals.view permission)
 * @param   id - Deal ID
 */
router.get(
  '/:id/payments',
  requirePermission('deals.view'),
  dealController.getDealPayments
);

export default router;
