import { Router } from 'express';
import jobScheduler from '../jobs/scheduler';
import settingsService from '../services/settings.service';
import activityLogService from '../services/activityLog.service';
import { authenticate } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/v1/automation/health
 * Get job scheduler health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = jobScheduler.getHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/automation/jobs
 * List all registered jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const jobs = jobScheduler.listJobs();
    const health = jobScheduler.getHealth();
    
    res.json({
      success: true,
      data: {
        jobs: health.jobs,
        isRunning: health.isRunning
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/automation/jobs/:jobName/trigger
 * Manually trigger a specific job
 */
router.post('/jobs/:jobName/trigger', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    // Trigger the job
    await jobScheduler.triggerJob(jobName);
    
    res.json({
      success: true,
      message: `Job "${jobName}" triggered successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/automation/jobs/:jobName/enable
 * Enable a specific job
 */
router.post('/jobs/:jobName/enable', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    jobScheduler.enableJob(jobName);
    
    res.json({
      success: true,
      message: `Job "${jobName}" enabled successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/automation/jobs/:jobName/disable
 * Disable a specific job
 */
router.post('/jobs/:jobName/disable', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    jobScheduler.disableJob(jobName);
    
    res.json({
      success: true,
      message: `Job "${jobName}" disabled successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/automation/activity-logs
 * Get activity logs with filtering and pagination
 */
router.get('/activity-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const eventType = req.query.eventType as string;
    const subjectType = req.query.subjectType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const search = req.query.search as string;
    
    const filters: any = {};
    if (eventType) filters.eventType = eventType;
    if (subjectType) filters.subjectType = subjectType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (search) filters.search = search;
    
    // Get logs with filters
    const logs = await prisma.activityLog.findMany({
      where: {
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.subjectType && { subjectType: filters.subjectType }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
        ...(filters.search && {
          OR: [
            { description: { contains: filters.search, mode: 'insensitive' } },
            { subjectId: isNaN(parseInt(filters.search)) ? undefined : parseInt(filters.search) },
          ].filter(Boolean)
        }),
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    
    // Get total count for pagination
    const total = await prisma.activityLog.count({
      where: {
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.subjectType && { subjectType: filters.subjectType }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
        ...(filters.search && {
          OR: [
            { description: { contains: filters.search, mode: 'insensitive' } },
            { subjectId: isNaN(parseInt(filters.search)) ? undefined : parseInt(filters.search) },
          ].filter(Boolean)
        }),
      },
    });
    
    res.json({
      success: true,
      data: logs,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/automation/stats
 * Get automation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const stats = await activityLogService.getAutomationStats(
      startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );
    
    // Get additional metrics
    const queueUserId = await settingsService.get('queue_user_id');
    const leadsInQueue = await prisma.lead.count({
      where: {
        agentId: Number(queueUserId),
        statusId: { not: 1 },
        deletedAt: null
      }
    });
    
    const timeoutMinutes = await settingsService.get('noActivityTimeDuration') || 30;
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - Number(timeoutMinutes));
    
    const leadsNeedingRotation = await prisma.leadAgent.count({
      where: {
        OR: [
          { lastActivityTime: { lt: thresholdTime } },
          { lastActivityTime: null }
        ],
        activityCheck: false,
        deletedAt: null,
        lead: {
          statusId: { not: 1 }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        ...stats,
        leadsInQueue,
        leadsNeedingRotation,
        timeoutMinutes: Number(timeoutMinutes)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/automation/settings
 * Get all automation settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await settingsService.getAutomationSettings();
    const officeHoursSettings = await settingsService.getByCategory('working_hours');
    const leadAssignmentSettings = await settingsService.getByCategory('lead_assignment');
    
    res.json({
      success: true,
      data: {
        automation: settings,
        officeHours: officeHoursSettings,
        leadAssignment: leadAssignmentSettings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/automation/settings/:key
 * Update a specific setting
 */
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type } = req.body;
    
    if (!value || !type) {
      return res.status(400).json({
        success: false,
        message: 'Value and type are required'
      });
    }
    
    await settingsService.set(key, value, type);
    
    res.json({
      success: true,
      message: `Setting "${key}" updated successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
