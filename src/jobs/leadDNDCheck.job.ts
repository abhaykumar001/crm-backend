/**
 * Lead DND Check Job
 * 
 * Purpose: Marks leads as "Do not call" if phone in DND registry
 * Schedule: Daily at 3:00 AM
 * 
 * Business Logic:
 * - Checks lead phone numbers against DND registry
 * - Marks matching leads with type "Do not call"
 * - Prevents legal issues and spam complaints
 */

import { PrismaClient } from '@prisma/client';
import activityLogService from '../services/activityLog.service';

const prisma = new PrismaClient();

export async function runLeadDNDCheckJob(): Promise<void> {
  console.log('🔄 Starting Lead DND Check Job...');
  const startTime = Date.now();

  try {
    // Log job start
    await activityLogService.log({
      eventType: 'cron_started',
      description: 'Lead DND Check job started',
      subjectType: 'Job',
      subjectId: 0,
      properties: { jobName: 'leadDNDCheck', startedAt: new Date().toISOString() }
    });

    // Get all DND numbers from registry
    // TODO: Create dnd_pull_lists table first
    // For now, use an empty set
    const dndPhoneSet = new Set<string>();
    
    // const dndNumbers = await prisma.dndPullList.findMany({
    //   where: {
    //     status: 'Active'
    //   },
    //   select: {
    //     phoneNumber: true
    //   }
    // });
    // const dndPhoneSet = new Set(dndNumbers.map((d: { phoneNumber: string }) => d.phoneNumber.replace(/\D/g, '')));
    
    console.log(`📋 DND Registry contains ${dndPhoneSet.size} phone numbers`);

    // Get all active leads with phone numbers
    const activeLeads = await prisma.lead.findMany({
      where: {
        type: {
          not: 'Do not call'
        },
        mobileNumber: {
          not: null
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        alternateNumber: true,
        whatsappNumber: true,
        agentId: true
      }
    });

    console.log(`📊 Checking ${activeLeads.length} active leads against DND registry`);

    let markedAsDNCCount = 0;

    for (const lead of activeLeads) {
      try {
        // Check if any of the lead's phone numbers are in DND registry
        const phones = [
          lead.mobileNumber,
          lead.alternateNumber,
          lead.whatsappNumber
        ].filter(Boolean).map(p => p?.replace(/\D/g, '')); // Remove non-digits

        const isDND = phones.some(phone => dndPhoneSet.has(phone!));

        if (isDND) {
          // Mark lead as "Do not call"
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              type: 'Do not call',
              updatedAt: new Date()
            }
          });

          // Log activity
          await activityLogService.log({
            eventType: 'dnd_marked',
            description: `Lead "${lead.name}" marked as "Do not call" (phone in DND registry)`,
            subjectType: 'Lead',
            subjectId: lead.id,
            causerId: lead.agentId || undefined,
            properties: {
              leadId: lead.id,
              leadName: lead.name,
              mobileNumber: lead.mobileNumber,
              reason: 'Phone number in DND registry'
            }
          });

          markedAsDNCCount++;
          console.log(`⚠️  Lead ${lead.id} (${lead.name}) marked as DNC`);
        }
      } catch (error) {
        console.error(`❌ Error checking lead ${lead.id}:`, error);
        // Continue with other leads
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Lead DND Check Job completed in ${duration}ms`);
    console.log(`🚫 Marked ${markedAsDNCCount} of ${activeLeads.length} leads as Do Not Call`);

    // Log job completion
    await activityLogService.log({
      eventType: 'cron_completed',
      description: `Lead DND Check job completed: ${markedAsDNCCount} leads marked as Do Not Call`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'leadDNDCheck',
        duration,
        leadsChecked: activeLeads.length,
        markedAsDNC: markedAsDNCCount,
        dndRegistrySize: dndPhoneSet.size,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Lead DND Check Job failed:', error);

    // Log job failure
    await activityLogService.log({
      eventType: 'cron_failed',
      description: `Lead DND Check job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      subjectType: 'Job',
      subjectId: 0,
      properties: {
        jobName: 'leadDNDCheck',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export default runLeadDNDCheckJob;
