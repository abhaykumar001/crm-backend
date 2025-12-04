import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommissionSlabs() {
  console.log('🌱 Seeding commission slabs...');

  try {
    // Get all unique designations from users
    const users = await prisma.user.findMany({
      where: {
        designationId: { not: null },
      },
      select: { designationId: true },
      distinct: ['designationId'],
    });

    const designationIds = users.map((u) => u.designationId).filter(Boolean) as number[];

    // If no designations exist, create default ones
    if (designationIds.length === 0) {
      console.log('⚠️  No designations found. Creating default commission slabs...');
      
      // Default slabs without designation (applies to all)
      const defaultSlabs = [
        { slabFrom: 0, slabTo: 1000000, commission: 1.0, designationId: null },
        { slabFrom: 1000000, slabTo: 5000000, commission: 1.5, designationId: null },
        { slabFrom: 5000000, slabTo: 10000000, commission: 2.0, designationId: null },
        { slabFrom: 10000000, slabTo: 999999999, commission: 2.5, designationId: null },
      ];

      for (const slab of defaultSlabs) {
        await prisma.commissionSlab.create({
          data: slab,
        });
      }

      console.log(`✅ Created ${defaultSlabs.length} default commission slabs`);
      return;
    }

    // Create tiered commission slabs for each designation
    // Assuming designation hierarchy: 1=Agent, 2=Senior Agent, 3=Team Leader, 4=Manager
    
    const commissionStructures = [
      {
        // Agent (designation 1) - Lower commission
        designationId: 1,
        slabs: [
          { slabFrom: 0, slabTo: 1000000, commission: 0.8 },
          { slabFrom: 1000000, slabTo: 5000000, commission: 1.2 },
          { slabFrom: 5000000, slabTo: 10000000, commission: 1.5 },
          { slabFrom: 10000000, slabTo: 999999999, commission: 2.0 },
        ],
      },
      {
        // Senior Agent (designation 2) - Medium commission
        designationId: 2,
        slabs: [
          { slabFrom: 0, slabTo: 1000000, commission: 1.0 },
          { slabFrom: 1000000, slabTo: 5000000, commission: 1.5 },
          { slabFrom: 5000000, slabTo: 10000000, commission: 2.0 },
          { slabFrom: 10000000, slabTo: 999999999, commission: 2.5 },
        ],
      },
      {
        // Team Leader (designation 3) - Higher commission
        designationId: 3,
        slabs: [
          { slabFrom: 0, slabTo: 1000000, commission: 1.5 },
          { slabFrom: 1000000, slabTo: 5000000, commission: 2.0 },
          { slabFrom: 5000000, slabTo: 10000000, commission: 2.5 },
          { slabFrom: 10000000, slabTo: 999999999, commission: 3.0 },
        ],
      },
      {
        // Manager (designation 4) - Highest commission
        designationId: 4,
        slabs: [
          { slabFrom: 0, slabTo: 1000000, commission: 2.0 },
          { slabFrom: 1000000, slabTo: 5000000, commission: 2.5 },
          { slabFrom: 5000000, slabTo: 10000000, commission: 3.0 },
          { slabFrom: 10000000, slabTo: 999999999, commission: 3.5 },
        ],
      },
    ];

    let totalSlabs = 0;

    for (const structure of commissionStructures) {
      // Only create slabs for designations that exist
      if (designationIds.includes(structure.designationId)) {
        for (const slab of structure.slabs) {
          await prisma.commissionSlab.create({
            data: {
              designationId: structure.designationId,
              slabFrom: slab.slabFrom,
              slabTo: slab.slabTo,
              commission: slab.commission,
            },
          });
          totalSlabs++;
        }
      }
    }

    console.log(`✅ Created ${totalSlabs} commission slabs for ${designationIds.length} designations`);

    // Display created slabs summary
    const slabsSummary = await prisma.commissionSlab.groupBy({
      by: ['designationId'],
      _count: true,
    });

    console.log('📊 Commission Slabs Summary:');
    for (const summary of slabsSummary) {
      const designation = summary.designationId || 'Default';
      console.log(`   Designation ${designation}: ${summary._count} slabs`);
    }

    console.log('✅ Commission slabs seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding commission slabs:', error);
    throw error;
  }
}

export default seedCommissionSlabs;

// Run if called directly
if (require.main === module) {
  seedCommissionSlabs()
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
