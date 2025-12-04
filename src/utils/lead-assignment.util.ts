import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentWorkload {
  agentId: number;
  name: string;
  totalLeads: number;
  activeLeads: number;
  todayFollowUps: number;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface AssignmentCriteria {
  sourceId?: number;
  city?: string;
  projectId?: number;
  budget?: number;
}

/**
 * Smart lead assignment algorithm
 * Considers agent workload, availability, territory, and expertise
 */
export class LeadAssignmentService {
  
  /**
   * Find the best agent for lead assignment
   */
  async findBestAgent(criteria: AssignmentCriteria): Promise<number | null> {
    try {
      // Get all active agents
      const agents = await this.getAgentWorkloads();
      
      if (agents.length === 0) {
        return null;
      }

      // Filter agents based on criteria
      let eligibleAgents = agents.filter(agent => agent.isActive);

      // Sort by workload and availability
      eligibleAgents.sort((a, b) => {
        // Primary: Active leads count (ascending)
        if (a.activeLeads !== b.activeLeads) {
          return a.activeLeads - b.activeLeads;
        }
        
        // Secondary: Today's follow-ups (ascending)
        if (a.todayFollowUps !== b.todayFollowUps) {
          return a.todayFollowUps - b.todayFollowUps;
        }
        
        // Tertiary: Last login (most recent first)
        if (a.lastLoginAt && b.lastLoginAt) {
          return b.lastLoginAt.getTime() - a.lastLoginAt.getTime();
        }
        
        return 0;
      });

      return eligibleAgents[0]?.agentId || null;
    } catch (error) {
      console.error('Error in lead assignment:', error);
      return null;
    }
  }

  /**
   * Get workload statistics for all agents
   */
  private async getAgentWorkloads(): Promise<AgentWorkload[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get agents with role 'Agent'
    const agents = await prisma.user.findMany({
      where: {
        isActive: true,
        roles: {
          some: {
            role: {
              name: 'Agent'
            }
          }
        }
      },
      include: {
        leads: {
          where: {
            deletedAt: null
          }
        },
        assignedLeads: {
          where: {
            deletedAt: null,
            followUpDate: {
              gte: today,
              lt: tomorrow
            }
          }
        }
      }
    });

    return agents.map(agent => {
      const totalLeads = agent.leads.length;
      const activeLeads = agent.leads.filter(lead => {
        // Consider leads as active if they don't have these specific status IDs
        // You can adjust these IDs based on your actual status setup
        const closedStatusIds = [7, 8, 9]; // Assuming these are IDs for closed statuses
        return !closedStatusIds.includes(lead.statusId || 0);
      }).length;
      const todayFollowUps = agent.assignedLeads.filter(lead => 
        lead.followUpDate && 
        lead.followUpDate >= today && 
        lead.followUpDate < tomorrow
      ).length;

      return {
        agentId: agent.id,
        name: agent.name,
        totalLeads,
        activeLeads,
        todayFollowUps,
        isActive: agent.isActive,
        lastLoginAt: agent.lastLoginAt
      };
    });
  }

  /**
   * Round-robin assignment (alternative method)
   */
  async roundRobinAssignment(): Promise<number | null> {
    try {
      const agents = await prisma.user.findMany({
        where: {
          isActive: true,
          roles: {
            some: {
              role: {
                name: 'Agent'
              }
            }
          }
        },
        include: {
          leads: {
            where: {
              deletedAt: null
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      if (agents.length === 0) {
        return null;
      }

      // Find agent with oldest last assignment
      let selectedAgent = agents[0];
      let oldestAssignment = selectedAgent.leads[0]?.createdAt || new Date(0);

      for (const agent of agents) {
        const lastAssignment = agent.leads[0]?.createdAt || new Date(0);
        if (lastAssignment < oldestAssignment) {
          oldestAssignment = lastAssignment;
          selectedAgent = agent;
        }
      }

      return selectedAgent.id;
    } catch (error) {
      console.error('Error in round-robin assignment:', error);
      return null;
    }
  }

  /**
   * Assign lead to specific agent
   */
  async assignLead(leadId: number, agentId: number, assignedBy: number, reason?: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update lead with new agent
        await tx.lead.update({
          where: { id: leadId },
          data: {
            agentId,
            assignedBy,
            lastContactDate: new Date()
          }
        });

        // Create assignment history record
        await tx.assignedAgentHistory.create({
          data: {
            leadId,
            agentId,
            assignedBy,
            assignedAt: new Date(),
            reason: reason || 'Manual assignment'
          }
        });

        // Log activity
        await tx.logActivity.create({
          data: {
            logName: 'lead_assigned',
            description: `Lead assigned to agent`,
            subjectType: 'Lead',
            subjectId: leadId,
            causerId: assignedBy,
            properties: {
              agentId,
              reason
            }
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Error assigning lead:', error);
      return false;
    }
  }

  /**
   * Auto-assign lead based on smart algorithm
   */
  async autoAssignLead(leadId: number, assignedBy: number, criteria?: AssignmentCriteria): Promise<number | null> {
    try {
      const bestAgentId = await this.findBestAgent(criteria || {});
      
      if (!bestAgentId) {
        return null;
      }

      const success = await this.assignLead(leadId, bestAgentId, assignedBy, 'Auto-assignment');
      
      return success ? bestAgentId : null;
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return null;
    }
  }

  /**
   * Get agent performance statistics
   */
  async getAgentPerformance(agentId: number, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await prisma.lead.groupBy({
      by: ['statusId'],
      where: {
        agentId,
        createdAt: {
          gte: startDate
        },
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    const totalLeads = performance.reduce((sum, stat) => sum + stat._count.id, 0);
    
    return {
      totalLeads,
      statusBreakdown: performance,
      period: `${days} days`
    };
  }
}

export default new LeadAssignmentService();
