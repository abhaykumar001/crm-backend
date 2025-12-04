import { PrismaClient, Deal, User, Lead, Project, Prisma } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Deal with related data interface
export interface DealWithRelations extends Deal {
  lead: Lead & {
    name: string;
    email?: string;
    mobileNumber?: string;
  };
  project: Project;
  agent: User;
  commissions?: any[];
  paymentHistory?: any[];
}

// Deal creation interface
export interface CreateDealData {
  leadId: number;
  projectId: number;
  agentId?: number;
  dealValue: number;
  commissionRate: number;
  status?: string;
  dealDate?: Date;
  closingDate?: Date;
  paymentTerms?: string;
  notes?: string;
}

// Deal update interface
export interface UpdateDealData {
  leadId?: number;
  projectId?: number;
  agentId?: number;
  dealValue?: number;
  commissionRate?: number;
  status?: string;
  dealDate?: Date;
  closingDate?: Date;
  paymentTerms?: string;
  notes?: string;
}

// Deal query interface
export interface DealQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  agentId?: number;
  projectId?: number;
  minValue?: number;
  maxValue?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Payment record interface
export interface CreatePaymentData {
  paymentAmount: number;
  paymentDate?: Date;
  paymentMethod: string;
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
}

// Commission calculation interface
export interface CommissionData {
  dealId: number;
  agentId: number;
  commissionType?: string;
  commissionRate: number;
  commissionAmount: number;
}

class DealService {
  // Get all deals with filtering and pagination
  async getDeals(query: DealQuery, userId: number, userRole: string) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        agentId,
        projectId,
        minValue,
        maxValue,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.DealWhereInput = {
        isActive: true,
        ...(status && { status }),
        ...(projectId && { projectId })
      };

      // Handle deal value range
      if (minValue || maxValue) {
        where.dealValue = {};
        if (minValue) where.dealValue.gte = minValue;
        if (maxValue) where.dealValue.lte = maxValue;
      }

      // Handle date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Role-based filtering
      if (userRole === 'agent') {
        where.agentId = userId;
      } else if (agentId) {
        where.agentId = agentId;
      }

      // Search functionality
      if (search) {
        where.OR = [
          {
            lead: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            lead: {
              email: { contains: search, mode: 'insensitive' }
            }
          },
          {
            lead: {
              mobileNumber: { contains: search }
            }
          },
          {
            project: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            agent: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        ];
      }

      // Build orderBy clause
      const orderBy: Prisma.DealOrderByWithRelationInput = {};
      if (sortBy === 'dealValue') {
        orderBy.dealValue = sortOrder;
      } else if (sortBy === 'dealDate') {
        orderBy.dealDate = sortOrder;
      } else if (sortBy === 'closingDate') {
        orderBy.closingDate = sortOrder;
      } else {
        orderBy[sortBy as keyof Prisma.DealOrderByWithRelationInput] = sortOrder;
      }

      const [deals, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                mobileNumber: true,
                status: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                location: true,
                developer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
                mobileNumber: true
              }
            },
            commissions: {
              select: {
                id: true,
                commissionType: true,
                commissionAmount: true,
                status: true
              }
            }
          },
          skip,
          take: limit,
          orderBy
        }),
        prisma.deal.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${deals.length} deals for user ${userId}`);

      return {
        deals,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting deals:', error);
      throw new Error('Failed to retrieve deals');
    }
  }

  // Get deal by ID
  async getDealById(dealId: number, userId: number, userRole: string) {
    try {
      const where: Prisma.DealWhereInput = {
        id: dealId,
        isActive: true
      };

      // Role-based access control
      if (userRole === 'agent') {
        where.agentId = userId;
      }

      const deal = await prisma.deal.findFirst({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true,
              alternateNumber: true,
              whatsappNumber: true,
              address: true,
              city: true,
              state: true,
              occupation: true,
              budget: true,
              requirement: true,
              status: true
            }
          },
          project: {
            include: {
              developer: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true
                }
              },
              amenities: {
                include: {
                  amenity: {
                    select: {
                      id: true,
                      name: true,
                      icon: true
                    }
                  }
                }
              }
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true,
              designation: true
            }
          },
          commissions: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          paymentHistory: {
            orderBy: {
              paymentDate: 'desc'
            }
          }
        }
      });

      if (!deal) {
        throw new Error('Deal not found or access denied');
      }

      logger.info(`Retrieved deal ${dealId} for user ${userId}`);
      return deal;
    } catch (error) {
      logger.error(`Error getting deal ${dealId}:`, error);
      throw error;
    }
  }

  // Create new deal
  async createDeal(dealData: CreateDealData, userId: number) {
    try {
      // Validate lead exists and is available
      const lead = await prisma.lead.findFirst({
        where: {
          id: dealData.leadId,
          isActive: true
        }
      });

      if (!lead) {
        throw new Error('Lead not found or inactive');
      }

      // Validate project exists
      const project = await prisma.project.findFirst({
        where: {
          id: dealData.projectId,
          isActive: true
        }
      });

      if (!project) {
        throw new Error('Project not found or inactive');
      }

      // Set agent ID if not provided
      const agentId = dealData.agentId || userId;

      // Validate agent exists
      const agent = await prisma.user.findFirst({
        where: {
          id: agentId,
          isActive: true
        }
      });

      if (!agent) {
        throw new Error('Agent not found or inactive');
      }

      // Calculate commission amount
      const commissionAmount = (dealData.dealValue * dealData.commissionRate) / 100;

      // Create deal
      const deal = await prisma.deal.create({
        data: {
          leadId: dealData.leadId,
          projectId: dealData.projectId,
          agentId,
          dealValue: dealData.dealValue,
          commissionRate: dealData.commissionRate,
          commissionAmount,
          status: dealData.status || 'pending',
          dealDate: dealData.dealDate,
          closingDate: dealData.closingDate,
          paymentTerms: dealData.paymentTerms,
          notes: dealData.notes
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              location: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create primary commission record
      await prisma.saleCommission.create({
        data: {
          dealId: deal.id,
          agentId,
          commissionType: 'primary',
          commissionRate: dealData.commissionRate,
          commissionAmount,
          status: 'pending'
        }
      });

      logger.info(`Created deal ${deal.id} for lead ${dealData.leadId} by user ${userId}`);
      return deal;
    } catch (error) {
      logger.error('Error creating deal:', error);
      throw error;
    }
  }

  // Update deal
  async updateDeal(dealId: number, dealData: UpdateDealData, userId: number, userRole: string) {
    try {
      // Check if deal exists and user has access
      const existingDeal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true,
          ...(userRole === 'agent' && { agentId: userId })
        }
      });

      if (!existingDeal) {
        throw new Error('Deal not found or access denied');
      }

      // Validate lead if being updated
      if (dealData.leadId) {
        const lead = await prisma.lead.findFirst({
          where: {
            id: dealData.leadId,
            isActive: true
          }
        });

        if (!lead) {
          throw new Error('Lead not found or inactive');
        }
      }

      // Validate project if being updated
      if (dealData.projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: dealData.projectId,
            isActive: true
          }
        });

        if (!project) {
          throw new Error('Project not found or inactive');
        }
      }

      // Calculate new commission amount if deal value or rate changed
      let commissionAmount = existingDeal.commissionAmount;
      if (dealData.dealValue || dealData.commissionRate) {
        const newDealValue = dealData.dealValue || existingDeal.dealValue;
        const newCommissionRate = dealData.commissionRate || existingDeal.commissionRate;
        const calculatedAmount = (Number(newDealValue) * Number(newCommissionRate)) / 100;
        commissionAmount = new Prisma.Decimal(calculatedAmount);
      }

      // Update deal
      const updatedDeal = await prisma.deal.update({
        where: { id: dealId },
        data: {
          ...dealData,
          commissionAmount,
          updatedAt: new Date()
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              location: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update commission amount if changed
      if (dealData.dealValue || dealData.commissionRate) {
        await prisma.saleCommission.updateMany({
          where: {
            dealId,
            commissionType: 'primary'
          },
          data: {
            commissionRate: dealData.commissionRate || existingDeal.commissionRate,
            commissionAmount
          }
        });
      }

      logger.info(`Updated deal ${dealId} by user ${userId}`);
      return updatedDeal;
    } catch (error) {
      logger.error(`Error updating deal ${dealId}:`, error);
      throw error;
    }
  }

  // Delete deal (soft delete)
  async deleteDeal(dealId: number, userId: number, userRole: string) {
    try {
      // Check if deal exists and user has access
      const deal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true,
          ...(userRole === 'agent' && { agentId: userId })
        }
      });

      if (!deal) {
        throw new Error('Deal not found or access denied');
      }

      // Soft delete deal
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logger.info(`Deleted deal ${dealId} by user ${userId}`);
      return { message: 'Deal deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting deal ${dealId}:`, error);
      throw error;
    }
  }

  // Approve or reject deal
  async approveDeal(dealId: number, action: 'approve' | 'reject', comments?: string, rejectionReason?: string, userId?: number) {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true
        }
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      if (deal.status !== 'pending') {
        throw new Error('Deal is not in pending status');
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (comments) {
        updateData.notes = deal.notes ? `${deal.notes}\n\nApproval Comments: ${comments}` : `Approval Comments: ${comments}`;
      }

      if (action === 'reject' && rejectionReason) {
        updateData.notes = deal.notes ? `${deal.notes}\n\nRejection Reason: ${rejectionReason}` : `Rejection Reason: ${rejectionReason}`;
      }

      const updatedDeal = await prisma.deal.update({
        where: { id: dealId },
        data: updateData,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update commission status
      if (action === 'approve') {
        await prisma.saleCommission.updateMany({
          where: { dealId },
          data: { status: 'approved' }
        });
      } else {
        await prisma.saleCommission.updateMany({
          where: { dealId },
          data: { status: 'cancelled' }
        });
      }

      logger.info(`${action === 'approve' ? 'Approved' : 'Rejected'} deal ${dealId} by user ${userId}`);
      return updatedDeal;
    } catch (error) {
      logger.error(`Error ${action}ing deal ${dealId}:`, error);
      throw error;
    }
  }

  // Add payment record
  async addPayment(dealId: number, paymentData: CreatePaymentData, userId: number) {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true
        }
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      const payment = await prisma.paymentHistory.create({
        data: {
          dealId,
          paymentAmount: paymentData.paymentAmount,
          paymentDate: paymentData.paymentDate || new Date(),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          receiptNumber: paymentData.receiptNumber,
          notes: paymentData.notes,
          paymentStatus: 'completed'
        }
      });

      logger.info(`Added payment record for deal ${dealId} by user ${userId}`);
      return payment;
    } catch (error) {
      logger.error(`Error adding payment for deal ${dealId}:`, error);
      throw error;
    }
  }

  // Get deal payments
  async getDealPayments(dealId: number, userId: number, userRole: string) {
    try {
      // Check access to deal
      const dealExists = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true,
          ...(userRole === 'agent' && { agentId: userId })
        }
      });

      if (!dealExists) {
        throw new Error('Deal not found or access denied');
      }

      const payments = await prisma.paymentHistory.findMany({
        where: { dealId },
        orderBy: { paymentDate: 'desc' }
      });

      return payments;
    } catch (error) {
      logger.error(`Error getting payments for deal ${dealId}:`, error);
      throw error;
    }
  }

  // Get deal pipeline statistics
  async getDealPipeline(userId: number, userRole: string) {
    try {
      const where: Prisma.DealWhereInput = {
        isActive: true,
        ...(userRole === 'agent' && { agentId: userId })
      };

      const pipeline = await prisma.deal.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        },
        _sum: {
          dealValue: true
        }
      });

      const totalDeals = await prisma.deal.count({ where });
      const totalValue = await prisma.deal.aggregate({
        where,
        _sum: {
          dealValue: true
        }
      });

      return {
        pipeline,
        summary: {
          totalDeals,
          totalValue: totalValue._sum.dealValue || 0
        }
      };
    } catch (error) {
      logger.error('Error getting deal pipeline:', error);
      throw error;
    }
  }

  // Calculate commission for a deal
  async calculateCommission(dealId: number, agentId: number, commissionType: string = 'primary') {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true
        }
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      // Check if commission already exists
      const existingCommission = await prisma.saleCommission.findFirst({
        where: {
          dealId,
          agentId,
          commissionType
        }
      });

      if (existingCommission) {
        return existingCommission;
      }

      // Create new commission record
      const commission = await prisma.saleCommission.create({
        data: {
          dealId,
          agentId,
          commissionType,
          commissionRate: deal.commissionRate,
          commissionAmount: deal.commissionAmount,
          status: deal.status === 'approved' ? 'approved' : 'pending'
        }
      });

      return commission;
    } catch (error) {
      logger.error('Error calculating commission:', error);
      throw error;
    }
  }
}

export const dealService = new DealService();