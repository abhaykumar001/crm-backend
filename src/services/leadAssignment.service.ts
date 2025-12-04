import { PrismaClient } from '@prisma/client';
import sourceService from './source.service';

const prisma = new PrismaClient();

interface AssignmentResult {
  success: boolean;
  leadId: number;
  agentId?: number;
  agentName?: string;
  message: string;
  assignmentType: 'round_robin' | 'manual' | 'random' | 'failed';
}

interface MultiAgentAssignment {
  leadId: number;
  agentIds: number[];
  assignedBy: number;
}

class LeadAssignmentService {
  /**
   * Assign lead using round-robin algorithm based on source
   */
  async assignLeadRoundRobin(
    leadId: number,
    sourceId: number,
    assignedBy: number
  ): Promise<AssignmentResult> {
    try {
      // Get next agent from round-robin
      const agentId = await sourceService.getNextAgentForRoundRobin(sourceId);

      if (!agentId) {
        return {
          success: false,
          leadId,
          message: 'No available agents in source pool',
          assignmentType: 'failed',
        };
      }

      // Get agent details
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!agent) {
        return {
          success: false,
          leadId,
          message: 'Agent not found',
          assignmentType: 'failed',
        };
      }

      // Update lead with agent
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          agentId,
          assignedBy,
        },
      });

      // Create LeadAgent pivot entry (multi-agent support)
      await prisma.leadAgent.create({
        data: {
          leadId,
          userId: agentId,
          isAccepted: 0, // Pending acceptance
          assignTime: new Date(),
          activityCheck: false,
        },
      });

      // Create assignment history
      await prisma.assignedAgentHistory.create({
        data: {
          leadId,
          agentId,
          assignedBy,
          assignedAt: new Date(),
        },
      });

      // Rotate the nextLeadAssign flag to next agent
      await sourceService.rotateNextLeadAssignFlag(sourceId, agentId);

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_assignment',
          description: `Lead assigned to ${agent.name} via round-robin`,
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: assignedBy,
          properties: {
            agentId,
            agentName: agent.name,
            sourceId,
            method: 'round_robin',
          },
        },
      });

      return {
        success: true,
        leadId,
        agentId,
        agentName: agent.name,
        message: `Lead successfully assigned to ${agent.name}`,
        assignmentType: 'round_robin',
      };
    } catch (error: any) {
      console.error('Round-robin assignment error:', error);
      return {
        success: false,
        leadId,
        message: error.message || 'Assignment failed',
        assignmentType: 'failed',
      };
    }
  }

  /**
   * Manual lead assignment to specific agent
   */
  async assignLeadManually(
    leadId: number,
    agentId: number,
    assignedBy: number
  ): Promise<AssignmentResult> {
    try {
      // Verify agent exists and is available
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          email: true,
          isExcluded: true,
          status: true,
          availability: true,
        },
      });

      if (!agent) {
        return {
          success: false,
          leadId,
          message: 'Agent not found',
          assignmentType: 'failed',
        };
      }

      if (agent.isExcluded) {
        return {
          success: false,
          leadId,
          agentId,
          agentName: agent.name,
          message: `${agent.name} is excluded from auto-assignment`,
          assignmentType: 'failed',
        };
      }

      // Update lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          agentId,
          assignedBy,
        },
      });

      // Create LeadAgent pivot entry
      await prisma.leadAgent.create({
        data: {
          leadId,
          userId: agentId,
          isAccepted: 0, // Pending
          assignTime: new Date(),
        },
      });

      // Create assignment history
      await prisma.assignedAgentHistory.create({
        data: {
          leadId,
          agentId,
          assignedBy,
          assignedAt: new Date(),
        },
      });

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_assignment',
          description: `Lead manually assigned to ${agent.name}`,
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: assignedBy,
          properties: {
            agentId,
            agentName: agent.name,
            method: 'manual',
          },
        },
      });

      return {
        success: true,
        leadId,
        agentId,
        agentName: agent.name,
        message: `Lead successfully assigned to ${agent.name}`,
        assignmentType: 'manual',
      };
    } catch (error: any) {
      console.error('Manual assignment error:', error);
      return {
        success: false,
        leadId,
        message: error.message || 'Assignment failed',
        assignmentType: 'failed',
      };
    }
  }

  /**
   * Multi-agent lead assignment (for commission sharing)
   */
  async assignLeadToMultipleAgents(
    assignment: MultiAgentAssignment
  ): Promise<AssignmentResult> {
    const { leadId, agentIds, assignedBy } = assignment;

    try {
      // Verify all agents exist
      const agents = await prisma.user.findMany({
        where: {
          id: { in: agentIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (agents.length !== agentIds.length) {
        return {
          success: false,
          leadId,
          message: 'One or more agents not found',
          assignmentType: 'failed',
        };
      }

      // Set primary agent (first one)
      const primaryAgentId = agentIds[0];
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          agentId: primaryAgentId,
          assignedBy,
        },
      });

      // Create LeadAgent entries for all agents
      await Promise.all(
        agentIds.map((agentId) =>
          prisma.leadAgent.create({
            data: {
              leadId,
              userId: agentId,
              isAccepted: 0,
              assignTime: new Date(),
            },
          })
        )
      );

      // Create assignment history for all
      await Promise.all(
        agentIds.map((agentId) =>
          prisma.assignedAgentHistory.create({
            data: {
              leadId,
              agentId,
              assignedBy,
              assignedAt: new Date(),
            },
          })
        )
      );

      const agentNames = agents.map((a) => a.name).join(', ');

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_assignment',
          description: `Lead assigned to multiple agents: ${agentNames}`,
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: assignedBy,
          properties: {
            agentIds,
            agentNames,
            method: 'multi_agent',
          },
        },
      });

      return {
        success: true,
        leadId,
        message: `Lead assigned to ${agents.length} agents`,
        assignmentType: 'manual',
      };
    } catch (error: any) {
      console.error('Multi-agent assignment error:', error);
      return {
        success: false,
        leadId,
        message: error.message || 'Assignment failed',
        assignmentType: 'failed',
      };
    }
  }

  /**
   * Reassign lead from one agent to another
   */
  async reassignLead(
    leadId: number,
    fromAgentId: number,
    toAgentId: number,
    reassignedBy: number,
    reason?: string
  ): Promise<AssignmentResult> {
    try {
      // Get both agents
      const [fromAgent, toAgent] = await Promise.all([
        prisma.user.findUnique({
          where: { id: fromAgentId },
          select: { id: true, name: true },
        }),
        prisma.user.findUnique({
          where: { id: toAgentId },
          select: { id: true, name: true, isExcluded: true },
        }),
      ]);

      if (!fromAgent || !toAgent) {
        return {
          success: false,
          leadId,
          message: 'Agent not found',
          assignmentType: 'failed',
        };
      }

      if (toAgent.isExcluded) {
        return {
          success: false,
          leadId,
          message: `${toAgent.name} is excluded from assignment`,
          assignmentType: 'failed',
        };
      }

      // Soft delete old LeadAgent entry
      await prisma.leadAgent.updateMany({
        where: {
          leadId,
          userId: fromAgentId,
        },
        data: {
          deletedAt: new Date(),
          deletedReason: reason || 'Reassigned',
        },
      });

      // Update lead primary agent
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          agentId: toAgentId,
          assignedBy: reassignedBy,
        },
      });

      // Create new LeadAgent entry
      await prisma.leadAgent.create({
        data: {
          leadId,
          userId: toAgentId,
          isAccepted: 0,
          assignTime: new Date(),
        },
      });

      // Update old assignment history
      await prisma.assignedAgentHistory.updateMany({
        where: {
          leadId,
          agentId: fromAgentId,
          unassignedAt: null,
        },
        data: {
          unassignedAt: new Date(),
          reason: reason || 'Reassigned',
        },
      });

      // Create new assignment history
      await prisma.assignedAgentHistory.create({
        data: {
          leadId,
          agentId: toAgentId,
          assignedBy: reassignedBy,
          assignedAt: new Date(),
        },
      });

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_reassignment',
          description: `Lead reassigned from ${fromAgent.name} to ${toAgent.name}`,
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: reassignedBy,
          properties: {
            fromAgentId,
            fromAgentName: fromAgent.name,
            toAgentId,
            toAgentName: toAgent.name,
            reason,
          },
        },
      });

      return {
        success: true,
        leadId,
        agentId: toAgentId,
        agentName: toAgent.name,
        message: `Lead reassigned to ${toAgent.name}`,
        assignmentType: 'manual',
      };
    } catch (error: any) {
      console.error('Reassignment error:', error);
      return {
        success: false,
        leadId,
        message: error.message || 'Reassignment failed',
        assignmentType: 'failed',
      };
    }
  }

  /**
   * Agent accepts lead assignment
   */
  async acceptLeadAssignment(leadId: number, agentId: number) {
    try {
      // Update LeadAgent status
      const updated = await prisma.leadAgent.updateMany({
        where: {
          leadId,
          userId: agentId,
          deletedAt: null,
        },
        data: {
          isAccepted: 1, // Accepted
          lastActivityTime: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error('Assignment not found or already processed');
      }

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_accepted',
          description: 'Agent accepted lead assignment',
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: agentId,
        },
      });

      return {
        success: true,
        message: 'Lead assignment accepted',
      };
    } catch (error: any) {
      console.error('Accept assignment error:', error);
      throw error;
    }
  }

  /**
   * Agent rejects lead assignment
   */
  async rejectLeadAssignment(
    leadId: number,
    agentId: number,
    reason?: string
  ) {
    try {
      // Update LeadAgent status
      await prisma.leadAgent.updateMany({
        where: {
          leadId,
          userId: agentId,
          deletedAt: null,
        },
        data: {
          isAccepted: -1, // Rejected
          deletedAt: new Date(),
          deletedReason: reason || 'Rejected by agent',
        },
      });

      // Log activity
      await prisma.logActivity.create({
        data: {
          logName: 'lead_rejected',
          description: `Agent rejected lead assignment${reason ? `: ${reason}` : ''}`,
          subjectType: 'Lead',
          subjectId: leadId,
          causerId: agentId,
          properties: { reason },
        },
      });

      // TODO: Auto-reassign to next agent in round-robin
      // This would trigger the reassignment logic

      return {
        success: true,
        message: 'Lead assignment rejected',
      };
    } catch (error: any) {
      console.error('Reject assignment error:', error);
      throw error;
    }
  }

  /**
   * Get assignment history for a lead
   */
  async getLeadAssignmentHistory(leadId: number) {
    const history = await prisma.assignedAgentHistory.findMany({
      where: { leadId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return history;
  }

  /**
   * Get pending assignments for an agent
   */
  async getPendingAssignments(agentId: number) {
    const pendingAssignments = await prisma.leadAgent.findMany({
      where: {
        userId: agentId,
        isAccepted: 0, // Pending
        deletedAt: null,
      },
      include: {
        lead: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
              },
            },
            status: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignTime: 'desc',
      },
    });

    return pendingAssignments;
  }

  /**
   * Check if agent has received this lead before
   */
  async hasAgentReceivedLeadBefore(
    leadId: number,
    agentId: number
  ): Promise<boolean> {
    const count = await prisma.assignedAgentHistory.count({
      where: {
        leadId,
        agentId,
      },
    });

    return count > 0;
  }

  /**
   * Get agent availability for assignment
   */
  async isAgentAvailable(agentId: number): Promise<boolean> {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        status: true,
        availability: true,
        isExcluded: true,
      },
    });

    if (!agent) return false;

    return (
      agent.status === 'Active' &&
      agent.availability === 'Available' &&
      !agent.isExcluded
    );
  }

  /**
   * Update lead assignment count (for freshness tracking)
   */
  async incrementAssignmentCount(leadId: number) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        assignLeadsCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Mark lead as non-fresh after multiple assignments
   */
  async updateLeadFreshness(leadId: number) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignLeadsCount: true },
    });

    if (lead && lead.assignLeadsCount >= 2) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { isFresh: false },
      });
    }
  }
}

export default new LeadAssignmentService();
