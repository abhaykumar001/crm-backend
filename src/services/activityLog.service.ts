// backend/src/services/activityLog.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LogOptions {
  description: string;
  subjectType?: string;
  subjectId?: number;
  causerType?: string;
  causerId?: number;
  properties?: any;
  eventType?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogService {
  /**
   * Create activity log entry
   */
  async log(options: LogOptions) {
    return await prisma.activityLog.create({
      data: {
        description: options.description,
        subjectType: options.subjectType,
        subjectId: options.subjectId,
        causerType: options.causerType || 'System',
        causerId: options.causerId,
        properties: options.properties,
        eventType: options.eventType,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      }
    });
  }

  /**
   * Log lead assignment
   */
  async logLeadAssignment(leadId: number, agentId: number, method: string, properties?: any) {
    return await this.log({
      description: `Lead ${leadId} assigned to agent ${agentId} via ${method}`,
      subjectType: 'Lead',
      subjectId: leadId,
      causerType: 'System',
      eventType: 'lead_assigned',
      properties: {
        agentId,
        method,
        ...properties
      }
    });
  }

  /**
   * Log lead distribution (auto)
   */
  async logAutoDistribution(leadId: number, sourceId: number, agentId: number, rotationIndex: number) {
    return await this.log({
      description: `Auto-distributed lead ${leadId} from source ${sourceId} to agent ${agentId}`,
      subjectType: 'Lead',
      subjectId: leadId,
      causerType: 'Cron',
      eventType: 'auto_distribution',
      properties: {
        sourceId,
        agentId,
        rotationIndex,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log lead rotation due to no activity
   */
  async logNoActivityRotation(leadId: number, fromAgentId: number, toAgentId: number, inactiveMinutes: number) {
    return await this.log({
      description: `Lead ${leadId} rotated from agent ${fromAgentId} to ${toAgentId} due to ${inactiveMinutes} minutes of inactivity`,
      subjectType: 'Lead',
      subjectId: leadId,
      causerType: 'Cron',
      eventType: 'no_activity_rotation',
      properties: {
        fromAgentId,
        toAgentId,
        inactiveMinutes,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log cron job execution
   */
  async logCronExecution(jobName: string, status: 'started' | 'completed' | 'failed', details?: any) {
    return await this.log({
      description: `Cron job ${jobName} ${status}`,
      subjectType: 'CronJob',
      causerType: 'System',
      eventType: `cron_${status}`,
      properties: {
        jobName,
        status,
        ...details
      }
    });
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 50, filters?: {
    subjectType?: string;
    subjectId?: number;
    eventType?: string;
    causerType?: string;
  }) {
    return await prisma.activityLog.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get logs for a subject (e.g., all logs for a lead)
   */
  async getLogsForSubject(subjectType: string, subjectId: number) {
    return await prisma.activityLog.findMany({
      where: {
        subjectType,
        subjectId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(startDate?: Date, endDate?: Date) {
    const where: any = {
      causerType: 'Cron'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      select: {
        eventType: true,
        createdAt: true
      }
    });

    // Group by event type
    const stats: Record<string, number> = {};
    logs.forEach(log => {
      stats[log.eventType || 'unknown'] = (stats[log.eventType || 'unknown'] || 0) + 1;
    });

    return {
      totalEvents: logs.length,
      byType: stats,
      startDate,
      endDate
    };
  }
}

export const activityLogService = new ActivityLogService();
export default activityLogService;
