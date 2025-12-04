import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Interfaces for analytics data
export interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  totalAgents: number;
  leadsThisMonth: number;
  dealsThisMonth: number;
  revenueThisMonth: number;
  conversionRate: number;
  averageDealValue: number;
  activeProjects: number;
  pendingFollowUps: number;
  recentActivity: any[];
}

export interface LeadAnalytics {
  totalLeads: number;
  leadsByStatus: any[];
  leadsBySource: any[];
  leadsTrend: any[];
  conversionRate: number;
  averageResponseTime: number;
  topPerformingAgents: any[];
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalDeals: number;
  averageDealValue: number;
  revenueTrend: any[];
  dealsByStatus: any[];
  salesByAgent: any[];
  salesByProject: any[];
  monthlyGrowth: number;
}

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalDeals: number;
  totalRevenue: number;
  totalCalls: number;
  averageCallDuration: number;
  responseTime: number;
  rank: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  projectedRevenue: number;
  revenueTrend: any[];
  revenueByProject: any[];
  commissionsPaid: number;
  netRevenue: number;
  growthRate: number;
}

export interface CommunicationAnalytics {
  totalCalls: number;
  totalSMS: number;
  totalEmails: number;
  totalWhatsApp: number;
  callAnswerRate: number;
  averageCallDuration: number;
  communicationTrend: any[];
  responseRates: any[];
}

export interface ConversionFunnel {
  stages: {
    stage: string;
    count: number;
    percentage: number;
    dropOffRate: number;
  }[];
  totalEntered: number;
  totalConverted: number;
  overallConversionRate: number;
  averageTimeToConversion: number;
}

class AnalyticsService {
  // ==================== DASHBOARD STATISTICS ====================

  async getDashboardStats(userId: number, userRole: string, startDate?: Date, endDate?: Date) {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Base where clause for role-based filtering
      const baseWhere: any = {};
      if (userRole === 'agent') {
        baseWhere.agentId = userId;
      }

      // Date filtering
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      // Get total counts
      const [
        totalLeads,
        totalDeals,
        totalAgents,
        activeProjects,
        leadsThisMonth,
        dealsThisMonth,
        leadsLastMonth
      ] = await Promise.all([
        prisma.lead.count({ 
          where: { 
            ...baseWhere, 
            isActive: true,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
          } 
        }),
        prisma.deal.count({ 
          where: { 
            ...baseWhere,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
          } 
        }),
        userRole === 'agent' ? 1 : prisma.user.count({ 
          where: { 
            roles: { some: { role: { name: 'agent' } } }, 
            isActive: true 
          } 
        }),
        prisma.project.count({ 
          where: { isActive: true } 
        }),
        prisma.lead.count({
          where: {
            ...baseWhere,
            isActive: true,
            createdAt: { gte: thisMonthStart }
          }
        }),
        prisma.deal.count({
          where: {
            ...baseWhere,
            createdAt: { gte: thisMonthStart }
          }
        }),
        prisma.lead.count({
          where: {
            ...baseWhere,
            isActive: true,
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
          }
        })
      ]);

      // Calculate revenue
      const revenueResult = await prisma.deal.aggregate({
        where: {
          ...baseWhere,
          status: 'completed',
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
        },
        _sum: { dealValue: true }
      });

      const revenueThisMonthResult = await prisma.deal.aggregate({
        where: {
          ...baseWhere,
          status: 'completed',
          createdAt: { gte: thisMonthStart }
        },
        _sum: { dealValue: true }
      });

      const totalRevenue = Number(revenueResult._sum?.dealValue || 0);
      const revenueThisMonth = Number(revenueThisMonthResult._sum?.dealValue || 0);

      // Calculate conversion rate
      const convertedLeads = await prisma.lead.count({
        where: {
          ...baseWhere,
          statusId: 5, // Assuming 5 is converted status ID
          isActive: true,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
        }
      });

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average deal value
      const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

      // Get pending follow-ups (leads not contacted in last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pendingFollowUps = await prisma.lead.count({
        where: {
          ...baseWhere,
          isActive: true,
          statusId: { in: [1, 2, 3] }, // Assuming 1=new, 2=contacted, 3=qualified
          OR: [
            { lastContactDate: { lt: yesterday } },
            { lastContactDate: null }
          ]
        }
      });

      // Get recent activity
      const recentActivity = await prisma.$queryRaw`
        SELECT 'lead' as type, id, 'New lead created' as activity, "created_at" as timestamp
        FROM "leads" 
        WHERE ${userRole === 'agent' ? Prisma.sql`"agent_id" = ${userId}` : Prisma.sql`1=1`}
        AND "created_at" >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT 'deal' as type, id, 'Deal created' as activity, "created_at" as timestamp
        FROM "deals"
        WHERE ${userRole === 'agent' ? Prisma.sql`"agent_id" = ${userId}` : Prisma.sql`1=1`}
        AND "created_at" >= NOW() - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 10
      `;

      const dashboardStats: DashboardStats = {
        totalLeads,
        totalDeals,
        totalRevenue,
        totalAgents,
        leadsThisMonth,
        dealsThisMonth,
        revenueThisMonth,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealValue: Math.round(averageDealValue * 100) / 100,
        activeProjects,
        pendingFollowUps,
        recentActivity: recentActivity as any[]
      };

      logger.info(`Generated dashboard stats for user ${userId}`);
      return dashboardStats;
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  // ==================== LEAD ANALYTICS ====================

  async getLeadAnalytics(userId: number, userRole: string, query: any) {
    try {
      const { startDate, endDate, agentId, source, status, groupBy } = query;

      // Base where clause
      const baseWhere: any = { isActive: true };
      if (userRole === 'agent') {
        baseWhere.agentId = userId;
      } else if (agentId) {
        baseWhere.agentId = agentId;
      }

      if (source) baseWhere.source = source;
      if (status) baseWhere.status = status;

      // Date filtering
      if (startDate || endDate) {
        baseWhere.createdAt = {};
        if (startDate) baseWhere.createdAt.gte = new Date(startDate);
        if (endDate) baseWhere.createdAt.lte = new Date(endDate);
      }

      // Get total leads
      const totalLeads = await prisma.lead.count({ where: baseWhere });

      // Get leads by status (using status relation)
      const leadsByStatus = await prisma.lead.groupBy({
        by: ['statusId'],
        where: baseWhere,
        _count: { id: true }
      });

      // Get leads by source (using source relation)
      const leadsBySource = await prisma.lead.groupBy({
        by: ['sourceId'],
        where: baseWhere,
        _count: { id: true }
      });

      // Get leads trend based on groupBy
      let leadsTrend: any[] = [];
      if (groupBy === 'day') {
        leadsTrend = await prisma.$queryRaw`
          SELECT DATE("created_at") as date, COUNT(*) as count
          FROM "leads"
          WHERE ${baseWhere.agentId ? Prisma.sql`"agent_id" = ${baseWhere.agentId}` : Prisma.sql`1=1`}
          ${baseWhere.createdAt?.gte ? Prisma.sql`AND "created_at" >= ${baseWhere.createdAt.gte}` : Prisma.sql``}
          ${baseWhere.createdAt?.lte ? Prisma.sql`AND "created_at" <= ${baseWhere.createdAt.lte}` : Prisma.sql``}
          AND "is_active" = true
          GROUP BY DATE("created_at")
          ORDER BY date DESC
          LIMIT 30
        `;
      }

      // Calculate conversion rate
      const convertedLeads = await prisma.lead.count({
        where: { ...baseWhere, statusId: 5 } // Assuming 5 is converted status ID
      });
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average response time
      const responseTimeResult = await prisma.lead.aggregate({
        where: {
          ...baseWhere,
          lastContactDate: { not: null },
          createdAt: { not: null }
        },
        _avg: {
          id: true // We'll calculate this differently in real implementation
        }
      });

      // Get top performing agents
      const topPerformingAgents = await prisma.lead.groupBy({
        by: ['agentId'],
        where: { ...baseWhere, statusId: 5 }, // Assuming 5 is converted status ID
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // Get agent details
      const agentIds = topPerformingAgents.map(a => a.agentId).filter((id): id is number => id !== null);
      const agents = agentIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, email: true }
      }) : [];

      const topAgentsWithDetails = topPerformingAgents.map(agent => {
        const agentDetail = agents.find(a => a.id === agent.agentId);
        return {
          ...agent,
          agentName: agentDetail?.name || 'Unknown',
          agentEmail: agentDetail?.email || ''
        };
      });

      const leadAnalytics: LeadAnalytics = {
        totalLeads,
        leadsByStatus: leadsByStatus.map(item => ({
          statusId: item.statusId,
          count: item._count.id
        })),
        leadsBySource: leadsBySource.map(item => ({
          sourceId: item.sourceId,
          count: item._count.id
        })),
        leadsTrend: leadsTrend as any[],
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageResponseTime: 2.5, // Placeholder - would calculate from actual data
        topPerformingAgents: topAgentsWithDetails
      };

      logger.info(`Generated lead analytics for user ${userId}`);
      return leadAnalytics;
    } catch (error) {
      logger.error('Error getting lead analytics:', error);
      throw new Error('Failed to retrieve lead analytics');
    }
  }

  // ==================== SALES ANALYTICS ====================

  async getSalesAnalytics(userId: number, userRole: string, query: any) {
    try {
      const { startDate, endDate, agentId, projectId, dealStatus, groupBy, includeCommissions } = query;

      // Base where clause
      const baseWhere: any = {};
      if (userRole === 'agent') {
        baseWhere.agentId = userId;
      } else if (agentId) {
        baseWhere.agentId = agentId;
      }

      if (projectId) baseWhere.projectId = projectId;
      if (dealStatus) baseWhere.status = dealStatus;

      // Date filtering
      if (startDate || endDate) {
        baseWhere.createdAt = {};
        if (startDate) baseWhere.createdAt.gte = new Date(startDate);
        if (endDate) baseWhere.createdAt.lte = new Date(endDate);
      }

      // Get total deals and revenue
        const [totalDeals, revenueResult] = await Promise.all([
        prisma.deal.count({ where: baseWhere }),
        prisma.deal.aggregate({
          where: { ...baseWhere, status: 'completed' },
          _sum: { dealValue: true }
        })
      ]);

      const totalRevenue = Number(revenueResult._sum?.dealValue || 0);
      const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

      // Get revenue trend
      let revenueTrend: any[] = [];
      if (groupBy === 'month') {
        revenueTrend = await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "created_at") as month,
            COUNT(*) as deals,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN "deal_value" ELSE 0 END), 0) as revenue
          FROM "deals"
          WHERE ${baseWhere.agentId ? Prisma.sql`"agent_id" = ${baseWhere.agentId}` : Prisma.sql`1=1`}
          ${baseWhere.createdAt?.gte ? Prisma.sql`AND "created_at" >= ${baseWhere.createdAt.gte}` : Prisma.sql``}
          ${baseWhere.createdAt?.lte ? Prisma.sql`AND "created_at" <= ${baseWhere.createdAt.lte}` : Prisma.sql``}
          GROUP BY DATE_TRUNC('month', "created_at")
          ORDER BY month DESC
          LIMIT 12
        `;
      }

      // Get deals by status
      const dealsByStatus = await prisma.deal.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true },
        _sum: { dealValue: true }
      });

      // Get sales by agent
      const salesByAgent = await prisma.deal.groupBy({
        by: ['agentId'],
        where: { ...baseWhere, status: 'completed' },
        _count: { id: true },
        _sum: { dealValue: true },
        orderBy: { _sum: { dealValue: 'desc' } },
        take: 10
      });

      // Get agent details
      const agentIds = salesByAgent.map(s => s.agentId).filter((id): id is number => id !== null);
      const agents = agentIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, email: true }
      }) : [];

      const salesByAgentWithDetails = salesByAgent.map(sale => {
        const agentDetail = agents.find(a => a.id === sale.agentId);
        return {
          agentId: sale.agentId,
          agentName: agentDetail?.name || 'Unknown',
          deals: sale._count.id,
          revenue: Number(sale._sum.dealValue || 0)
        };
      });

      // Get sales by project
      const salesByProject = await prisma.deal.groupBy({
        by: ['projectId'],
        where: { ...baseWhere, status: 'completed' },
        _count: { id: true },
        _sum: { dealValue: true },
        orderBy: { _sum: { dealValue: 'desc' } },
        take: 10
      });

      // Get project details
      const projectIds = salesByProject.map(s => s.projectId).filter((id): id is number => id !== null);
      const projects = projectIds.length > 0 ? await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, location: true }
      }) : [];

      const salesByProjectWithDetails = salesByProject.map(sale => {
        const projectDetail = projects.find(p => p.id === sale.projectId);
        return {
          projectId: sale.projectId,
          projectName: projectDetail?.name || 'Unknown',
          deals: sale._count.id,
          revenue: Number(sale._sum.dealValue || 0)
        };
      });

      // Calculate monthly growth
      const monthlyGrowth = 15.5; // Placeholder - would calculate from actual data

      const salesAnalytics: SalesAnalytics = {
        totalRevenue,
        totalDeals,
        averageDealValue: Math.round(averageDealValue * 100) / 100,
        revenueTrend: revenueTrend as any[],
        dealsByStatus: dealsByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          revenue: Number(item._sum.dealValue || 0)
        })),
        salesByAgent: salesByAgentWithDetails,
        salesByProject: salesByProjectWithDetails,
        monthlyGrowth
      };

      logger.info(`Generated sales analytics for user ${userId}`);
      return salesAnalytics;
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      throw new Error('Failed to retrieve sales analytics');
    }
  }

  // ==================== AGENT PERFORMANCE ====================

  async getAgentPerformance(userId: number, userRole: string, query: any) {
    try {
      const { startDate, endDate, agentId, includeCallStats, includeLeadStats, includeDealStats, sortBy, sortOrder, limit } = query;

      // Base where clause for filtering
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Get agent list to analyze
      let agentIds: number[] = [];
      if (userRole === 'agent') {
        agentIds = [userId];
      } else if (agentId) {
        agentIds = [agentId];
      } else {
        const agents = await prisma.user.findMany({
          where: { 
            roles: { some: { role: { name: 'agent' } } }, 
            isActive: true 
          },
          select: { id: true }
        });
        agentIds = agents.map(a => a.id);
      }

      const agentPerformanceData: AgentPerformance[] = [];

      for (const currentAgentId of agentIds) {
        // Get agent details
        const agent = await prisma.user.findUnique({
          where: { id: currentAgentId },
          select: { id: true, name: true, email: true }
        });

        if (!agent) continue;

        // Lead statistics
        let totalLeads = 0;
        let convertedLeads = 0;
        if (includeLeadStats) {
          const leadWhere: any = { agentId: currentAgentId, isActive: true };
          if (Object.keys(dateFilter).length) leadWhere.createdAt = dateFilter;

          [totalLeads, convertedLeads] = await Promise.all([
            prisma.lead.count({ where: leadWhere }),
            prisma.lead.count({ where: { ...leadWhere, statusId: 5 } }) // Assuming 5 is converted status ID
          ]);
        }

        // Deal statistics
        let totalDeals = 0;
        let totalRevenue = 0;
        if (includeDealStats) {
          const dealWhere: any = { agentId: currentAgentId };
          if (Object.keys(dateFilter).length) dealWhere.createdAt = dateFilter;

          const [dealsCount, revenueResult] = await Promise.all([
            prisma.deal.count({ where: dealWhere }),
            prisma.deal.aggregate({
              where: { ...dealWhere, status: 'completed' },
              _sum: { dealValue: true }
            })
          ]);

          totalDeals = dealsCount;
          totalRevenue = Number(revenueResult._sum?.dealValue || 0);
        }

        // Call statistics
        let totalCalls = 0;
        let averageCallDuration = 0;
        if (includeCallStats) {
          const callWhere: any = { agentId: currentAgentId };
          if (Object.keys(dateFilter).length) callWhere.callStartTime = dateFilter;

          const [callsCount, durationResult] = await Promise.all([
            prisma.callLog.count({ where: callWhere }),
            prisma.callLog.aggregate({
              where: { ...callWhere, callDuration: { not: null } },
              _avg: { callDuration: true }
            })
          ]);

          totalCalls = callsCount;
          averageCallDuration = Math.round(durationResult._avg.callDuration || 0);
        }

        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        agentPerformanceData.push({
          agentId: currentAgentId,
          agentName: agent.name,
          totalLeads,
          convertedLeads,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalDeals,
          totalRevenue,
          totalCalls,
          averageCallDuration,
          responseTime: 2.5, // Placeholder
          rank: 0 // Will be calculated after sorting
        });
      }

      // Sort agents based on sortBy criteria
      const sortedAgents = agentPerformanceData.sort((a, b) => {
        let aValue: number, bValue: number;
        
        switch (sortBy) {
          case 'leads':
            aValue = a.totalLeads;
            bValue = b.totalLeads;
            break;
          case 'deals':
            aValue = a.totalDeals;
            bValue = b.totalDeals;
            break;
          case 'revenue':
            aValue = a.totalRevenue;
            bValue = b.totalRevenue;
            break;
          case 'calls':
            aValue = a.totalCalls;
            bValue = b.totalCalls;
            break;
          case 'conversion':
            aValue = a.conversionRate;
            bValue = b.conversionRate;
            break;
          default:
            aValue = a.totalRevenue;
            bValue = b.totalRevenue;
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });

      // Add ranks
      sortedAgents.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      const limitedResults = sortedAgents.slice(0, limit);

      logger.info(`Generated agent performance for user ${userId}`);
      return limitedResults;
    } catch (error) {
      logger.error('Error getting agent performance:', error);
      throw new Error('Failed to retrieve agent performance');
    }
  }

  // ==================== CONVERSION FUNNEL ====================

  async getConversionFunnel(userId: number, userRole: string, query: any) {
    try {
      const { startDate, endDate, agentId, source, includeTimeToConversion } = query;

      // Base where clause
      const baseWhere: any = { isActive: true };
      if (userRole === 'agent') {
        baseWhere.agentId = userId;
      } else if (agentId) {
        baseWhere.agentId = agentId;
      }

      if (source) baseWhere.source = source;

      // Date filtering
      if (startDate || endDate) {
        baseWhere.createdAt = {};
        if (startDate) baseWhere.createdAt.gte = new Date(startDate);
        if (endDate) baseWhere.createdAt.lte = new Date(endDate);
      }

      // Define funnel stages - we'll need to look up status IDs
      // For now, using placeholder logic that would need actual status lookup
      const funnelStages = [
        { stage: 'Total Leads', statusId: null },
        { stage: 'Contacted', statusId: 2 },
        { stage: 'Qualified', statusId: 3 },
        { stage: 'Nurturing', statusId: 4 },
        { stage: 'Converted', statusId: 5 }
      ];

      const stageResults = [];
      let previousCount = 0;

      for (const [index, stage] of funnelStages.entries()) {
        const whereClause = stage.statusId 
          ? { ...baseWhere, statusId: stage.statusId }
          : baseWhere;

        const count = await prisma.lead.count({ where: whereClause });
        
        const percentage = index === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;
        const dropOffRate = index === 0 ? 0 : previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

        stageResults.push({
          stage: stage.stage,
          count,
          percentage: Math.round(percentage * 100) / 100,
          dropOffRate: Math.round(dropOffRate * 100) / 100
        });

        if (index === 0) previousCount = count;
      }

      const totalEntered = stageResults[0]?.count || 0;
      const totalConverted = stageResults[stageResults.length - 1]?.count || 0;
      const overallConversionRate = totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0;

      // Calculate average time to conversion (placeholder)
      const averageTimeToConversion = 14.5; // days - would calculate from actual data

      const conversionFunnel: ConversionFunnel = {
        stages: stageResults,
        totalEntered,
        totalConverted,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
        averageTimeToConversion
      };

      logger.info(`Generated conversion funnel for user ${userId}`);
      return conversionFunnel;
    } catch (error) {
      logger.error('Error getting conversion funnel:', error);
      throw new Error('Failed to retrieve conversion funnel');
    }
  }

  // ==================== CUSTOM REPORTS ====================

  async generateCustomReport(userId: number, userRole: string, query: any) {
    try {
      const { reportType, startDate, endDate, filters, groupBy, metrics, format } = query;

      let reportData: any = {};

      switch (reportType) {
        case 'leads':
          reportData = await this.getLeadAnalytics(userId, userRole, { startDate, endDate, ...filters });
          break;
        case 'deals':
          reportData = await this.getSalesAnalytics(userId, userRole, { startDate, endDate, ...filters });
          break;
        case 'revenue':
          reportData = await this.getSalesAnalytics(userId, userRole, { startDate, endDate, ...filters });
          break;
        case 'agents':
          reportData = await this.getAgentPerformance(userId, userRole, { startDate, endDate, ...filters });
          break;
        case 'communication':
          // Would implement communication analytics
          reportData = { message: 'Communication analytics not yet implemented' };
          break;
        default:
          throw new Error('Invalid report type');
      }

      const customReport = {
        reportType,
        generatedAt: new Date(),
        generatedBy: userId,
        filters: { startDate, endDate, ...filters },
        data: reportData,
        format
      };

      logger.info(`Generated custom ${reportType} report for user ${userId}`);
      return customReport;
    } catch (error) {
      logger.error('Error generating custom report:', error);
      throw new Error('Failed to generate custom report');
    }
  }
}

export const analyticsService = new AnalyticsService();