// backend/src/jobs/autoLeadDistribution.job.ts
import { PrismaClient } from '@prisma/client';
import settingsService from '../services/settings.service';
import activityLogService from '../services/activityLog.service';
import sourceService from '../services/source.service';
import leadAssignmentService from '../services/leadAssignment.service';

const prisma = new PrismaClient();

export class AutoLeadDistributionJob {
  /**
   * Main execution method
   */
  async execute() {
    try {
      await activityLogService.logCronExecution('autoLeadDistribution', 'started');

      // Check if job is enabled
      const enabled = await settingsService.get('autoLeaddistribution');
      if (!enabled) {
        console.log('⏸️  Auto lead distribution is disabled');
        return;
      }

      // Check office hours
      const isOfficeHours = await settingsService.isOfficeHours();
      if (!isOfficeHours) {
        console.log('⏰ Outside office hours, skipping distribution');
        return;
      }

      // Get queue user ID and sources with cron enabled
      const queueUserId = await settingsService.get('queue_user_id');
      const sources = await sourceService.getSourcesForAutoDistribution();

      console.log(`📊 Found ${sources.length} sources configured for auto-distribution`);

      let totalDistributed = 0;

      for (const source of sources) {
        // Get leads in queue for this source
        const leads = await prisma.lead.findMany({
          where: {
            sourceId: source.id,
            agentId: queueUserId,
            statusId: {
              not: 1 // Not closed (status 1 = closed)
            },
            deletedAt: null
          },
          take: 50, // Process 50 leads per source per run
          orderBy: {
            createdAt: 'asc' // FIFO
          }
        });

        console.log(`📝 Source ${source.id} (${source.name}): ${leads.length} leads in queue`);

        // Distribute each lead
        for (const lead of leads) {
          try {
            const result = await leadAssignmentService.assignLeadRoundRobin(
              lead.id,
              source.id,
              queueUserId // System/queue user is assigning
            );

            if (result.success) {
              totalDistributed++;
              console.log(`✅ Lead ${lead.id} assigned to agent ${result.agentId}`);

              // Log the distribution
              await activityLogService.logAutoDistribution(
                lead.id,
                source.id,
                result.agentId!,
                0 // rotationIndex
              );
            } else {
              console.error(`❌ Failed to assign lead ${lead.id}:`, result.message);
            }
          } catch (error: any) {
            console.error(`❌ Error assigning lead ${lead.id}:`, error.message);
          }
        }
      }

      await activityLogService.logCronExecution('autoLeadDistribution', 'completed', {
        totalDistributed,
        sourcesProcessed: sources.length
      });

      console.log(`🎉 Auto distribution completed: ${totalDistributed} leads distributed`);
    } catch (error: any) {
      console.error('❌ Auto lead distribution job failed:', error);
      await activityLogService.logCronExecution('autoLeadDistribution', 'failed', {
        error: error.message
      });
      throw error;
    }
  }
}

export default new AutoLeadDistributionJob();
