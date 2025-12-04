/**
 * No Answer Status Rotation Job
 * 
 * Purpose: Recycles leads stuck in "No Answer" status
 * Schedule: Every 4 hours
 * 
 * Business Logic:
 * - Finds leads in "No Answer" status (status 8)
 * - Leads must be ≤ 2 days old
 * - Reassigns to random available agent
 * - Prevents leads from going stale
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';
import settingsService from '../services/settings.service';

const prisma = new PrismaClient();

export async function runNoAnswerStatusRotationJob(): Promise<void> {
  console.log('🔄 Starting No Answer Status Rotation Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'No Answer Status Rotation job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'noAnswerStatusRotation', startedAt: new Date().toISOString() }
    });

    // Get the "No Answer" status ID (assuming status 8)
    const noAnswerStatusId = 8;

    // Calculate 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find leads in No Answer status from last 2 days
    const leadsToRotate = await prisma.lead.findMany({
      where: {
        statusId: noAnswerStatusId,
        createdAt: {
          gte: twoDaysAgo
        },
        deletedAt: null
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${leadsToRotate.length} leads in No Answer status`);

    // Get available agents (Active, Available, not excluded)
    const availableAgents = await prisma.user.findMany({
      where: {
        status: 'Active',
        availability: 'Available',
        isExcluded: false,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (availableAgents.length === 0) {
      console.log('⚠️  No available agents found for rotation');
      
      await activityLogService.log({
        eventType: 'cron_completed',
        description: 'No Answer Status Rotation job completed: No available agents',
        subjectType: 'Job',
        subjectId: 0,
        properties: {
          jobName: 'noAnswerStatusRotation',
          duration: Date.now() - startTime,
          leadsFound: leadsToRotate.length,
          leadsRotated: 0,
          reason: 'No available agents'
        }
      });
      
      return;
    }

    console.log(`👥 Found ${availableAgents.length} available agents`);

    let rotatedCount = 0;

    // Rotate each lead to a random agent
    for (const lead of leadsToRotate) {
      try {
        // Pick a random agent
        const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];

        // Skip if already assigned to this agent
        if (lead.agentId === randomAgent.id) {
          continue;
        }

        const previousAgentId = lead.agentId;

        // Update lead assignment
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            agentId: randomAgent.id,
            assignLeadsCount: lead.assignLeadsCount + 1,
            noAnswerStatusCount: lead.noAnswerStatusCount + 1,
            updatedAt: new Date()
          }
        });

        // Update LeadAgent pivot
        await prisma.leadAgent.create({
          data: {
            leadId: lead.id,
            userId: randomAgent.id,
            assignTime: new Date(),
            isAccepted: 0, // Pending
            activityCheck: false
          }
        });

        // Log activity
        await activityLogService.log({
          eventType: 'no_answer_rotation',
          description: `Lead "${lead.name}" reassigned from ${lead.agent?.name || 'Unassigned'} to ${randomAgent.name} (No Answer rotation)`,
          subjectType: 'Lead',
          subjectId: lead.id,
          causerId: randomAgent.id || undefined,
          properties: {
            leadId: lead.id,
            leadName: lead.name,
            previousAgentId,
            previousAgentName: lead.agent?.name,
            newAgentId: randomAgent.id,
            newAgentName: randomAgent.name,
            reason: 'No Answer status rotation',
            assignmentAttempt: lead.assignLeadsCount + 1,
            noAnswerCount: lead.noAnswerStatusCount + 1
          }
        });

        rotatedCount++;
      } catch (error) {
        console.error(`❌ Error rotating lead ${lead.id}:`, error);
        // Continue with other leads
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ No Answer Status Rotation Job completed in ${duration}ms`);
    console.log(`📈 Rotated ${rotatedCount} of ${leadsToRotate.length} leads`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `No Answer Status Rotation job completed: ${rotatedCount} leads reassigned`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'noAnswerStatusRotation',
        duration,
        leadsFound: leadsToRotate.length,
        leadsRotated: rotatedCount,
        availableAgents: availableAgents.length,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ No Answer Status Rotation Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `No Answer Status Rotation job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'noAnswerStatusRotation',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runNoAnswerStatusRotationJob;
