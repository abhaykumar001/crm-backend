import express from 'express';
import { communicationController } from '../controllers/communication.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ==================== CALL LOGS ROUTES ====================

// Create call log
router.post('/call-logs', 
  communicationController.createCallLog
);

// Get call logs
router.get('/call-logs',
  communicationController.getCallLogs
);

// Update call log
router.put('/call-logs/:id',
  communicationController.updateCallLog
);

// Get call statistics
router.get('/call-logs/statistics',
  communicationController.getCallStatistics
);

// ==================== SMS ROUTES ====================

// Send SMS
router.post('/sms/send',
  communicationController.sendSMS
);

// Send bulk SMS
router.post('/sms/send-bulk',
  communicationController.sendBulkSMS
);

// ==================== WHATSAPP ROUTES ====================

// Send WhatsApp message
router.post('/whatsapp/send',
  communicationController.sendWhatsAppMessage
);

// ==================== EMAIL ROUTES ====================

// Create email template
router.post('/email/templates',
  communicationController.createEmailTemplate
);

// Get email templates
router.get('/email/templates',
  communicationController.getEmailTemplates
);

// Send email
router.post('/email/send',
  communicationController.sendEmail
);

// ==================== NOTIFICATION ROUTES ====================

// Create notification
router.post('/notifications',
  communicationController.createNotification
);

// Create bulk notifications (admin only)
router.post('/notifications/bulk',
  communicationController.createBulkNotifications
);

// Get user notifications
router.get('/notifications',
  communicationController.getUserNotifications
);

// Mark notification as read
router.put('/notifications/:id/read',
  communicationController.markNotificationAsRead
);

// Mark all notifications as read
router.put('/notifications/read-all',
  communicationController.markAllNotificationsAsRead
);

// Get unread notification count
router.get('/notifications/unread-count',
  communicationController.getUnreadNotificationCount
);

export default router;