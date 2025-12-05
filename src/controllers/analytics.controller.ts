import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import logger from '../utils/logger';

// Extend Request interface to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
}

class AnalyticsController {
  // ==================== DASHBOARD STATISTICS ====================

  // Get dashboard statistics
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { startDate, endDate, includeComparison } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await analyticsService.getDashboardStats(
        req.user.id,
        req.user.roles[0] || 'agent',
        start,
        end
      );

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Error in getDashboardStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics'
      });
    }
  }

  // ==================== LEAD ANALYTICS ====================

  // Get lead analytics
  async getLeadAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const analytics = await analyticsService.getLeadAnalytics(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.query
      );

      res.json({
        success: true,
        message: 'Lead analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getLeadAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lead analytics'
      });
    }
  }

  // ==================== SALES ANALYTICS ====================

  // Get sales analytics
  async getSalesAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const analytics = await analyticsService.getSalesAnalytics(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.query
      );

      res.json({
        success: true,
        message: 'Sales analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getSalesAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sales analytics'
      });
    }
  }

  // ==================== AGENT PERFORMANCE ====================

  // Get agent performance
  async getAgentPerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const performance = await analyticsService.getAgentPerformance(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.query
      );

      res.json({
        success: true,
        message: 'Agent performance retrieved successfully',
        data: performance
      });
    } catch (error) {
      logger.error('Error in getAgentPerformance controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve agent performance'
      });
    }
  }

  // ==================== CONVERSION FUNNEL ====================

  // Get conversion funnel
  async getConversionFunnel(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const funnel = await analyticsService.getConversionFunnel(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.query
      );

      res.json({
        success: true,
        message: 'Conversion funnel retrieved successfully',
        data: funnel
      });
    } catch (error) {
      logger.error('Error in getConversionFunnel controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversion funnel'
      });
    }
  }

  // ==================== REVENUE ANALYTICS ====================

  // Get revenue analytics (using sales analytics with revenue focus)
  async getRevenueAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Use sales analytics but focus on revenue metrics
      const analytics = await analyticsService.getSalesAnalytics(
        req.user.id,
        req.user.roles[0] || 'agent',
        { ...req.query, includeCommissions: true }
      );

      res.json({
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: {
          totalRevenue: analytics.totalRevenue,
          revenueTrend: analytics.revenueTrend,
          averageDealValue: analytics.averageDealValue,
          monthlyGrowth: analytics.monthlyGrowth,
          revenueByAgent: analytics.salesByAgent,
          revenueByProject: analytics.salesByProject
        }
      });
    } catch (error) {
      logger.error('Error in getRevenueAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue analytics'
      });
    }
  }

  // ==================== PROJECT PERFORMANCE ====================

  // Get project performance analytics
  async getProjectPerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Use sales analytics filtered by project
      const analytics = await analyticsService.getSalesAnalytics(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.query
      );

      res.json({
        success: true,
        message: 'Project performance retrieved successfully',
        data: {
          projectPerformance: analytics.salesByProject,
          totalProjects: analytics.salesByProject.length,
          averageRevenuePerProject: analytics.salesByProject.length > 0 
            ? analytics.salesByProject.reduce((sum, p) => sum + p.revenue, 0) / analytics.salesByProject.length 
            : 0
        }
      });
    } catch (error) {
      logger.error('Error in getProjectPerformance controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project performance'
      });
    }
  }

  // ==================== COMMUNICATION ANALYTICS ====================

  // Get communication analytics
  async getCommunicationAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Placeholder for communication analytics
      // This would integrate with the communication service
      const mockAnalytics = {
        totalCalls: 150,
        totalSMS: 89,
        totalEmails: 200,
        totalWhatsApp: 45,
        callAnswerRate: 85.5,
        averageCallDuration: 180,
        communicationTrend: [
          { date: '2024-01-01', calls: 20, sms: 15, emails: 25 },
          { date: '2024-01-02', calls: 25, sms: 18, emails: 30 }
        ],
        responseRates: {
          calls: 85.5,
          sms: 92.1,
          emails: 45.2,
          whatsapp: 88.7
        }
      };

      res.json({
        success: true,
        message: 'Communication analytics retrieved successfully',
        data: mockAnalytics
      });
    } catch (error) {
      logger.error('Error in getCommunicationAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve communication analytics'
      });
    }
  }

  // ==================== CUSTOM REPORTS ====================

  // Generate custom report
  async generateCustomReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const report = await analyticsService.generateCustomReport(
        req.user.id,
        req.user.roles[0] || 'agent',
        req.body
      );

      res.json({
        success: true,
        message: 'Custom report generated successfully',
        data: report
      });
    } catch (error) {
      logger.error('Error in generateCustomReport controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Export report
  async exportReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { reportType, format, fileName } = req.query;

      // This would generate the actual file export
      // For now, return a mock response
      const mockExport = {
        downloadUrl: `/api/v1/analytics/download/${fileName || 'report'}.${format}`,
        fileSize: '2.5MB',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      res.json({
        success: true,
        message: `${reportType} report exported successfully as ${format}`,
        data: mockExport
      });
    } catch (error) {
      logger.error('Error in exportReport controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report'
      });
    }
  }

  // ==================== ADVANCED ANALYTICS ====================

  // Get lead scoring analytics
  async getLeadScoringAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Mock lead scoring analytics
      const scoringAnalytics = {
        averageLeadScore: 67.5,
        scoreDistribution: [
          { range: '0-20', count: 15, percentage: 10.5 },
          { range: '21-40', count: 25, percentage: 17.5 },
          { range: '41-60', count: 40, percentage: 28.0 },
          { range: '61-80', count: 35, percentage: 24.5 },
          { range: '81-100', count: 28, percentage: 19.6 }
        ],
        topScoringFactors: [
          { factor: 'Budget Qualification', impact: 25.3 },
          { factor: 'Response Time', impact: 18.7 },
          { factor: 'Engagement Level', impact: 16.2 },
          { factor: 'Source Quality', impact: 14.8 },
          { factor: 'Follow-up Frequency', impact: 12.1 }
        ],
        conversionByScore: [
          { scoreRange: '80-100', conversionRate: 85.2 },
          { scoreRange: '60-79', conversionRate: 62.1 },
          { scoreRange: '40-59', conversionRate: 35.7 },
          { scoreRange: '20-39', conversionRate: 18.4 },
          { scoreRange: '0-19', conversionRate: 5.8 }
        ]
      };

      res.json({
        success: true,
        message: 'Lead scoring analytics retrieved successfully',
        data: scoringAnalytics
      });
    } catch (error) {
      logger.error('Error in getLeadScoringAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lead scoring analytics'
      });
    }
  }

  // Get predictive analytics
  async getPredictiveAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Mock predictive analytics
      const predictiveAnalytics = {
        nextMonthProjections: {
          expectedLeads: 180,
          expectedDeals: 45,
          expectedRevenue: 2250000,
          confidence: 78.5
        },
        leadConversionPredictions: [
          { leadId: 1, leadName: 'John Doe', conversionProbability: 85.2, expectedCloseDate: '2024-02-15' },
          { leadId: 2, leadName: 'Jane Smith', conversionProbability: 72.1, expectedCloseDate: '2024-02-20' },
          { leadId: 3, leadName: 'Bob Johnson', conversionProbability: 68.9, expectedCloseDate: '2024-02-25' }
        ],
        marketTrends: {
          seasonalityFactor: 1.15,
          marketGrowthRate: 8.2,
          competitiveIndex: 0.85,
          demandForecast: 'increasing'
        },
        riskFactors: [
          { factor: 'Market Volatility', risk: 'medium', impact: 15.2 },
          { factor: 'Seasonal Decline', risk: 'low', impact: 8.7 },
          { factor: 'Competition', risk: 'high', impact: 22.1 }
        ]
      };

      res.json({
        success: true,
        message: 'Predictive analytics retrieved successfully',
        data: predictiveAnalytics
      });
    } catch (error) {
      logger.error('Error in getPredictiveAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve predictive analytics'
      });
    }
  }
}

export const analyticsController = new AnalyticsController();