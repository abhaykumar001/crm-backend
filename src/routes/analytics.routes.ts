import express from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ==================== DASHBOARD ROUTES ====================

// Get dashboard statistics
router.get('/dashboard/stats',
  analyticsController.getDashboardStats
);

// ==================== LEAD ANALYTICS ROUTES ====================

// Get lead analytics
router.get('/leads',
  analyticsController.getLeadAnalytics
);

// Get conversion funnel
router.get('/leads/conversion-funnel',
  analyticsController.getConversionFunnel
);

// Get lead scoring analytics
router.get('/leads/scoring',
  analyticsController.getLeadScoringAnalytics
);

// ==================== SALES ANALYTICS ROUTES ====================

// Get sales analytics
router.get('/sales',
  analyticsController.getSalesAnalytics
);

// Get revenue analytics
router.get('/revenue',
  analyticsController.getRevenueAnalytics
);

// ==================== AGENT PERFORMANCE ROUTES ====================

// Get agent performance
router.get('/agents/performance',
  analyticsController.getAgentPerformance
);

// ==================== PROJECT ANALYTICS ROUTES ====================

// Get project performance
router.get('/projects/performance',
  analyticsController.getProjectPerformance
);

// ==================== COMMUNICATION ANALYTICS ROUTES ====================

// Get communication analytics
router.get('/communication',
  analyticsController.getCommunicationAnalytics
);

// ==================== ADVANCED ANALYTICS ROUTES ====================

// Get predictive analytics
router.get('/predictive',
  analyticsController.getPredictiveAnalytics
);

// ==================== REPORTS ROUTES ====================

// Generate custom report
router.post('/reports/custom',
  analyticsController.generateCustomReport
);

// Export report
router.get('/reports/export',
  analyticsController.exportReport
);

export default router;