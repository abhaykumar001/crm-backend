import { PrismaClient, Campaign, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface CampaignWithDetails extends Campaign {
  sources?: any[];
  managers?: any[];
  leads?: any[];
  events?: any[];
  _count?: {
    sources: number;
    leads: number;
    managers: number;
    events: number;
  };
}

interface CampaignPerformance {
  campaignId: number;
  campaignName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  roi: number;
  avgDealValue: number;
  costPerLead: number;
  costPerConversion: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
}

interface CampaignFilters {
  status?: number;
  isInternational?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

class CampaignService {
  /**
   * Get all campaigns with optional filters
   */
  async getAllCampaigns(filters?: CampaignFilters) {
    const where: Prisma.CampaignWhereInput = {};

    if (filters) {
      if (filters.status !== undefined) {
        where.status = filters.status;
      }
      if (filters.isInternational !== undefined) {
        where.isInternational = filters.isInternational;
      }
      if (filters.startDate) {
        where.startDate = { gte: filters.startDate };
      }
      if (filters.endDate) {
        where.endDate = { lte: filters.endDate };
      }
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { secondaryName: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        sources: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            sources: true,
            leads: true,
            managers: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns;
  }

  /**
   * Get single campaign by ID with full details
   */
  async getCampaignById(id: number): Promise<CampaignWithDetails | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        sources: {
          include: {
            sourceUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    availability: true,
                    isExcluded: true,
                  },
                },
              },
            },
            _count: {
              select: {
                leads: true,
                subSources: true,
              },
            },
          },
        },
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
              },
            },
          },
        },
        events: {
          select: {
            id: true,
            name: true,
            location: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        leads: {
          select: {
            id: true,
            name: true,
            statusId: true,
            createdAt: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            sources: true,
            leads: true,
            managers: true,
            events: true,
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Create new campaign
   */
  async createCampaign(data: {
    name: string;
    secondaryName?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    status?: number;
    isInternational?: boolean;
    managerIds?: number[];
  }) {
    const { managerIds, ...campaignData } = data;

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        managers: managerIds
          ? {
              create: managerIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    id: number,
    data: {
      name?: string;
      secondaryName?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      budget?: number;
      status?: number;
      isInternational?: boolean;
      managerIds?: number[];
    }
  ) {
    const { managerIds, ...campaignData } = data;

    // If managerIds provided, update campaign managers
    if (managerIds !== undefined) {
      // Delete existing managers
      await prisma.campaignManager.deleteMany({
        where: { campaignId: id },
      });

      // Create new managers
      await prisma.campaignManager.createMany({
        data: managerIds.map((userId) => ({
          campaignId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: campaignData,
      include: {
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            sources: true,
            leads: true,
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Delete campaign (soft delete by setting status to 0)
   */
  async deleteCampaign(id: number) {
    // Set campaign to inactive instead of deleting
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 0 },
    });

    return campaign;
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(
    campaignId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignPerformance> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        budget: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get total leads
    const totalLeads = await prisma.lead.count({
      where: {
        campaignId,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
    });

    // Get converted leads (deals closed)
    const convertedLeads = await prisma.lead.count({
      where: {
        campaignId,
        deals: {
          some: {
            status: 'closed',
          },
        },
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
    });

    // Get total revenue from deals
    const deals = await prisma.deal.findMany({
      where: {
        lead: {
          campaignId,
        },
        status: 'closed',
        ...(startDate || endDate ? { closingDate: dateFilter } : {}),
      },
      select: {
        dealValue: true,
      },
    });

    const totalRevenue = deals.reduce(
      (sum, deal) => sum + Number(deal.dealValue),
      0
    );

    // Calculate metrics
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const avgDealValue = convertedLeads > 0 ? totalRevenue / convertedLeads : 0;
    const budget = Number(campaign.budget || 0);
    const roi = budget > 0 ? ((totalRevenue - budget) / budget) * 100 : 0;
    const costPerLead = totalLeads > 0 ? budget / totalLeads : 0;
    const costPerConversion =
      convertedLeads > 0 ? budget / convertedLeads : 0;

    // Get leads by status
    const leadsByStatusData = await prisma.lead.groupBy({
      by: ['statusId'],
      where: {
        campaignId,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _count: true,
    });

    const statuses = await prisma.status.findMany({
      select: { id: true, name: true },
    });

    const leadsByStatus: Record<string, number> = {};
    leadsByStatusData.forEach((item) => {
      const status = statuses.find((s) => s.id === item.statusId);
      if (status) {
        leadsByStatus[status.name] = item._count;
      }
    });

    // Get leads by source
    const leadsBySourceData = await prisma.lead.groupBy({
      by: ['sourceId'],
      where: {
        campaignId,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      _count: true,
    });

    const sources = await prisma.source.findMany({
      select: { id: true, name: true },
    });

    const leadsBySource: Record<string, number> = {};
    leadsBySourceData.forEach((item) => {
      const source = sources.find((s) => s.id === item.sourceId);
      if (source && item.sourceId) {
        leadsBySource[source.name] = item._count;
      }
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalLeads,
      convertedLeads,
      conversionRate: Number(conversionRate.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      avgDealValue: Number(avgDealValue.toFixed(2)),
      costPerLead: Number(costPerLead.toFixed(2)),
      costPerConversion: Number(costPerConversion.toFixed(2)),
      leadsByStatus,
      leadsBySource,
    };
  }

  /**
   * Get all campaigns performance summary
   */
  async getAllCampaignsPerformance(
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignPerformance[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 1 },
      select: { id: true },
    });

    const performanceData = await Promise.all(
      campaigns.map((campaign) =>
        this.getCampaignPerformance(campaign.id, startDate, endDate)
      )
    );

    return performanceData;
  }

  /**
   * Add manager to campaign
   */
  async addCampaignManager(campaignId: number, userId: number) {
    const manager = await prisma.campaignManager.create({
      data: {
        campaignId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return manager;
  }

  /**
   * Remove manager from campaign
   */
  async removeCampaignManager(campaignId: number, userId: number) {
    await prisma.campaignManager.deleteMany({
      where: {
        campaignId,
        userId,
      },
    });

    return { message: 'Manager removed successfully' };
  }

  /**
   * Get campaign managers
   */
  async getCampaignManagers(campaignId: number) {
    const managers = await prisma.campaignManager.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            mobileNumber: true,
          },
        },
      },
    });

    return managers;
  }

  /**
   * Get international campaigns (24/7 operations)
   */
  async getInternationalCampaigns() {
    const campaigns = await prisma.campaign.findMany({
      where: {
        isInternational: true,
        status: 1,
      },
      include: {
        sources: {
          where: {
            runAllTime: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            leads: true,
            sources: true,
          },
        },
      },
    });

    return campaigns;
  }

  /**
   * Get campaign statistics for dashboard
   */
  async getCampaignStatistics() {
    const [
      totalCampaigns,
      activeCampaigns,
      internationalCampaigns,
      totalLeads,
      totalRevenue,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 1 } }),
      prisma.campaign.count({ where: { isInternational: true, status: 1 } }),
      prisma.lead.count({ where: { campaignId: { not: null } } }),
      prisma.deal.aggregate({
        where: {
          status: 'closed',
          lead: {
            campaignId: { not: null },
          },
        },
        _sum: {
          dealValue: true,
        },
      }),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      internationalCampaigns,
      totalLeads,
      totalRevenue: Number(totalRevenue._sum.dealValue || 0),
      avgRevenuePerCampaign:
        activeCampaigns > 0
          ? Number(totalRevenue._sum.dealValue || 0) / activeCampaigns
          : 0,
    };
  }
}

export default new CampaignService();
