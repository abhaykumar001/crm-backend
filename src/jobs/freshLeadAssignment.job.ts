/**
 * Fresh Lead Assignment Job
 * 
 * Purpose: Marks leads as non-fresh after 2 reassignments
 * Schedule: Daily at 4:00 AM
 * 
 * Business Logic:
 * - Fresh leads get priority in assignment
 * - After 2 assignment attempts, mark as non-fresh
 * - Prevents infinite cycling of poor quality leads
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';

const prisma = new PrismaClient();

export async function runFreshLeadAssignmentJob(): Promise<void> {
  console.log('🔄 Starting Fresh Lead Assignment Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Fresh Lead Assignment job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'freshLeadAssignment', startedAt: new Date().toISOString() }
    });

    // Find leads that are still fresh but have 2+ assignments
    const leadsToUpdate = await prisma.lead.findMany({
      where: {
        isFresh: true,
        assignLeadsCount: {
          gte: 2 // 2 or more assignments
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        assignLeadsCount: true,
        agentId: true
      }
    });

    console.log(`📊 Found ${leadsToUpdate.length} leads to mark as non-fresh`);

    let updatedCount = 0;

    // Update each lead
    for (const lead of leadsToUpdate) {
      try {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            isFresh: false,
            updatedAt: new Date()
          }
        });

        // Log activity
        await activityLogService.log({
          eventType: 'fresh_flag_updated',
          description: `Lead "${lead.name}" marked as non-fresh after ${lead.assignLeadsCount} assignments`,
          subjectType: 'Lead',
          subjectId: lead.id,
          causerId: lead.agentId || undefined,
          properties: {
            leadId: lead.id,
            leadName: lead.name,
            assignmentCount: lead.assignLeadsCount,
            previousValue: true,
            newValue: false
          }
        });

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating lead ${lead.id}:`, error);
        // Continue with other leads
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Fresh Lead Assignment Job completed in ${duration}ms`);
    console.log(`📈 Updated ${updatedCount} of ${leadsToUpdate.length} leads`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Fresh Lead Assignment job completed: ${updatedCount} leads marked as non-fresh`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'freshLeadAssignment',
        duration,
        leadsFound: leadsToUpdate.length,
        leadsUpdated: updatedCount,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Fresh Lead Assignment Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Fresh Lead Assignment job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'freshLeadAssignment',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runFreshLeadAssignmentJob;
