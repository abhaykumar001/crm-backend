import { PrismaClient } from '@prisma/client';
import settingsService from '../services/settings.service';
import activityLogService from '../services/activityLog.service';
import leadAssignmentService from '../services/leadAssignment.service';

const prisma = new PrismaClient();

/**
 * No Activity Lead Rotation Job
 * 
 * Runs every 30 minutes to reassign leads when agents haven't acted within configured time.
 * 
 * Algorithm:
 * 1. Check if noActivityOnLeadRotation setting is enabled
 * 2. Verify office hours
 * 3. Get noActivityTimeDuration setting (default 30 minutes)
 * 4. Find leads with lastActivityTime older than threshold
 * 5. Check activityCheck flag to prevent infinite loops
 * 6. Reassign lead to new agent
 * 7. Set activityCheck flag after reassignment
 * 8. Log rotation to activity_logs
 * 
 * Prevents infinite reassignment loops by setting activityCheck flag.
 */
class NoActivityLeadRotationJob {
  async execute(): Promise<void> {
    const jobName = 'No Activity Lead Rotation';
    
    try {
      console.log(`\n[${new Date().toISOString()}] ⏰ ${jobName} - Started`);
      
      // Log cron execution started
      await activityLogService.logCronExecution(jobName, 'started', {
        timestamp: new Date().toISOString()
      });

      // 1. Check if no activity rotation is enabled
      const rotationEnabled = await settingsService.get('noActivityOnLeadRotation');
      if (!rotationEnabled) {
        console.log('❌ No activity rotation is disabled in settings');
        await activityLogService.logCronExecution(jobName, 'completed', {
          reason: 'Setting disabled',
          totalRotated: 0
        });
        return;
      }

      // 2. Check office hours
      const isOfficeHours = await settingsService.isOfficeHours();
      if (!isOfficeHours) {
        console.log('⏰ Outside office hours - skipping rotation');
        await activityLogService.logCronExecution(jobName, 'completed', {
          reason: 'Outside office hours',
          totalRotated: 0
        });
        return;
      }

      // 3. Get timeout duration (minutes)
      const timeoutMinutes = await settingsService.get('noActivityTimeDuration') || 30;
      console.log(`⏱️  Using timeout: ${timeoutMinutes} minutes`);

      // Calculate threshold timestamp
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - Number(timeoutMinutes));

      // 4. Find leads needing rotation
      // Criteria:
      // - Lead is active (not closed)
      // - Has assigned agent
      // - lastActivityTime is older than threshold OR null
      // - activityCheck flag is false (prevents infinite loops)
      const leadsNeedingRotation = await prisma.leadAgent.findMany({
        where: {
          OR: [
            { lastActivityTime: { lt: thresholdTime } },
            { lastActivityTime: null }
          ],
          activityCheck: false, // Prevent infinite rotation
          deletedAt: null, // Only active assignments
          lead: {
            statusId: {
              not: 1 // Not closed (status 1 = closed)
            }
          }
        },
        include: {
          lead: {
            include: {
              source: true
            }
          },
          user: true
        },
        orderBy: {
          assignTime: 'asc' // Oldest assignments first (FIFO)
        },
        take: 50 // Process max 50 per run to prevent overload
      });

      console.log(`📊 Found ${leadsNeedingRotation.length} leads needing rotation`);

      let totalRotated = 0;
      let totalFailed = 0;

      // 5. Process each lead
      for (const leadAgent of leadsNeedingRotation) {
        try {
          const lead = leadAgent.lead;
          const fromAgent = leadAgent.user;
          const inactiveMinutes = leadAgent.lastActivityTime 
            ? Math.floor((Date.now() - new Date(leadAgent.lastActivityTime).getTime()) / 60000)
            : null;

          console.log(`\n🔄 Processing Lead #${lead.id}:`);
          console.log(`   From: ${fromAgent.name} (ID: ${fromAgent.id})`);
          console.log(`   Inactive: ${inactiveMinutes || 'Never active'} minutes`);

          // Skip if no source
          if (!lead.source) {
            console.log(`⚠️  Lead #${lead.id} - No source found`);
            totalFailed++;
            continue;
          }

          // 6. Reassign lead using round-robin algorithm
          // We use assignLeadRoundRobin which will auto-select the next agent
          const assignResult = await leadAssignmentService.assignLeadRoundRobin(
            lead.id,
            lead.source.id,
            fromAgent.id // Current agent is the one reassigning
          );

          if (assignResult.success && assignResult.agentId) {
            // 7. Set activityCheck flag to prevent re-rotation
            await prisma.leadAgent.updateMany({
              where: {
                leadId: lead.id,
                userId: assignResult.agentId,
                deletedAt: null
              },
              data: {
                activityCheck: true
              }
            });

            // 8. Log rotation
            await activityLogService.logNoActivityRotation(
              lead.id,
              fromAgent.id,
              assignResult.agentId,
              inactiveMinutes || timeoutMinutes
            );

            console.log(`✅ Lead #${lead.id} rotated to agent #${assignResult.agentId}`);
            totalRotated++;
          } else {
            console.log(`⚠️  Lead #${lead.id} - No available agent for reassignment`);
            totalFailed++;
          }

        } catch (error) {
          console.error(`❌ Failed to rotate lead #${leadAgent.leadId}:`, error);
          totalFailed++;
          // Continue processing other leads
        }
      }

      // Log completion
      console.log(`\n✅ ${jobName} - Completed`);
      console.log(`   Total Rotated: ${totalRotated}`);
      console.log(`   Total Failed: ${totalFailed}`);
      console.log(`   Threshold: ${timeoutMinutes} minutes`);

      await activityLogService.logCronExecution(jobName, 'completed', {
        totalRotated,
        totalFailed,
        timeoutMinutes,
        leadsProcessed: leadsNeedingRotation.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ ${jobName} - Failed:`, error);
      await activityLogService.logCronExecution(jobName, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new NoActivityLeadRotationJob();
