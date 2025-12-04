import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEventsAndDND() {
  console.log('🌱 Seeding events and DND lists...');

  try {
    // Create Property Events
    const developers = await prisma.developer.findMany({
      take: 3,
    });

    const campaigns = await prisma.campaign.findMany({
      take: 3,
    });

    if (developers.length === 0) {
      console.log('⚠️  No developers found. Skipping event creation.');
    } else {
      const events = [];

      // Create sample events
      const eventData = [
        {
          name: 'Dubai Marina Property Showcase',
          description: 'Exclusive showcase of premium marina properties',
          startDate: new Date('2025-12-15'),
          location: 'Dubai Marina Mall',
          campaignId: campaigns[0]?.id,
          status: 1,
        },
        {
          name: 'Downtown Dubai Investment Summit',
          description: 'Investment opportunities in downtown properties',
          startDate: new Date('2025-12-20'),
          location: 'Downtown Dubai Convention Center',
          campaignId: campaigns[1]?.id || campaigns[0]?.id,
          status: 1,
        },
        {
          name: 'Arabian Ranches Open House',
          description: 'Open house event for villa communities',
          startDate: new Date('2025-12-28'),
          location: 'Arabian Ranches',
          campaignId: campaigns[2]?.id || campaigns[0]?.id,
          status: 1,
        },
        {
          name: 'New Year Property Expo 2026',
          description: 'Grand property expo with special new year offers',
          startDate: new Date('2026-01-05'),
          location: 'Dubai World Trade Centre',
          campaignId: campaigns[0]?.id,
          status: 1,
        },
      ];

      for (const event of eventData) {
        const created = await prisma.event.create({
          data: event,
        });
        events.push(created);
      }

      console.log(`✅ Created ${events.length} property events`);
    }

    // Create DND (Do Not Disturb) registry entries
    const dndEntries = [
      {
        phoneNumber: '+971501234567',
        reason: 'Customer request',
        addedBy: 1, // System admin
      },
      {
        phoneNumber: '+971502345678',
        reason: 'Complaint received',
        addedBy: 1,
      },
      {
        phoneNumber: '+971503456789',
        reason: 'Regulatory compliance',
        addedBy: 1,
      },
      {
        phoneNumber: '+971504567890',
        reason: 'Multiple complaints',
        addedBy: 1,
      },
      {
        phoneNumber: '+971505678901',
        reason: 'Customer request',
        addedBy: 1,
      },
    ];

    let dndCount = 0;
    for (const entry of dndEntries) {
      const existing = await prisma.dndList.findUnique({
        where: { phoneNumber: entry.phoneNumber },
      });

      if (!existing) {
        await prisma.dndList.create({
          data: entry,
        });
        dndCount++;
      }
    }

    console.log(`✅ Created ${dndCount} DND registry entries`);

    // Create sample Cold Calls pool
    const agents = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'agent',
            },
          },
        },
      },
      take: 5,
    });

    if (agents.length > 0) {
      const coldCallData = [
        {
          name: 'Ahmed Hassan',
          phoneNumber: '+971506789012',
          email: 'ahmed.hassan@example.com',
          comments: 'Interested in studio apartments',
          priority: 'High',
          status: 'pending',
        },
        {
          name: 'Fatima Al Mansoori',
          phoneNumber: '+971507890123',
          email: 'fatima.almansoori@example.com',
          comments: 'Looking for family villa',
          priority: 'Normal',
          status: 'pending',
        },
        {
          name: 'Mohammed Khalid',
          phoneNumber: '+971508901234',
          email: null,
          comments: 'Investment buyer - high budget',
          priority: 'High',
          status: 'pending',
        },
      ];

      let coldCallCount = 0;
      for (const coldCall of coldCallData) {
        await prisma.coldCall.create({
          data: coldCall,
        });
        coldCallCount++;
      }

      console.log(`✅ Created ${coldCallCount} cold call entries`);
    }

    // Create sample Dump Calls
    const dumpCallData = [
      {
        name: 'Sarah Johnson',
        phoneNumber: '+971509012345',
        reason: 'Not interested in current offerings',
        comments: 'Follow up after 60 days',
      },
      {
        name: 'David Chen',
        phoneNumber: '+971500123456',
        reason: 'Budget constraints',
        comments: 'Follow up after 60 days',
      },
    ];

    let dumpCallCount = 0;
    for (const dumpCall of dumpCallData) {
      await prisma.dumpCall.create({
        data: dumpCall,
      });
      dumpCallCount++;
    }

    console.log(`✅ Created ${dumpCallCount} dump call entries`);

    // Create sample Penalty Logs
    if (agents.length > 0) {
      const penaltyData = [
        {
          userId: agents[0].id,
          reason: 'Missed follow-up deadline',
          penaltyAmount: 500,
          penaltyDate: new Date('2025-11-15'),
          status: 'paid',
          issuedBy: 1, // System admin
          paidAt: new Date('2025-11-20'),
        },
        {
          userId: agents[1]?.id || agents[0].id,
          reason: 'Unprofessional behavior complaint',
          penaltyAmount: 1000,
          penaltyDate: new Date('2025-11-18'),
          status: 'pending',
          issuedBy: 1,
          paidAt: null,
        },
        {
          userId: agents[2]?.id || agents[0].id,
          reason: 'Late submission of daily report',
          penaltyAmount: 200,
          penaltyDate: new Date('2025-11-22'),
          status: 'waived',
          issuedBy: 1,
          paidAt: null,
        },
      ];

      let penaltyCount = 0;
      for (const penalty of penaltyData) {
        await prisma.penaltyLog.create({
          data: penalty,
        });
        penaltyCount++;
      }

      console.log(`✅ Created ${penaltyCount} penalty log entries`);
    }

    // Summary statistics
    const stats = {
      events: await prisma.event.count(),
      dndList: await prisma.dndList.count(),
      coldCalls: await prisma.coldCall.count(),
      dumpCalls: await prisma.dumpCall.count(),
      penalties: await prisma.penaltyLog.count(),
    };

    console.log('\n📊 Database Summary:');
    console.log(`   Property Events: ${stats.events}`);
    console.log(`   DND Registry: ${stats.dndList}`);
    console.log(`   Cold Call Pool: ${stats.coldCalls}`);
    console.log(`   Dump Calls: ${stats.dumpCalls}`);
    console.log(`   Penalty Logs: ${stats.penalties}`);

    console.log('\n✅ Events and DND seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding events and DND:', error);
    throw error;
  }
}

export default seedEventsAndDND;

// Run if called directly
if (require.main === module) {
  seedEventsAndDND()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
