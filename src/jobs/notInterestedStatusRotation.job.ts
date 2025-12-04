/**
 * Not Interested Status Rotation Job
 * 
 * Purpose: Recycles leads marked as "Not Interested"
 * Schedule: Every 4 hours
 * 
 * Business Logic:
 * - Finds leads in "Not Interested" status (status 16)
 * - Max 3 assignment attempts
 * - After 3 attempts, sends to fallback admin
 * - Gives leads a second chance with different agents
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';
import settingsService from '../services/settings.service';

const prisma = new PrismaClient();

export async function runNotInterestedStatusRotationJob(): Promise<void> {
  console.log('🔄 Starting Not Interested Status Rotation Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Not Interested Status Rotation job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'notInterestedStatusRotation', startedAt: new Date().toISOString() }
    });

    // Get the "Not Interested" status ID (assuming status 16)
    const notInterestedStatusId = 16;

    // Get fallback admin user ID from settings
    const fallbackAdminId = await settingsService.get('fallback_admin_id') || 1;

    // Find leads in Not Interested status with less than 3 assignments
    const leadsToRotate = await prisma.lead.findMany({
      where: {
        statusId: notInterestedStatusId,
        assignLeadsCount: {
          lt: 3 // Less than 3 attempts
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

    console.log(`📊 Found ${leadsToRotate.length} leads in Not Interested status (< 3 attempts)`);

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
        description: 'Not Interested Status Rotation job completed: No available agents',
        subjectType: 'Job',
        subjectId: 0,
        properties: {
          jobName: 'notInterestedStatusRotation',
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
    let sentToAdminCount = 0;

    // Rotate each lead
    for (const lead of leadsToRotate) {
      try {
        const previousAgentId = lead.agentId;
        let newAgentId: number;
        let newAgentName: string;

        // Check if this will be the 3rd attempt
        if (lead.assignLeadsCount === 2) {
          // Send to fallback admin after 3rd attempt
          newAgentId = Number(fallbackAdminId);
          const fallbackAdmin = await prisma.user.findUnique({
            where: { id: newAgentId },
            select: { name: true }
          });
          newAgentName = fallbackAdmin?.name || 'Admin';

          console.log(`⚠️  Lead ${lead.id} reached max attempts, sending to admin`);
          sentToAdminCount++;
        } else {
          // Pick a random agent (different from current)
          const filteredAgents = availableAgents.filter(a => a.id !== lead.agentId);
          if (filteredAgents.length === 0) {
            console.log(`⚠️  No alternative agents for lead ${lead.id}, skipping`);
            continue;
          }

          const randomAgent = filteredAgents[Math.floor(Math.random() * filteredAgents.length)];
          newAgentId = randomAgent.id;
          newAgentName = randomAgent.name;
        }

        // Update lead assignment
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            agentId: newAgentId,
            assignLeadsCount: lead.assignLeadsCount + 1,
            updatedAt: new Date()
          }
        });

        // Update LeadAgent pivot
        await prisma.leadAgent.create({
          data: {
            leadId: lead.id,
            userId: newAgentId,
            assignTime: new Date(),
            isAccepted: 0, // Pending
            activityCheck: false
          }
        });

        // Log activity
        await activityLogService.log({
          eventType: 'not_interested_rotation',
          description: `Lead "${lead.name}" reassigned from ${lead.agent?.name || 'Unassigned'} to ${newAgentName} (Not Interested rotation, attempt ${lead.assignLeadsCount + 1})`,
          subjectType: 'Lead',
          subjectId: lead.id,
          causerId: newAgentId || undefined,
          properties: {
            leadId: lead.id,
            leadName: lead.name,
            previousAgentId,
            previousAgentName: lead.agent?.name,
            newAgentId,
            newAgentName,
            reason: 'Not Interested status rotation',
            assignmentAttempt: lead.assignLeadsCount + 1,
            maxAttempts: 3,
            sentToAdmin: lead.assignLeadsCount === 2
          }
        });

        rotatedCount++;
      } catch (error) {
        console.error(`❌ Error rotating lead ${lead.id}:`, error);
        // Continue with other leads
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Not Interested Status Rotation Job completed in ${duration}ms`);
    console.log(`📈 Rotated ${rotatedCount} of ${leadsToRotate.length} leads`);
    console.log(`👔 Sent ${sentToAdminCount} leads to admin (max attempts reached)`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Not Interested Status Rotation job completed: ${rotatedCount} leads reassigned (${sentToAdminCount} to admin)`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'notInterestedStatusRotation',
        duration,
        leadsFound: leadsToRotate.length,
        leadsRotated: rotatedCount,
        sentToAdmin: sentToAdminCount,
        availableAgents: availableAgents.length,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Not Interested Status Rotation Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Not Interested Status Rotation job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'notInterestedStatusRotation',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runNotInterestedStatusRotationJob;
