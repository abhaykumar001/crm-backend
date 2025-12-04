import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

// Twilio client for SMS and WhatsApp (placeholder - will be implemented when needed)
const twilioClient = null;

// Interfaces
export interface CallLogData {
  leadId: number;
  callType: 'incoming' | 'outgoing' | 'missed';
  callDuration?: number;
  callStatus: 'answered' | 'not_answered' | 'busy' | 'failed' | 'voicemail';
  notes?: string;
  callStartTime?: Date;
  callEndTime?: Date;
  recordingPath?: string;
}

export interface CallLogQuery {
  page?: number;
  limit?: number;
  leadId?: number;
  agentId?: number;
  callType?: string;
  callStatus?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SmsData {
  phoneNumber: string;
  message: string;
  templateId?: number;
  leadId?: number;
  scheduledAt?: Date;
}

export interface WhatsAppData {
  phoneNumber: string;
  message: string;
  messageType?: 'text' | 'template' | 'media';
  templateName?: string;
  mediaUrl?: string;
  leadId?: number;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  isHTML?: boolean;
  templateId?: number;
  templateVariables?: Record<string, any>;
  leadId?: number;
  scheduledAt?: Date;
}

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class CommunicationService {
  // ==================== CALL LOGS ====================
  
  // Create call log
  async createCallLog(callData: CallLogData, agentId: number) {
    try {
      // Validate lead exists
      const lead = await prisma.lead.findFirst({
        where: {
          id: callData.leadId,
          isActive: true
        }
      });

      if (!lead) {
        throw new Error('Lead not found or inactive');
      }

      // Calculate call duration if not provided but end time is available
      let callDuration = callData.callDuration;
      if (!callDuration && callData.callEndTime && callData.callStartTime) {
        callDuration = Math.floor(
          (callData.callEndTime.getTime() - callData.callStartTime.getTime()) / 1000
        );
      }

      const callLog = await prisma.callLog.create({
        data: {
          leadId: callData.leadId,
          agentId,
          callType: callData.callType,
          callDuration,
          callStatus: callData.callStatus,
          notes: callData.notes,
          callStartTime: callData.callStartTime || new Date(),
          callEndTime: callData.callEndTime,
          recordingPath: callData.recordingPath
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              email: true
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

      logger.info(`Created call log ${callLog.id} for lead ${callData.leadId} by agent ${agentId}`);
      return callLog;
    } catch (error) {
      logger.error('Error creating call log:', error);
      throw error;
    }
  }

  // Get call logs with filtering
  async getCallLogs(query: CallLogQuery, userId: number, userRole: string) {
    try {
      const {
        page = 1,
        limit = 20,
        leadId,
        agentId,
        callType,
        callStatus,
        startDate,
        endDate,
        sortBy = 'callStartTime',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CallLogWhereInput = {};

      // Role-based filtering
      if (userRole === 'agent') {
        where.agentId = userId;
      } else if (agentId) {
        where.agentId = agentId;
      }

      if (leadId) where.leadId = leadId;
      if (callType) where.callType = callType as any;
      if (callStatus) where.callStatus = callStatus as any;

      // Date range filtering
      if (startDate || endDate) {
        where.callStartTime = {};
        if (startDate) where.callStartTime.gte = startDate;
        if (endDate) where.callStartTime.lte = endDate;
      }

      // Build orderBy clause
      const orderBy: Prisma.CallLogOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Prisma.CallLogOrderByWithRelationInput] = sortOrder;

      const [callLogs, total] = await Promise.all([
        prisma.callLog.findMany({
          where,
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                mobileNumber: true,
                email: true,
                status: true
              }
            },
            agent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy
        }),
        prisma.callLog.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        callLogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting call logs:', error);
      throw new Error('Failed to retrieve call logs');
    }
  }

  // Update call log
  async updateCallLog(callLogId: number, updateData: Partial<CallLogData>, userId: number, userRole: string) {
    try {
      // Check if call log exists and user has access
      const existingCallLog = await prisma.callLog.findFirst({
        where: {
          id: callLogId,
          ...(userRole === 'agent' && { agentId: userId })
        }
      });

      if (!existingCallLog) {
        throw new Error('Call log not found or access denied');
      }

      // Calculate call duration if end time is being updated
      let callDuration = updateData.callDuration;
      if (!callDuration && updateData.callEndTime) {
        const startTime = updateData.callStartTime || existingCallLog.callStartTime;
        callDuration = Math.floor(
          (updateData.callEndTime.getTime() - startTime.getTime()) / 1000
        );
      }

      const updatedCallLog = await prisma.callLog.update({
        where: { id: callLogId },
        data: {
          ...updateData,
          callDuration,
          updatedAt: new Date()
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              email: true
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

      logger.info(`Updated call log ${callLogId} by user ${userId}`);
      return updatedCallLog;
    } catch (error) {
      logger.error(`Error updating call log ${callLogId}:`, error);
      throw error;
    }
  }

  // ==================== SMS NOTIFICATIONS ====================

  // Send SMS
  async sendSMS(smsData: SmsData, userId: number) {
    try {
      // Create SMS notification record
      const smsNotification = await prisma.smsNotification.create({
        data: {
          phoneNumber: smsData.phoneNumber,
          message: smsData.message,
          status: 'pending'
        }
      });

      // SMS sending logic placeholder - will be implemented with actual provider
      // For now, just mark as sent for testing purposes
      await prisma.smsNotification.update({
        where: { id: smsNotification.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

      logger.info(`SMS queued successfully to ${smsData.phoneNumber} by user ${userId}`);

      return smsNotification;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Send bulk SMS
  async sendBulkSMS(phoneNumbers: string[], message: string, userId: number) {
    try {
      const results = [];
      
      for (const phoneNumber of phoneNumbers) {
        try {
          const result = await this.sendSMS({ phoneNumber, message }, userId);
          results.push({ phoneNumber, success: true, messageId: result.id });
        } catch (error) {
          results.push({ 
            phoneNumber, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`Bulk SMS: ${successCount}/${phoneNumbers.length} messages sent successfully by user ${userId}`);

      return {
        totalSent: successCount,
        totalFailed: phoneNumbers.length - successCount,
        results
      };
    } catch (error) {
      logger.error('Error sending bulk SMS:', error);
      throw error;
    }
  }

  // ==================== WHATSAPP NOTIFICATIONS ====================

  // Send WhatsApp message
  async sendWhatsAppMessage(whatsappData: WhatsAppData, userId: number) {
    try {
      // Create WhatsApp notification record
      const whatsappNotification = await prisma.whatsappNotification.create({
        data: {
          phoneNumber: whatsappData.phoneNumber,
          message: whatsappData.message,
          messageType: whatsappData.messageType || 'text',
          templateName: whatsappData.templateName,
          status: 'pending'
        }
      });

      // WhatsApp sending logic placeholder - will be implemented with actual provider
      // For now, just mark as sent for testing purposes
      await prisma.whatsappNotification.update({
        where: { id: whatsappNotification.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

      logger.info(`WhatsApp message queued successfully to ${whatsappData.phoneNumber} by user ${userId}`);

      return whatsappNotification;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // ==================== EMAIL SYSTEM ====================

  // Create email template
  async createEmailTemplate(templateData: any, userId: number) {
    try {
      const template = await prisma.emailTemplate.create({
        data: {
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          type: templateData.type,
          variables: templateData.variables ? JSON.stringify(templateData.variables) : null,
          isActive: templateData.isActive !== false
        }
      });

      logger.info(`Created email template ${template.id} by user ${userId}`);
      return template;
    } catch (error) {
      logger.error('Error creating email template:', error);
      throw error;
    }
  }

  // Get email templates
  async getEmailTemplates(type?: string) {
    try {
      const where: Prisma.EmailTemplateWhereInput = {
        isActive: true
      };

      if (type) where.type = type;

      const templates = await prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Parse variables JSON
      return templates.map(template => ({
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : []
      }));
    } catch (error) {
      logger.error('Error getting email templates:', error);
      throw error;
    }
  }

  // Send email
  async sendEmail(emailData: EmailData, userId: number) {
    try {
      // If using template, get template data
      let subject = emailData.subject;
      let body = emailData.body;

      if (emailData.templateId) {
        const template = await prisma.emailTemplate.findFirst({
          where: {
            id: emailData.templateId,
            isActive: true
          }
        });

        if (!template) {
          throw new Error('Email template not found or inactive');
        }

        subject = template.subject;
        body = template.body;

        // Replace variables in template
        if (emailData.templateVariables) {
          Object.keys(emailData.templateVariables).forEach(key => {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(new RegExp(placeholder, 'g'), emailData.templateVariables![key]);
            body = body.replace(new RegExp(placeholder, 'g'), emailData.templateVariables![key]);
          });
        }
      }

      // Prepare email options
      const mailOptions = {
        from: `${process.env.MAIL_FROM_NAME || 'Modern CRM'} <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject,
        [emailData.isHTML ? 'html' : 'text']: body
      };

      // Send email
      const info = await emailTransporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${emailData.to} by user ${userId}`);
      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================

  // Create notification
  async createNotification(notificationData: NotificationData) {
    try {
      // Validate user exists
      const user = await prisma.user.findFirst({
        where: {
          id: notificationData.userId,
          isActive: true
        }
      });

      if (!user) {
        throw new Error('User not found or inactive');
      }

      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          data: notificationData.data ? JSON.stringify(notificationData.data) : undefined
        }
      });

      logger.info(`Created notification ${notification.id} for user ${notificationData.userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create bulk notifications
  async createBulkNotifications(userIds: number[], title: string, message: string, type = 'info', data?: Record<string, any>) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.createNotification({
          userId,
          title,
          message,
          type: type as any,
          data
        }))
      );

      logger.info(`Created ${notifications.length} bulk notifications`);
      return notifications;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: number, isRead?: boolean, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const where: Prisma.NotificationWhereInput = {
        userId
      };

      if (typeof isRead === 'boolean') {
        where.isRead = isRead;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      // Parse data JSON
      const processedNotifications = notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data as string) : null
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        notifications: processedNotifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number, userId: number) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      return updatedNotification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: number) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId: number) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return { unreadCount: count };
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  // ==================== COMMUNICATION ANALYTICS ====================

  // Get call statistics
  async getCallStatistics(userId: number, userRole: string, startDate?: Date, endDate?: Date) {
    try {
      const where: Prisma.CallLogWhereInput = {};

      // Role-based filtering
      if (userRole === 'agent') {
        where.agentId = userId;
      }

      // Date filtering
      if (startDate || endDate) {
        where.callStartTime = {};
        if (startDate) where.callStartTime.gte = startDate;
        if (endDate) where.callStartTime.lte = endDate;
      }

      const [
        totalCalls,
        answeredCalls,
        callsByType,
        callsByStatus,
        averageDuration
      ] = await Promise.all([
        prisma.callLog.count({ where }),
        prisma.callLog.count({ 
          where: { ...where, callStatus: 'answered' } 
        }),
        prisma.callLog.groupBy({
          by: ['callType'],
          where,
          _count: { id: true }
        }),
        prisma.callLog.groupBy({
          by: ['callStatus'],
          where,
          _count: { id: true }
        }),
        prisma.callLog.aggregate({
          where: { ...where, callDuration: { not: null } },
          _avg: { callDuration: true }
        })
      ]);

      return {
        totalCalls,
        answeredCalls,
        answerRate: totalCalls > 0 ? (answeredCalls / totalCalls * 100).toFixed(2) : '0',
        averageDuration: Math.round(averageDuration._avg.callDuration || 0),
        callsByType,
        callsByStatus
      };
    } catch (error) {
      logger.error('Error getting call statistics:', error);
      throw error;
    }
  }
}

export const communicationService = new CommunicationService();