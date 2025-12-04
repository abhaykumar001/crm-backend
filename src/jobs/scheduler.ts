import * as cron from 'node-cron';
import autoLeadDistributionJob from './autoLeadDistribution.job';
import noActivityLeadRotationJob from './noActivityLeadRotation.job';
import runFreshLeadAssignmentJob from './freshLeadAssignment.job';
import runNoAnswerStatusRotationJob from './noAnswerStatusRotation.job';
import runNotInterestedStatusRotationJob from './notInterestedStatusRotation.job';
import runCallReminderJob from './callReminder.job';
import runMeetingReminderJob from './meetingReminder.job';
import runLeadDNDCheckJob from './leadDNDCheck.job';
import runDailyEmailReportsJob from './dailyEmailReports.job';

/**
 * Job Scheduler
 * 
 * Manages all cron jobs using node-cron.
 * 
 * Schedule Formats (node-cron syntax):
 * ┌────────────── second (0-59, optional)
 * │ ┌──────────── minute (0-59)
 * │ │ ┌────────── hour (0-23)
 * │ │ │ ┌──────── day of month (1-31)
 * │ │ │ │ ┌────── month (1-12)
 * │ │ │ │ │ ┌──── day of week (0-7, 0 and 7 = Sunday)
 * │ │ │ │ │ │
 * * * * * * *
 * 
 * Examples:
 * - Every 15 minutes: '0,15,30,45 * * * *'
 * - Every 30 minutes: '0,30 * * * *'
 * - Every hour: '0 * * * *'
 * - 9 AM weekdays: '0 9 * * 1-5'
 * - Midnight daily: '0 0 * * *'
 */

interface ScheduledJob {
  name: string;
  schedule: string;
  task: cron.ScheduledTask;
  enabled: boolean;
}

class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private isRunning: boolean = false;

  /**
   * Initialize all cron jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Job scheduler is already running');
      return;
    }

    console.log('\n🚀 Starting Job Scheduler...');

    // Job 1: Auto Lead Distribution (every 15 minutes)
    this.scheduleJob(
      'Auto Lead Distribution',
      '*/15 * * * *', // Every 15 minutes
      async () => {
        await autoLeadDistributionJob.execute();
      }
    );

    // Job 2: No Activity Lead Rotation (every 30 minutes)
    this.scheduleJob(
      'No Activity Lead Rotation',
      '*/30 * * * *', // Every 30 minutes
      async () => {
        await noActivityLeadRotationJob.execute();
      }
    );

    // Job 3: Fresh Lead Assignment (daily at 4 AM)
    this.scheduleJob(
      'Fresh Lead Assignment',
      '0 4 * * *', // Daily at 4:00 AM
      async () => {
        await runFreshLeadAssignmentJob();
      }
    );

    // Job 4: No Answer Status Rotation (every 4 hours)
    this.scheduleJob(
      'No Answer Status Rotation',
      '0 */4 * * *', // Every 4 hours
      async () => {
        await runNoAnswerStatusRotationJob();
      }
    );

    // Job 5: Not Interested Status Rotation (every 4 hours)
    this.scheduleJob(
      'Not Interested Status Rotation',
      '0 */4 * * *', // Every 4 hours
      async () => {
        await runNotInterestedStatusRotationJob();
      }
    );

    // Job 6: Call Reminder (every 5 minutes)
    this.scheduleJob(
      'Call Reminder',
      '*/5 * * * *', // Every 5 minutes
      async () => {
        await runCallReminderJob();
      }
    );

    // Job 7: Meeting Reminder (every 5 minutes)
    this.scheduleJob(
      'Meeting Reminder',
      '*/5 * * * *', // Every 5 minutes
      async () => {
        await runMeetingReminderJob();
      }
    );

    // Job 8: Lead DND Check (daily at 3 AM)
    this.scheduleJob(
      'Lead DND Check',
      '0 3 * * *', // Daily at 3:00 AM
      async () => {
        await runLeadDNDCheckJob();
      }
    );

    // Job 9: Daily Email Reports (daily at 8 AM)
    this.scheduleJob(
      'Daily Email Reports',
      '0 8 * * *', // Daily at 8:00 AM
      async () => {
        await runDailyEmailReportsJob();
      }
    );

    this.isRunning = true;
    console.log('✅ Job scheduler started successfully');
    this.printSchedule();
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Job scheduler is not running');
      return;
    }

    console.log('\n🛑 Stopping Job Scheduler...');
    
    this.jobs.forEach((job) => {
      job.task.stop();
      console.log(`   ⏹️  Stopped: ${job.name}`);
    });

    this.isRunning = false;
    console.log('✅ Job scheduler stopped');
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(name: string, schedule: string, handler: () => Promise<void>): void {
    try {
      const task = cron.schedule(
        schedule,
        async () => {
          try {
            await handler();
          } catch (error) {
            console.error(`❌ Job '${name}' failed:`, error);
          }
        },
        {
          timezone: 'UTC' // Use UTC for consistency
        }
      );

      this.jobs.set(name, {
        name,
        schedule,
        task,
        enabled: true
      });

      console.log(`   ✅ Scheduled: ${name} (${schedule})`);
    } catch (error) {
      console.error(`❌ Failed to schedule job '${name}':`, error);
    }
  }

  /**
   * Manually trigger a job (for testing)
   */
  async triggerJob(jobName: string): Promise<void> {
    console.log(`\n🔧 Manually triggering job: ${jobName}`);
    
    switch (jobName) {
      case 'Auto Lead Distribution':
        await autoLeadDistributionJob.execute();
        break;
      case 'No Activity Lead Rotation':
        await noActivityLeadRotationJob.execute();
        break;
      case 'Fresh Lead Assignment':
        await runFreshLeadAssignmentJob();
        break;
      case 'No Answer Status Rotation':
        await runNoAnswerStatusRotationJob();
        break;
      case 'Not Interested Status Rotation':
        await runNotInterestedStatusRotationJob();
        break;
      case 'Call Reminder':
        await runCallReminderJob();
        break;
      case 'Meeting Reminder':
        await runMeetingReminderJob();
        break;
      case 'Lead DND Check':
        await runLeadDNDCheckJob();
        break;
      case 'Daily Email Reports':
        await runDailyEmailReportsJob();
        break;
      default:
        console.log(`❌ Unknown job: ${jobName}`);
    }
  }

  /**
   * Enable a specific job
   */
  enableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      console.log(`❌ Job not found: ${jobName}`);
      return;
    }

    job.task.start();
    job.enabled = true;
    console.log(`✅ Enabled job: ${jobName}`);
  }

  /**
   * Disable a specific job
   */
  disableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      console.log(`❌ Job not found: ${jobName}`);
      return;
    }

    job.task.stop();
    job.enabled = false;
    console.log(`⏹️  Disabled job: ${jobName}`);
  }

  /**
   * Get health status of all jobs
   */
  getHealth(): {
    isRunning: boolean;
    jobs: Array<{
      name: string;
      schedule: string;
      enabled: boolean;
      nextExecution: string;
    }>;
  } {
    const jobsStatus = Array.from(this.jobs.values()).map((job) => ({
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
      nextExecution: this.getNextExecutionTime(job.schedule)
    }));

    return {
      isRunning: this.isRunning,
      jobs: jobsStatus
    };
  }

  /**
   * Print current schedule
   */
  private printSchedule(): void {
    console.log('\n📅 Current Schedule:');
    this.jobs.forEach((job) => {
      const status = job.enabled ? '✅' : '⏹️';
      const next = this.getNextExecutionTime(job.schedule);
      console.log(`   ${status} ${job.name}`);
      console.log(`      Schedule: ${job.schedule}`);
      console.log(`      Next run: ${next}`);
    });
    console.log('');
  }

  /**
   * Calculate next execution time (simplified)
   */
  private getNextExecutionTime(schedule: string): string {
    // Parse schedule to estimate next run
    if (schedule.includes('*/5')) return 'Every 5 minutes';
    if (schedule.includes('*/15')) return 'Every 15 minutes';
    if (schedule.includes('*/30')) return 'Every 30 minutes';
    if (schedule.includes('*/4')) return 'Every 4 hours';
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '0 0 * * *') return 'Daily at midnight';
    if (schedule === '0 3 * * *') return 'Daily at 3:00 AM';
    if (schedule === '0 4 * * *') return 'Daily at 4:00 AM';
    if (schedule === '0 8 * * *') return 'Daily at 8:00 AM';
    return 'See schedule: ' + schedule;
  }

  /**
   * List all registered jobs
   */
  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * Check if scheduler is running
   */
  getStatus(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export default new JobScheduler();
