import { PrismaClient } from '@prisma/client';
import seedCampaignsAndSources from './01-campaigns-sources.seed';
import seedCommissionSlabs from './02-commission-slabs.seed';
import seedSystemSettings from './03-system-settings.seed';
import migrateLeadAssignments from './04-migrate-lead-assignments.seed';
import seedEventsAndDND from './05-events-dnd.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Step 1: Seed Campaigns and Sources with round-robin setup
    console.log('📦 Step 1/5: Campaigns & Sources');
    console.log('═══════════════════════════════════════════════════════════');
    await seedCampaignsAndSources();
    console.log('\n');

    // Step 2: Seed Commission Slabs
    console.log('📦 Step 2/5: Commission Slabs');
    console.log('═══════════════════════════════════════════════════════════');
    await seedCommissionSlabs();
    console.log('\n');

    // Step 3: Seed System Settings
    console.log('📦 Step 3/5: System Settings');
    console.log('═══════════════════════════════════════════════════════════');
    await seedSystemSettings();
    console.log('\n');

    // Step 4: Migrate existing lead assignments
    console.log('📦 Step 4/5: Migrate Lead Assignments');
    console.log('═══════════════════════════════════════════════════════════');
    await migrateLeadAssignments();
    console.log('\n');

    // Step 5: Seed Events and DND Lists
    console.log('📦 Step 5/5: Events & DND Lists');
    console.log('═══════════════════════════════════════════════════════════');
    await seedEventsAndDND();
    console.log('\n');

    // Final Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Display final statistics
    const stats = {
      campaigns: await prisma.campaign.count(),
      campaignManagers: await prisma.campaignManager.count(),
      sources: await prisma.source.count(),
      sourceUsers: await prisma.sourceUser.count(),
      commissionSlabs: await prisma.commissionSlab.count(),
      settings: await prisma.setting.count(),
      leadAgents: await prisma.leadAgent.count(),
      events: await prisma.event.count(),
      dndList: await prisma.dndList.count(),
      coldCalls: await prisma.coldCall.count(),
      dumpCalls: await prisma.dumpCall.count(),
      penalties: await prisma.penaltyLog.count(),
    };

    console.log('📊 FINAL DATABASE STATISTICS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Campaign Management:');
    console.log(`   Campaigns: ${stats.campaigns}`);
    console.log(`   Campaign Managers: ${stats.campaignManagers}`);
    console.log(`   Sources: ${stats.sources}`);
    console.log(`   Source-User Assignments: ${stats.sourceUsers}`);
    console.log('');
    console.log('Commission System:');
    console.log(`   Commission Slabs: ${stats.commissionSlabs}`);
    console.log('');
    console.log('System Configuration:');
    console.log(`   Settings: ${stats.settings}`);
    console.log('');
    console.log('Lead Management:');
    console.log(`   Lead-Agent Assignments: ${stats.leadAgents}`);
    console.log(`   Cold Calls: ${stats.coldCalls}`);
    console.log(`   Dump Calls: ${stats.dumpCalls}`);
    console.log('');
    console.log('Events & Compliance:');
    console.log(`   Property Events: ${stats.events}`);
    console.log(`   DND Registry: ${stats.dndList}`);
    console.log('');
    console.log('Agent Management:');
    console.log(`   Penalty Logs: ${stats.penalties}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🎉 Your CRM is now ready with:');
    console.log('   ✅ Campaign attribution system');
    console.log('   ✅ Round-robin lead distribution setup');
    console.log('   ✅ Tiered commission structure');
    console.log('   ✅ Automation configuration (43 settings)');
    console.log('   ✅ Lead lifecycle management');
    console.log('   ✅ Compliance & events infrastructure\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Review created data in database');
    console.log('   2. Implement LeadAssignmentService');
    console.log('   3. Set up automation jobs (Bull/BullMQ)');
    console.log('   4. Build communication sending logic\n');
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
