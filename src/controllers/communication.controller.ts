import { Request, Response } from 'express';
import { communicationService } from '../services/communication.service';
import logger from '../utils/logger';

// Use the existing authenticated request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
}

class CommunicationController {
  // ==================== CALL LOGS ====================

  // Create call log
  async createCallLog(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const callLog = await communicationService.createCallLog(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Call log created successfully',
        data: callLog
      });
    } catch (error) {
      logger.error('Error in createCallLog controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Get call logs
  async getCallLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await communicationService.getCallLogs(
        req.query as any,
        req.user.id,
        req.user.roles[0] || 'agent'
      );

      res.json({
        success: true,
        message: 'Call logs retrieved successfully',
        data: result.callLogs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getCallLogs controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve call logs'
      });
    }
  }

  // Update call log
  async updateCallLog(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const callLogId = parseInt(req.params.id);
      if (isNaN(callLogId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid call log ID'
        });
      }

      const updatedCallLog = await communicationService.updateCallLog(
        callLogId,
        req.body,
        req.user.id,
        req.user.roles[0] || 'agent'
      );

      res.json({
        success: true,
        message: 'Call log updated successfully',
        data: updatedCallLog
      });
    } catch (error) {
      logger.error('Error in updateCallLog controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Get call statistics
  async getCallStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const statistics = await communicationService.getCallStatistics(
        req.user.id,
        req.user.roles[0] || 'agent',
        start,
        end
      );

      res.json({
        success: true,
        message: 'Call statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      logger.error('Error in getCallStatistics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve call statistics'
      });
    }
  }

  // ==================== SMS NOTIFICATIONS ====================

  // Send SMS
  async sendSMS(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const smsResult = await communicationService.sendSMS(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'SMS sent successfully',
        data: smsResult
      });
    } catch (error) {
      logger.error('Error in sendSMS controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Send bulk SMS
  async sendBulkSMS(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { phoneNumbers, message } = req.body;
      const result = await communicationService.sendBulkSMS(phoneNumbers, message, req.user.id);
      
      res.status(201).json({
        success: true,
        message: `Bulk SMS sent: ${result.totalSent} successful, ${result.totalFailed} failed`,
        data: result
      });
    } catch (error) {
      logger.error('Error in sendBulkSMS controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // ==================== WHATSAPP NOTIFICATIONS ====================

  // Send WhatsApp message
  async sendWhatsAppMessage(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const whatsappResult = await communicationService.sendWhatsAppMessage(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: whatsappResult
      });
    } catch (error) {
      logger.error('Error in sendWhatsAppMessage controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // ==================== EMAIL SYSTEM ====================

  // Create email template
  async createEmailTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const template = await communicationService.createEmailTemplate(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: template
      });
    } catch (error) {
      logger.error('Error in createEmailTemplate controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Get email templates
  async getEmailTemplates(req: Request, res: Response) {
    try {
      const { type } = req.query;
      const templates = await communicationService.getEmailTemplates(type as string);
      
      res.json({
        success: true,
        message: 'Email templates retrieved successfully',
        data: templates
      });
    } catch (error) {
      logger.error('Error in getEmailTemplates controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve email templates'
      });
    }
  }

  // Send email
  async sendEmail(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const emailResult = await communicationService.sendEmail(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Email sent successfully',
        data: emailResult
      });
    } catch (error) {
      logger.error('Error in sendEmail controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // ==================== NOTIFICATIONS ====================

  // Create notification
  async createNotification(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const notification = await communicationService.createNotification(req.body);
      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      logger.error('Error in createNotification controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Create bulk notifications
  async createBulkNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userIds, title, message, type, data } = req.body;
      const notifications = await communicationService.createBulkNotifications(
        userIds,
        title,
        message,
        type,
        data
      );

      res.status(201).json({
        success: true,
        message: `${notifications.length} notifications created successfully`,
        data: notifications
      });
    } catch (error) {
      logger.error('Error in createBulkNotifications controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Get user notifications
  async getUserNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { isRead, page, limit } = req.query;
      const isReadBoolean = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await communicationService.getUserNotifications(
        req.user.id,
        isReadBoolean,
        pageNum,
        limitNum
      );

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.notifications,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getUserNotifications controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications'
      });
    }
  }

  // Mark notification as read
  async markNotificationAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }

      const notification = await communicationService.markNotificationAsRead(
        notificationId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      logger.error('Error in markNotificationAsRead controller:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await communicationService.markAllNotificationsAsRead(req.user.id);
      res.json({
        success: true,
        message: `${result.count} notifications marked as read`,
        data: result
      });
    } catch (error) {
      logger.error('Error in markAllNotificationsAsRead controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await communicationService.getUnreadNotificationCount(req.user.id);
      res.json({
        success: true,
        message: 'Unread notification count retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in getUnreadNotificationCount controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unread notification count'
      });
    }
  }
}

export const communicationController = new CommunicationController();