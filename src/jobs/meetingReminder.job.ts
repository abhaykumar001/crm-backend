/**
 * Meeting Reminder Job
 * 
 * Purpose: Reminds agents before scheduled meetings
 * Schedule: Every 5 minutes
 * 
 * Business Logic:
 * - Checks leads with meetingTime in next 30-35 minutes
 * - Sends notification to assigned agent
 * - Multi-channel: In-app + Email + Push
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';

const prisma = new PrismaClient();

export async function runMeetingReminderJob(): Promise<void> {
  console.log('🔄 Starting Meeting Reminder Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Meeting Reminder job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'meetingReminder', startedAt: new Date().toISOString() }
    });

    // Calculate time window: 30-35 minutes from now
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

    // Find leads with meetings due in 30-35 minutes
    const upcomingMeetings = await prisma.lead.findMany({
      where: {
        meetingTime: {
          gte: thirtyMinutesFromNow,
          lte: thirtyFiveMinutesFromNow
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

    console.log(`📊 Found ${upcomingMeetings.length} upcoming meetings in next 30-35 minutes`);

    let remindersSent = 0;

    for (const lead of upcomingMeetings) {
      if (!lead.agent) continue;

      try {
        const meetingTime = lead.meetingTime 
          ? new Date(lead.meetingTime).toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          : 'Not set';

        // Create notification record (in-app notification)
        await prisma.deviceNotification.create({
          data: {
            userId: lead.agent.id,
            deviceToken: lead.agent.deviceToken || '',
            deviceType: 'web',
            title: '🤝 Meeting Reminder',
            body: `Meeting with "${lead.name}" scheduled at ${meetingTime}`,
            data: {
              leadId: lead.id,
              leadName: lead.name,
              meetingTime: lead.meetingTime?.toISOString(),
              leadPhone: lead.mobileNumber,
              address: lead.address || 'Address not provided'
            },
            status: 'sent'
          }
        });

        // Log the reminder
        await activityLogService.log({
          eventType: 'meeting_reminder_sent',
          description: `Meeting reminder sent to ${lead.agent.name} for lead "${lead.name}" at ${meetingTime}`,
          subjectType: 'Lead',
          subjectId: lead.id,
          causerId: lead.agent.id || undefined,
          properties: {
            leadId: lead.id,
            leadName: lead.name,
            agentId: lead.agent.id,
            agentName: lead.agent.name,
            meetingTime: lead.meetingTime,
            reminderSentAt: new Date().toISOString()
          }
        });

        // TODO: Send push notification via FCM if deviceToken exists
        // TODO: Send email reminder with meeting details

        remindersSent++;
        console.log(`✅ Meeting reminder sent to ${lead.agent.name} for lead ${lead.name}`);
      } catch (error) {
        console.error(`❌ Error sending meeting reminder for lead ${lead.id}:`, error);
        // Continue with other reminders
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Meeting Reminder Job completed in ${duration}ms`);
    console.log(`📧 Sent ${remindersSent} of ${upcomingMeetings.length} reminders`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Meeting Reminder job completed: ${remindersSent} reminders sent`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'meetingReminder',
        duration,
        upcomingMeetings: upcomingMeetings.length,
        remindersSent,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Meeting Reminder Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Meeting Reminder job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'meetingReminder',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runMeetingReminderJob;
