import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  designation?: string;
  reportingTo?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  designation?: string;
  joiningDate?: Date;
  reportingTo?: number;
  isActive?: boolean;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {}

export interface UserPerformanceFilters {
  dateFrom?: Date;
  dateTo?: Date;
}

export class UserService {
  
  /**
   * Get users with filters and pagination
   */
  async getUsers(filters: UserFilters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      designation,
      reportingTo,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    
    // Build where condition
    const where: Prisma.UserWhereInput = {
      deletedAt: null // Only active users
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Active status filter
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Designation filter
    if (designation) {
      where.designation = { contains: designation, mode: 'insensitive' };
    }

    // Reporting to filter
    if (reportingTo) {
      where.reportingTo = reportingTo;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Role filter (through UserRole relation)
    if (role) {
      where.roles = {
        some: {
          role: {
            name: role
          }
        }
      };
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;

    // Execute queries
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          roles: {
            include: {
              role: true
            }
          },
          reportingToUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          subordinates: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              leads: true,
              deals: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform users to exclude sensitive data
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      designation: user.designation,
      joiningDate: user.joiningDate,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role),
      reportingTo: user.reportingToUser,
      subordinates: user.subordinates,
      stats: {
        totalLeads: user._count.leads,
        totalDeals: user._count.deals
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      users: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id: number) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        reportingToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true
          }
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            isActive: true
          }
        },
        _count: {
          select: {
            leads: true,
            deals: true,
            callLogs: true,
            notes: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Transform user to exclude sensitive data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      designation: user.designation,
      joiningDate: user.joiningDate,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ({
        ...ur.role,
        permissions: ur.role.permissions.map(rp => rp.permission)
      })),
      reportingTo: user.reportingToUser,
      subordinates: user.subordinates,
      stats: {
        totalLeads: user._count.leads,
        totalDeals: user._count.deals,
        totalCalls: user._count.callLogs,
        totalNotes: user._count.notes
      }
    };
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData, createdBy: number) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        mobileNumber: data.mobileNumber,
        designation: data.designation,
        joiningDate: data.joiningDate || new Date(),
        reportingTo: data.reportingTo,
        isActive: data.isActive ?? true
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        reportingToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('user_created', `User ${user.name} created`, createdBy, user.id);

    // Return user without password
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      designation: user.designation,
      joiningDate: user.joiningDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role),
      reportingTo: user.reportingToUser
    };
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserData, updatedBy: number) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: id },
          deletedAt: null
        }
      });

      if (emailExists) {
        throw new Error('User with this email already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        reportingToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('user_updated', `User ${user.name} updated`, updatedBy, user.id);

    // Return user without password
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      designation: user.designation,
      joiningDate: user.joiningDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role),
      reportingTo: user.reportingToUser
    };
  }

  /**
   * Soft delete user
   */
  async deleteUser(id: number, deletedBy: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    // Log activity
    await this.logActivity('user_deleted', `User ${user.name} deleted`, deletedBy, user.id);
  }

  /**
   * Activate user
   */
  async activateUser(id: number, activatedBy: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('user_activated', `User ${user.name} activated`, activatedBy, user.id);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      roles: updatedUser.roles.map(ur => ur.role)
    };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: number, deactivatedBy: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('user_deactivated', `User ${user.name} deactivated`, deactivatedBy, user.id);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      roles: updatedUser.roles.map(ur => ur.role)
    };
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: number, roleId: number, assignedBy: number) {
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId, roleId }
    });

    if (existingUserRole) {
      throw new Error('User already has this role');
    }

    // Assign role
    const userRole = await prisma.userRole.create({
      data: { userId, roleId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('role_assigned', `Role ${role.name} assigned to user ${user.name}`, assignedBy, userId);

    return userRole;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: number, roleId: number, removedBy: number) {
    // Check if user role exists
    const userRole = await prisma.userRole.findFirst({
      where: { userId, roleId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!userRole) {
      throw new Error('User role not found');
    }

    // Remove role
    await prisma.userRole.delete({
      where: {
        userId_roleId: { userId, roleId }
      }
    });

    // Log activity
    await this.logActivity('role_removed', `Role ${userRole.role.name} removed from user ${userRole.user.name}`, removedBy, userId);
  }

  /**
   * Get user performance metrics
   */
  async getUserPerformance(userId: number, filters: UserPerformanceFilters = {}) {
    const { dateFrom, dateTo } = filters;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo) dateFilter.lte = dateTo;

    const whereClause = dateFrom || dateTo ? { createdAt: dateFilter } : {};

    // Get performance metrics
    const [leadsStats, dealsStats, callStats, activityStats] = await Promise.all([
      // Lead statistics
      prisma.lead.groupBy({
        by: ['statusId'],
        where: {
          agentId: userId,
          ...whereClause
        },
        _count: true
      }),
      
      // Deal statistics
      prisma.deal.aggregate({
        where: {
          agentId: userId,
          ...whereClause
        },
        _count: true,
        _sum: {
          dealValue: true,
          commissionAmount: true
        }
      }),

      // Call statistics
      prisma.callLog.aggregate({
        where: {
          agentId: userId,
          ...whereClause
        },
        _count: true,
        _avg: {
          callDuration: true
        }
      }),

      // Activity statistics
      prisma.logActivity.count({
        where: {
          causerId: userId,
          ...whereClause
        }
      })
    ]);

    // Get lead conversion rate
    const totalLeads = await prisma.lead.count({
      where: {
        agentId: userId,
        ...whereClause
      }
    });

    const convertedLeads = await prisma.deal.count({
      where: {
        agentId: userId,
        ...whereClause
      }
    });

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      userId: user.id,
      userName: user.name,
      period: { dateFrom, dateTo },
      leads: {
        total: totalLeads,
        byStatus: leadsStats,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      deals: {
        total: dealsStats._count,
        totalValue: dealsStats._sum.dealValue || 0,
        totalCommission: dealsStats._sum.commissionAmount || 0
      },
      calls: {
        total: callStats._count,
        averageDuration: Math.round((callStats._avg.callDuration || 0) / 60) // in minutes
      },
      activities: {
        total: activityStats
      }
    };
  }

  /**
   * Get user's leads
   */
  async getUserLeads(userId: number, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where: {
          agentId: userId,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          source: true,
          status: true,
          project: true
        }
      }),
      prisma.lead.count({
        where: {
          agentId: userId,
          deletedAt: null
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      leads,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Get user's deals
   */
  async getUserDeals(userId: number, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [deals, totalCount] = await Promise.all([
      prisma.deal.findMany({
        where: {
          agentId: userId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          lead: true,
          project: true
        }
      }),
      prisma.deal.count({
        where: {
          agentId: userId,
          isActive: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      deals,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, newPassword: string, changedBy: number) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log activity
    await this.logActivity('password_changed', `Password changed for user ${user.name}`, changedBy, userId);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, data: any, updatedBy: number) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        mobileNumber: data.mobileNumber,
        designation: data.designation,
        profileImage: data.profileImage,
        updatedAt: new Date()
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity('profile_updated', `Profile updated for user ${user.name}`, updatedBy, userId);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobileNumber: updatedUser.mobileNumber,
      profileImage: updatedUser.profileImage,
      designation: updatedUser.designation,
      roles: updatedUser.roles.map(ur => ur.role)
    };
  }

  /**
   * Log activity
   */
  private async logActivity(action: string, description: string, causerId: number, subjectId?: number) {
    await prisma.logActivity.create({
      data: {
        logName: 'user_management',
        description,
        subjectType: 'User',
        subjectId,
        causerId,
        properties: JSON.stringify({ action })
      }
    });
  }
}

export default new UserService();