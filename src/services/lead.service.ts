import { PrismaClient, Prisma } from '@prisma/client';
import leadAssignmentService from '../utils/lead-assignment.util';

const prisma = new PrismaClient();

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  sourceId?: number;
  statusId?: number;
  agentId?: number;
  projectId?: number;
  priority?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadData {
  name: string;
  email?: string;
  mobileNumber: string;
  alternateNumber?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  designation?: string;
  companyName?: string;
  sourceId: number;
  subSourceId?: number;
  projectId?: number;
  budget?: number;
  requirement?: string;
  remarks?: string;
  priority?: string;
  followUpDate?: Date;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

export class LeadService {
  
  /**
   * Create a new lead
   */
  async createLead(data: CreateLeadData, createdBy: number): Promise<any> {
    try {
      // Calculate lead score based on budget, source, and other factors
      const leadScore = this.calculateLeadScore(data);

      // Get default status (usually "New")
      const defaultStatus = await prisma.status.findFirst({
        where: { name: 'New' },
        orderBy: { sortOrder: 'asc' }
      });

      const lead = await prisma.$transaction(async (tx) => {
        // Create the lead
        const newLead = await tx.lead.create({
          data: {
            ...data,
            leadScore,
            statusId: defaultStatus?.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            source: true,
            subSource: true,
            project: true,
            status: true,
            agent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        // Auto-assign lead if no agent specified
        // Note: agentId is not part of CreateLeadData interface
        // This logic can be applied after lead creation if needed

        // Log activity
        await tx.logActivity.create({
          data: {
            logName: 'lead_created',
            description: `New lead created: ${data.name}`,
            subjectType: 'Lead',
            subjectId: newLead.id,
            causerId: createdBy,
            properties: {
              source: data.sourceId,
              budget: data.budget,
              priority: data.priority
            }
          }
        });

        return newLead;
      });

      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw new Error('Failed to create lead');
    }
  }

  /**
   * Get leads with filters and pagination
   */
  async getLeads(filters: LeadFilters): Promise<any> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sourceId,
        statusId,
        agentId,
        projectId,
        priority,
        city,
        dateFrom,
        dateTo,
        budgetMin,
        budgetMax,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.LeadWhereInput = {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { mobileNumber: { contains: search } },
            { companyName: { contains: search } }
          ]
        }),
        ...(sourceId && { sourceId }),
        ...(statusId && { statusId }),
        ...(agentId && { agentId }),
        ...(projectId && { projectId }),
        ...(priority && { priority }),
        ...(city && { city: { contains: city } }),
        ...(dateFrom && dateTo && {
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        }),
        ...(budgetMin && budgetMax && {
          budget: {
            gte: budgetMin,
            lte: budgetMax
          }
        })
      };

      // Get total count
      const total = await prisma.lead.count({ where });

      // Get leads with relations
      const leads = await prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          source: true,
          subSource: true,
          project: {
            select: {
              id: true,
              name: true,
              city: true,
              minPrice: true,
              maxPrice: true
            }
          },
          status: true,
          subStatus: true,
          superStatus: true,
          reason: true,
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true
            }
          },
          assignedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          notes: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          callLogs: {
            take: 1,
            orderBy: { callStartTime: 'desc' }
          }
        }
      });

      return {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw new Error('Failed to fetch leads');
    }
  }

  /**
   * Get single lead by ID
   */
  async getLeadById(id: number): Promise<any> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { 
          id,
          deletedAt: null 
        },
        include: {
          source: true,
          subSource: true,
          project: {
            include: {
              developer: true,
              amenities: {
                include: {
                  amenity: true
                }
              }
            }
          },
          status: true,
          subStatus: true,
          superStatus: true,
          reason: true,
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true,
              designation: true
            }
          },
          assignedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          callLogs: {
            orderBy: { callStartTime: 'desc' },
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            include: {
              causer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          actionHistory: {
            orderBy: { actionDate: 'desc' }
          },
          assignedHistory: {
            orderBy: { assignedAt: 'desc' },
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      return lead;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  /**
   * Update lead
   */
  async updateLead(id: number, data: UpdateLeadData, updatedBy: number): Promise<any> {
    try {
      const existingLead = await prisma.lead.findUnique({
        where: { id, deletedAt: null }
      });

      if (!existingLead) {
        throw new Error('Lead not found');
      }

      const updatedLead = await prisma.$transaction(async (tx) => {
        // Update the lead
        const lead = await tx.lead.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date()
          },
          include: {
            source: true,
            subSource: true,
            project: true,
            status: true,
            agent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        // Log activity for significant changes
        const changes = this.getSignificantChanges(existingLead, data);
        if (changes.length > 0) {
          await tx.logActivity.create({
            data: {
              logName: 'lead_updated',
              description: `Lead updated: ${changes.join(', ')}`,
              subjectType: 'Lead',
              subjectId: id,
              causerId: updatedBy,
              properties: {
                changes
              }
            }
          });
        }

        return lead;
      });

      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    id: number, 
    statusData: {
      statusId: number;
      subStatusId?: number;
      superStatusId?: number;
      reasonId?: number;
      remarks?: string;
      followUpDate?: Date;
    },
    updatedBy: number
  ): Promise<any> {
    try {
      const existingLead = await prisma.lead.findUnique({
        where: { id, deletedAt: null },
        include: { status: true }
      });

      if (!existingLead) {
        throw new Error('Lead not found');
      }

      const updatedLead = await prisma.$transaction(async (tx) => {
        // Update lead status
        const lead = await tx.lead.update({
          where: { id },
          data: {
            statusId: statusData.statusId,
            subStatusId: statusData.subStatusId,
            superStatusId: statusData.superStatusId,
            reasonId: statusData.reasonId,
            remarks: statusData.remarks,
            followUpDate: statusData.followUpDate,
            lastContactDate: new Date(),
            updatedAt: new Date()
          },
          include: {
            status: true,
            subStatus: true,
            superStatus: true,
            reason: true
          }
        });

        // Create action history
        await tx.leadActionHistory.create({
          data: {
            leadId: id,
            action: 'status_changed',
            oldValue: existingLead.status?.name || 'Unknown',
            newValue: lead.status?.name || 'Unknown',
            actionBy: updatedBy,
            actionDate: new Date()
          }
        });

        // Log activity
        await tx.logActivity.create({
          data: {
            logName: 'status_changed',
            description: `Status changed from ${existingLead.status?.name} to ${lead.status?.name}`,
            subjectType: 'Lead',
            subjectId: id,
            causerId: updatedBy,
            properties: {
              oldStatus: existingLead.status?.name,
              newStatus: lead.status?.name,
              remarks: statusData.remarks
            }
          }
        });

        return lead;
      });

      return updatedLead;
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  }

  /**
   * Add note to lead
   */
  async addNote(leadId: number, content: string, isPrivate: boolean, userId: number): Promise<any> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId, deletedAt: null }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      const note = await prisma.$transaction(async (tx) => {
        const newNote = await tx.note.create({
          data: {
            leadId,
            userId,
            content,
            isPrivate,
            createdAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Log activity
        await tx.logActivity.create({
          data: {
            logName: 'note_added',
            description: `Note added to lead`,
            subjectType: 'Lead',
            subjectId: leadId,
            causerId: userId,
            properties: {
              noteLength: content.length,
              isPrivate
            }
          }
        });

        return newNote;
      });

      return note;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  /**
   * Delete lead (soft delete)
   */
  async deleteLead(id: number, deletedBy: number): Promise<boolean> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id, deletedAt: null }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      await prisma.$transaction(async (tx) => {
        await tx.lead.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Log activity
        await tx.logActivity.create({
          data: {
            logName: 'lead_deleted',
            description: `Lead deleted: ${lead.name}`,
            subjectType: 'Lead',
            subjectId: id,
            causerId: deletedBy
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Calculate lead score based on various factors
   */
  private calculateLeadScore(data: CreateLeadData): number {
    let score = 0;

    // Budget scoring (0-40 points)
    if (data.budget) {
      if (data.budget >= 10000000) score += 40; // 1 Crore+
      else if (data.budget >= 5000000) score += 30; // 50 Lakh+
      else if (data.budget >= 2000000) score += 20; // 20 Lakh+
      else if (data.budget >= 1000000) score += 10; // 10 Lakh+
    }

    // Source scoring (0-30 points)
    // This would be based on historical conversion rates by source
    // For now, using basic scoring
    if (data.sourceId) {
      score += 15; // Base score for having a source
    }

    // Contact completeness (0-20 points)
    if (data.email) score += 5;
    if (data.whatsappNumber) score += 5;
    if (data.address) score += 5;
    if (data.companyName) score += 5;

    // Priority scoring (0-10 points)
    if (data.priority === 'high') score += 10;
    else if (data.priority === 'medium') score += 5;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get significant changes for activity logging
   */
  private getSignificantChanges(existingLead: any, newData: UpdateLeadData): string[] {
    const changes: string[] = [];

    if (newData.name && newData.name !== existingLead.name) {
      changes.push('name');
    }
    if (newData.email && newData.email !== existingLead.email) {
      changes.push('email');
    }
    if (newData.mobileNumber && newData.mobileNumber !== existingLead.mobileNumber) {
      changes.push('mobile number');
    }
    if (newData.budget && newData.budget !== existingLead.budget) {
      changes.push('budget');
    }
    if (newData.priority && newData.priority !== existingLead.priority) {
      changes.push('priority');
    }

    return changes;
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(filters?: { agentId?: number; dateFrom?: Date; dateTo?: Date }): Promise<any> {
    try {
      const where: Prisma.LeadWhereInput = {
        deletedAt: null,
        ...(filters?.agentId && { agentId: filters.agentId }),
        ...(filters?.dateFrom && filters?.dateTo && {
          createdAt: {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        })
      };

      const [
        totalLeads,
        statusStats,
        sourceStats,
        priorityStats
      ] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.groupBy({
          by: ['statusId'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        }),
        prisma.lead.groupBy({
          by: ['sourceId'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        }),
        prisma.lead.groupBy({
          by: ['priority'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        })
      ]);

      return {
        totalLeads,
        statusBreakdown: statusStats,
        sourceBreakdown: sourceStats,
        priorityBreakdown: priorityStats
      };
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      throw error;
    }
  }
}

export default new LeadService();
