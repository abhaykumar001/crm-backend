import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLeadAssignments() {
  console.log('🌱 Migrating existing lead assignments to LeadAgent pivot table...');

  try {
    // Get all leads that have an agentId assigned
    const leadsWithAgent = await prisma.lead.findMany({
      where: {
        agentId: { not: null },
      },
      select: {
        id: true,
        agentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`📊 Found ${leadsWithAgent.length} leads with assigned agents`);

    if (leadsWithAgent.length === 0) {
      console.log('✅ No leads to migrate');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const lead of leadsWithAgent) {
      try {
        // Check if this assignment already exists in LeadAgent
        const existingAssignment = await prisma.leadAgent.findFirst({
          where: {
            leadId: lead.id,
            userId: lead.agentId!,
          },
        });

        if (existingAssignment) {
          skippedCount++;
          continue;
        }

        // Create LeadAgent entry
        await prisma.leadAgent.create({
          data: {
            leadId: lead.id,
            userId: lead.agentId!,
            isAccepted: 1, // Existing assignments are considered accepted
            assignTime: lead.createdAt || new Date(),
            lastActivityTime: lead.updatedAt || new Date(),
            activityCheck: false,
          },
        });

        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`   Migrated ${migratedCount} assignments...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Error migrating lead ${lead.id}:`, error);
      }
    }

    console.log(`✅ Migrated ${migratedCount} lead assignments`);
    console.log(`⏭️  Skipped ${skippedCount} existing assignments`);

    // Update lead statistics
    const totalLeadAgents = await prisma.leadAgent.count();
    const uniqueLeads = await prisma.leadAgent.groupBy({
      by: ['leadId'],
      _count: true,
    });

    console.log(`\n📊 Lead Assignment Statistics:`);
    console.log(`   Total assignments: ${totalLeadAgents}`);
    console.log(`   Unique leads with agents: ${uniqueLeads.length}`);
    console.log(`   Average assignments per lead: ${(totalLeadAgents / uniqueLeads.length).toFixed(2)}`);

    console.log('\n✅ Lead assignment migration complete!');
  } catch (error) {
    console.error('❌ Error migrating lead assignments:', error);
    throw error;
  }
}

export default migrateLeadAssignments;

// Run if called directly
if (require.main === module) {
  migrateLeadAssignments()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
