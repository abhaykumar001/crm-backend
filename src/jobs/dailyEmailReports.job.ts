/**
 * Daily Email Reports Job
 * 
 * Purpose: Sends daily lead status reports to managers
 * Schedule: Daily at 8:00 AM
 * 
 * Business Logic:
 * - Generates lead status summary reports
 * - Sends to managers and team leaders
 * - Includes: new leads, conversions, pending follow-ups
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';

const prisma = new PrismaClient();

export async function runDailyEmailReportsJob(): Promise<void> {
  console.log('🔄 Starting Daily Email Reports Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Daily Email Reports job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'dailyEmailReports', startedAt: new Date().toISOString() }
    });

    // Calculate yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get managers and team leaders - anyone with Active status
    const recipients = await prisma.user.findMany({
      where: {
        status: 'Active',
        deletedAt: null,
        email: {
          not: ''
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true
      }
    });

    console.log(`👥 Found ${recipients.length} recipients for daily reports`);

    let reportsSent = 0;

    for (const recipient of recipients) {
      try {
        // Generate report data for this user's team
        const reportData = await generateReportData(recipient.id, yesterday, today);

        // Create notification record
        await prisma.deviceNotification.create({
          data: {
            userId: recipient.id,
            deviceToken: '', // No push for now
            deviceType: 'web',
            title: '📊 Daily Lead Status Report',
            body: `Yesterday: ${reportData.newLeads} new leads, ${reportData.conversions} conversions, ${reportData.pendingFollowUps} pending follow-ups`,
            data: reportData,
            status: 'sent'
          }
        });

        // Log activity
        await activityLogService.log({
          eventType: 'daily_report_sent',
          description: `Daily report sent to ${recipient.name} (${recipient.designation || 'User'})`,
          subjectType: 'User',
          subjectId: recipient.id,
          causerId: recipient.id,
          properties: {
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientDesignation: recipient.designation,
            reportDate: yesterday.toISOString().split('T')[0],
            ...reportData
          }
        });

        // TODO: Send actual email with formatted report
        // TODO: Include charts and detailed breakdown

        reportsSent++;
        console.log(`✅ Report sent to ${recipient.name} (${recipient.email})`);
      } catch (error) {
        console.error(`❌ Error sending report to ${recipient.name}:`, error);
        // Continue with other recipients
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Daily Email Reports Job completed in ${duration}ms`);
    console.log(`📧 Sent ${reportsSent} of ${recipients.length} reports`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Daily Email Reports job completed: ${reportsSent} reports sent`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'dailyEmailReports',
        duration,
        recipients: recipients.length,
        reportsSent,
        reportDate: yesterday.toISOString().split('T')[0],
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Daily Email Reports Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Daily Email Reports job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'dailyEmailReports',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

/**
 * Generate report data for a specific user
 */
async function generateReportData(userId: number, startDate: Date, endDate: Date) {
  // Get user's team (find users reporting to this user)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subordinates: {
        select: { id: true }
      }
    }
  });

  const teamMemberIds = [userId, ...(user?.subordinates?.map((u: { id: number }) => u.id) || [])];

  // New leads created yesterday
  const newLeads = await prisma.lead.count({
    where: {
      agentId: {
        in: teamMemberIds
      },
      createdAt: {
        gte: startDate,
        lt: endDate
      },
      deletedAt: null
    }
  });

  // Conversions (deals closed yesterday)
  const conversions = await prisma.deal.count({
    where: {
      lead: {
        agentId: {
          in: teamMemberIds
        }
      },
      status: 'Closed Won',
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    }
  });

  // Pending follow-ups (due today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const pendingFollowUps = await prisma.lead.count({
    where: {
      agentId: {
        in: teamMemberIds
      },
      followUpDate: {
        gte: todayStart,
        lte: todayEnd
      },
      deletedAt: null
    }
  });

  // Active leads
  const activeLeads = await prisma.lead.count({
    where: {
      agentId: {
        in: teamMemberIds
      },
      type: 'Active',
      deletedAt: null
    }
  });

  // Meetings scheduled for today
  const meetingsToday = await prisma.lead.count({
    where: {
      agentId: {
        in: teamMemberIds
      },
      meetingTime: {
        gte: todayStart,
        lte: todayEnd
      },
      deletedAt: null
    }
  });

  return {
    newLeads,
    conversions,
    pendingFollowUps,
    activeLeads,
    meetingsToday,
    teamSize: teamMemberIds.length
  };
}

export default runDailyEmailReportsJob;
