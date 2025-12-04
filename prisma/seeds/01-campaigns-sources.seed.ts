import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCampaignsAndSources() {
  console.log('🌱 Seeding campaigns and sources...');

  try {
    // Create Campaigns
    const campaigns = await Promise.all([
      prisma.campaign.create({
        data: {
          name: 'Dubai Marina Launch',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          budget: 500000,
          status: 1,
          isInternational: false,
        },
      }),
      prisma.campaign.create({
        data: {
          name: 'International Property Expo 2025',
          startDate: new Date('2025-02-15'),
          endDate: new Date('2025-12-31'),
          budget: 1000000,
          status: 1,
          isInternational: true, // 24/7 operations
        },
      }),
      prisma.campaign.create({
        data: {
          name: 'Downtown Dubai Premium',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-06-30'),
          budget: 750000,
          status: 1,
          isInternational: false,
        },
      }),
      prisma.campaign.create({
        data: {
          name: 'Spring Sale 2025',
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-05-31'),
          budget: 300000,
          status: 1,
          isInternational: false,
        },
      }),
    ]);

    console.log(`✅ Created ${campaigns.length} campaigns`);

    // Get all users for agent pool assignment
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: { in: ['agent', 'team_leader'] },
            },
          },
        },
      },
      select: { id: true },
    });

    if (users.length === 0) {
      console.log('⚠️  No agents found. Please create users first.');
      return;
    }

    // Update existing sources to link to campaigns
    const existingSources = await prisma.source.findMany({
      take: 10,
    });

    if (existingSources.length > 0) {
      // Link some sources to campaigns
      await prisma.source.update({
        where: { id: existingSources[0].id },
        data: {
          campaignId: campaigns[0].id,
          type: 'Campaign',
          runAllTime: false,
          isCroned: true,
          priority: 1,
        },
      });

      if (existingSources.length > 1) {
        await prisma.source.update({
          where: { id: existingSources[1].id },
          data: {
            campaignId: campaigns[1].id,
            type: 'Campaign',
            runAllTime: true, // International - 24/7
            isCroned: true,
            priority: 2,
          },
        });
      }

      if (existingSources.length > 2) {
        await prisma.source.update({
          where: { id: existingSources[2].id },
          data: {
            type: 'Normal',
            runAllTime: false,
            isCroned: true,
            priority: 3,
          },
        });
      }

      console.log(`✅ Updated ${Math.min(3, existingSources.length)} existing sources`);
    }

    // Create additional campaign-specific sources (check if they exist first)
    const sourceNames = [
      'Facebook Ads - Marina Campaign',
      'Google Ads - International Expo',
      'Property Portal - Bayut',
      'Walk-in Clients',
    ];

    const existingNewSources = await prisma.source.findMany({
      where: {
        name: { in: sourceNames },
      },
    });

    const existingNames = existingNewSources.map((s) => s.name);
    const newSources: any[] = [];

    // Only create sources that don't exist
    if (!existingNames.includes('Facebook Ads - Marina Campaign')) {
      const source = await prisma.source.create({
        data: {
          name: 'Facebook Ads - Marina Campaign',
          campaignId: campaigns[0].id,
          type: 'Campaign',
          runAllTime: false,
          isCroned: true,
          priority: 1,
          isActive: true,
        },
      });
      newSources.push(source);
    }

    if (!existingNames.includes('Google Ads - International Expo')) {
      const source = await prisma.source.create({
        data: {
          name: 'Google Ads - International Expo',
          campaignId: campaigns[1].id,
          type: 'Campaign',
          runAllTime: true,
          isCroned: true,
          priority: 2,
          isActive: true,
        },
      });
      newSources.push(source);
    }

    if (!existingNames.includes('Property Portal - Bayut')) {
      const source = await prisma.source.create({
        data: {
          name: 'Property Portal - Bayut',
          type: 'Normal',
          runAllTime: false,
          isCroned: true,
          priority: 3,
          isActive: true,
        },
      });
      newSources.push(source);
    }

    if (!existingNames.includes('Walk-in Clients')) {
      const source = await prisma.source.create({
        data: {
          name: 'Walk-in Clients',
          type: 'Normal',
          runAllTime: false,
          isCroned: false, // Manual assignment
          priority: 10,
          isActive: true,
        },
      });
      newSources.push(source);
    }

    console.log(`✅ Created ${newSources.length} new sources`);

    // Create SourceUser pivot entries with round-robin rotation
    // For each source, assign available agents and set nextLeadAssign flag for first agent
    const allSources = [...existingSources.slice(0, 3), ...newSources];
    let sourceUserCount = 0;

    for (const source of allSources) {
      if (source.type === 'Normal' || !source.type) {
        // Assign 3-5 agents per normal source
        const agentCount = Math.min(users.length, 3 + Math.floor(Math.random() * 3));
        const sourceAgents = users.slice(0, agentCount);

        for (let i = 0; i < sourceAgents.length; i++) {
          await prisma.sourceUser.create({
            data: {
              sourceId: source.id,
              userId: sourceAgents[i].id,
              nextLeadAssign: i === 0, // First agent gets the flag
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          sourceUserCount++;
        }
      } else if (source.type === 'Campaign') {
        // Campaign sources get more agents (5-8)
        const agentCount = Math.min(users.length, 5 + Math.floor(Math.random() * 4));
        const sourceAgents = users.slice(0, agentCount);

        for (let i = 0; i < sourceAgents.length; i++) {
          await prisma.sourceUser.create({
            data: {
              sourceId: source.id,
              userId: sourceAgents[i].id,
              nextLeadAssign: i === 0, // First agent gets the flag
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          sourceUserCount++;
        }
      }
    }

    console.log(`✅ Created ${sourceUserCount} source-user assignments with round-robin flags`);

    // Create Campaign Managers
    const teamLeaders = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'team_leader',
            },
          },
        },
      },
      take: 3,
    });

    if (teamLeaders.length > 0) {
      for (let i = 0; i < Math.min(campaigns.length, teamLeaders.length); i++) {
        await prisma.campaignManager.create({
          data: {
            campaignId: campaigns[i].id,
            userId: teamLeaders[i].id,
          },
        });
      }
      console.log(`✅ Assigned ${Math.min(campaigns.length, teamLeaders.length)} campaign managers`);
    }

    console.log('✅ Campaigns and sources seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding campaigns and sources:', error);
    throw error;
  }
}

export default seedCampaignsAndSources;

// Run if called directly
if (require.main === module) {
  seedCampaignsAndSources()
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
