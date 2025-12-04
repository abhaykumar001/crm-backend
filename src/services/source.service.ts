import { PrismaClient, Source, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface SourceWithDetails extends Source {
  campaign?: any;
  sourceUsers?: any[];
  subSources?: any[];
  _count?: {
    leads: number;
    sourceUsers: number;
    subSources: number;
  };
}

interface SourceFilters {
  type?: string;
  campaignId?: number;
  isActive?: boolean;
  isCroned?: boolean;
  runAllTime?: boolean;
  search?: string;
}

interface AgentPoolConfig {
  sourceId: number;
  agentIds: number[];
  rotationType?: 'round_robin' | 'random' | 'manual';
}

class SourceService {
  /**
   * Get all sources with optional filters
   */
  async getAllSources(filters?: SourceFilters) {
    const where: Prisma.SourceWhereInput = {};

    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.campaignId) where.campaignId = filters.campaignId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isCroned !== undefined) where.isCroned = filters.isCroned;
      if (filters.runAllTime !== undefined) where.runAllTime = filters.runAllTime;
      if (filters.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }
    }

    const sources = await prisma.source.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            isInternational: true,
          },
        },
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
          orderBy: {
            userId: 'asc',
          },
        },
        _count: {
          select: {
            leads: true,
            sourceUsers: true,
            subSources: true,
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    return sources;
  }

  /**
   * Get single source by ID
   */
  async getSourceById(id: number): Promise<SourceWithDetails | null> {
    const source = await prisma.source.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            isInternational: true,
            status: true,
          },
        },
        sourceUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                availability: true,
                isExcluded: true,
                status: true,
              },
            },
          },
          orderBy: {
            userId: 'asc',
          },
        },
        subSources: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
            _count: {
              select: {
                leads: true,
              },
            },
          },
        },
        _count: {
          select: {
            leads: true,
            sourceUsers: true,
            subSources: true,
          },
        },
      },
    });

    return source;
  }

  /**
   * Create new source
   */
  async createSource(data: {
    name: string;
    campaignId?: number;
    type?: string;
    runAllTime?: boolean;
    isCroned?: boolean;
    priority?: number;
    isActive?: boolean;
  }) {
    // Check if source name already exists
    const existing = await prisma.source.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Source with this name already exists');
    }

    const source = await prisma.source.create({
      data,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return source;
  }

  /**
   * Update source
   */
  async updateSource(
    id: number,
    data: {
      name?: string;
      campaignId?: number | null;
      type?: string;
      runAllTime?: boolean;
      isCroned?: boolean;
      priority?: number;
      isActive?: boolean;
    }
  ) {
    // If name is being updated, check for duplicates
    if (data.name) {
      const existing = await prisma.source.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Source with this name already exists');
      }
    }

    const source = await prisma.source.update({
      where: { id },
      data,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            leads: true,
            sourceUsers: true,
          },
        },
      },
    });

    return source;
  }

  /**
   * Delete source (soft delete by setting isActive to false)
   */
  async deleteSource(id: number) {
    const source = await prisma.source.update({
      where: { id },
      data: { isActive: false },
    });

    return source;
  }

  /**
   * Configure agent pool for source
   */
  async configureAgentPool(config: AgentPoolConfig) {
    const { sourceId, agentIds } = config;

    // Verify source exists
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error('Source not found');
    }

    // Verify all agents exist and are valid
    const agents = await prisma.user.findMany({
      where: {
        id: { in: agentIds },
        roles: {
          some: {
            role: {
              name: { in: ['agent', 'team_leader'] },
            },
          },
        },
      },
    });

    if (agents.length !== agentIds.length) {
      throw new Error('One or more invalid agent IDs');
    }

    // Delete existing agent pool
    await prisma.sourceUser.deleteMany({
      where: { sourceId },
    });

    // Create new agent pool
    // Set nextLeadAssign flag for first agent only (round-robin)
    const sourceUsers = await Promise.all(
      agentIds.map((userId, index) =>
        prisma.sourceUser.create({
          data: {
            sourceId,
            userId,
            nextLeadAssign: index === 0, // First agent gets the flag
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                availability: true,
              },
            },
          },
        })
      )
    );

    return {
      message: 'Agent pool configured successfully',
      agentPool: sourceUsers,
    };
  }

  /**
   * Add agent to source pool
   */
  async addAgentToPool(sourceId: number, userId: number) {
    // Check if already exists
    const existing = await prisma.sourceUser.findUnique({
      where: {
        userId_sourceId: {
          userId,
          sourceId,
        },
      },
    });

    if (existing) {
      throw new Error('Agent already in pool');
    }

    // Check if this is the first agent (should get nextLeadAssign flag)
    const existingAgents = await prisma.sourceUser.count({
      where: { sourceId },
    });

    const sourceUser = await prisma.sourceUser.create({
      data: {
        sourceId,
        userId,
        nextLeadAssign: existingAgents === 0, // First agent gets flag
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            availability: true,
          },
        },
      },
    });

    return sourceUser;
  }

  /**
   * Remove agent from source pool
   */
  async removeAgentFromPool(sourceId: number, userId: number) {
    // Check if agent has nextLeadAssign flag
    const sourceUser = await prisma.sourceUser.findUnique({
      where: {
        userId_sourceId: {
          userId,
          sourceId,
        },
      },
    });

    if (!sourceUser) {
      throw new Error('Agent not in pool');
    }

    // Delete the agent
    await prisma.sourceUser.delete({
      where: {
        userId_sourceId: {
          userId,
          sourceId,
        },
      },
    });

    // If this agent had the nextLeadAssign flag, assign it to next agent
    if (sourceUser.nextLeadAssign) {
      const nextAgent = await prisma.sourceUser.findFirst({
        where: { sourceId },
        orderBy: { userId: 'asc' },
      });

      if (nextAgent) {
        await prisma.sourceUser.update({
          where: {
            userId_sourceId: {
              userId: nextAgent.userId,
              sourceId: nextAgent.sourceId,
            },
          },
          data: { nextLeadAssign: true },
        });
      }
    }

    return { message: 'Agent removed from pool successfully' };
  }

  /**
   * Get agent pool for source
   */
  async getAgentPool(sourceId: number) {
    const sourceUsers = await prisma.sourceUser.findMany({
      where: { sourceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            availability: true,
            isExcluded: true,
            status: true,
          },
        },
      },
      orderBy: {
        userId: 'asc',
      },
    });

    // Count leads per agent from this source
    const agentsWithLeadCounts = await Promise.all(
      sourceUsers.map(async (su) => {
        const leadCount = await prisma.lead.count({
          where: {
            sourceId,
            agentId: su.userId,
          },
        });

        return {
          ...su,
          leadCount,
        };
      })
    );

    return agentsWithLeadCounts;
  }

  /**
   * Get next agent for round-robin assignment
   */
  async getNextAgentForRoundRobin(sourceId: number): Promise<number | null> {
    // Find agent with nextLeadAssign flag
    const nextAgent = await prisma.sourceUser.findFirst({
      where: {
        sourceId,
        nextLeadAssign: true,
        user: {
          isExcluded: false,
          status: 'Active',
          availability: 'Available',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            isExcluded: true,
            availability: true,
          },
        },
      },
    });

    if (!nextAgent) {
      // No agent with flag or all excluded/unavailable
      // Try to find first available agent
      const firstAvailable = await prisma.sourceUser.findFirst({
        where: {
          sourceId,
          user: {
            isExcluded: false,
            status: 'Active',
            availability: 'Available',
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      return firstAvailable?.user.id || null;
    }

    return nextAgent.user.id;
  }

  /**
   * Rotate nextLeadAssign flag to next agent (after assignment)
   */
  async rotateNextLeadAssignFlag(sourceId: number, currentAgentId: number) {
    // Remove flag from current agent
    await prisma.sourceUser.updateMany({
      where: {
        sourceId,
        userId: currentAgentId,
      },
      data: { nextLeadAssign: false },
    });

    // Get all agents in pool
    const allAgents = await prisma.sourceUser.findMany({
      where: { sourceId },
      orderBy: { userId: 'asc' },
    });

    if (allAgents.length === 0) return;

    // Find current agent index
    const currentIndex = allAgents.findIndex((a) => a.userId === currentAgentId);

    // Get next agent (circular)
    const nextIndex = (currentIndex + 1) % allAgents.length;
    const nextAgent = allAgents[nextIndex];

    // Set flag for next agent
    await prisma.sourceUser.update({
      where: {
        userId_sourceId: {
          userId: nextAgent.userId,
          sourceId: nextAgent.sourceId,
        },
      },
      data: { nextLeadAssign: true },
    });

    return nextAgent.userId;
  }

  /**
   * Get sources for auto-distribution (cron job)
   */
  async getSourcesForAutoDistribution() {
    const sources = await prisma.source.findMany({
      where: {
        isCroned: true,
        isActive: true,
      },
      include: {
        sourceUsers: {
          where: {
            user: {
              isExcluded: false,
              status: 'Active',
              availability: 'Available',
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return sources;
  }

  /**
   * Get source statistics
   */
  async getSourceStatistics(sourceId: number, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const [totalLeads, convertedLeads, agentCount] = await Promise.all([
      prisma.lead.count({
        where: {
          sourceId,
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.lead.count({
        where: {
          sourceId,
          deals: {
            some: {
              status: 'closed',
            },
          },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.sourceUser.count({
        where: { sourceId },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      sourceId,
      totalLeads,
      convertedLeads,
      conversionRate: Number(conversionRate.toFixed(2)),
      agentCount,
    };
  }

  /**
   * Create sub-source
   */
  async createSubSource(sourceId: number, name: string) {
    const subSource = await prisma.subSource.create({
      data: {
        sourceId,
        name,
        isActive: true,
      },
    });

    return subSource;
  }

  /**
   * Get sub-sources for a source
   */
  async getSubSources(sourceId: number) {
    const subSources = await prisma.subSource.findMany({
      where: { sourceId },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return subSources;
  }

  /**
   * Update sub-source
   */
  async updateSubSource(
    id: number,
    data: {
      name?: string;
      isActive?: boolean;
    }
  ) {
    const subSource = await prisma.subSource.update({
      where: { id },
      data,
    });

    return subSource;
  }
}

export default new SourceService();
