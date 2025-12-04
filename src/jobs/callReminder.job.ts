/**
 * Call Reminder Job
 * 
 * Purpose: Reminds agents 5 minutes before scheduled callback
 * Schedule: Every 5 minutes
 * 
 * Business Logic:
 * - Checks leads with followUpDate in next 5-10 minutes
 * - Sends notification to assigned agent
 * - Prevents missed callbacks
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';

const prisma = new PrismaClient();

export async function runCallReminderJob(): Promise<void> {
  console.log('🔄 Starting Call Reminder Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Call Reminder job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'callReminder', startedAt: new Date().toISOString() }
    });

    // Calculate time window: 5-10 minutes from now
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // Find leads with callback due in 5-10 minutes
    const upcomingCallbacks = await prisma.lead.findMany({
      where: {
        followUpDate: {
          gte: fiveMinutesFromNow,
          lte: tenMinutesFromNow
        },
        agentId: {
          not: null
        },
        deletedAt: null
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            deviceToken: true
          }
        }
      }
    });

    console.log(`📊 Found ${upcomingCallbacks.length} upcoming callbacks in next 5-10 minutes`);

    let remindersSent = 0;

    for (const lead of upcomingCallbacks) {
      if (!lead.agent) continue;

      try {
        // Create notification record (in-app notification)
        await prisma.deviceNotification.create({
          data: {
            userId: lead.agent.id,
            deviceToken: lead.agent.deviceToken || '',
            deviceType: 'web',
            title: '📞 Callback Reminder',
            body: `Callback scheduled for lead "${lead.name}" at ${lead.followUpDate?.toLocaleTimeString()}`,
            data: {
              leadId: lead.id,
              leadName: lead.name,
              followUpDate: lead.followUpDate?.toISOString(),
              leadPhone: lead.mobileNumber
            },
            status: 'sent'
          }
        });

        // Log the reminder
        await activityLogService.log({
          eventType: 'call_reminder_sent',
          description: `Call reminder sent to ${lead.agent.name} for lead "${lead.name}"`,
          subjectType: 'Lead',
          subjectId: lead.id,
          causerId: lead.agent.id || undefined,
          properties: {
            leadId: lead.id,
            leadName: lead.name,
            agentId: lead.agent.id,
            agentName: lead.agent.name,
            followUpDate: lead.followUpDate,
            reminderSentAt: new Date().toISOString()
          }
        });

        // TODO: Send push notification via FCM if deviceToken exists
        // TODO: Send email reminder

        remindersSent++;
        console.log(`✅ Reminder sent to ${lead.agent.name} for lead ${lead.name}`);
      } catch (error) {
        console.error(`❌ Error sending reminder for lead ${lead.id}:`, error);
        // Continue with other reminders
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Call Reminder Job completed in ${duration}ms`);
    console.log(`📧 Sent ${remindersSent} of ${upcomingCallbacks.length} reminders`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Call Reminder job completed: ${remindersSent} reminders sent`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'callReminder',
        duration,
        upcomingCallbacks: upcomingCallbacks.length,
        remindersSent,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Call Reminder Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Call Reminder job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'callReminder',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runCallReminderJob;
