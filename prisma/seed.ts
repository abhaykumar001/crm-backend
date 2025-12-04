import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default roles
  console.log('📋 Creating default roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      guardName: 'web',
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { name: 'hr' },
    update: {},
    create: {
      name: 'hr',
      guardName: 'web',
    },
  });

  const teamLeaderRole = await prisma.role.upsert({
    where: { name: 'team_leader' },
    update: {},
    create: {
      name: 'team_leader',
      guardName: 'web',
    },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'agent' },
    update: {},
    create: {
      name: 'agent',
      guardName: 'web',
    },
  });

  // Create default permissions
  console.log('🔐 Creating default permissions...');
  const permissions = [
    // User management
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    
    // Lead management
    'leads.view',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.assign',
    'leads.export',
    
    // Deal management
    'deals.view',
    'deals.create',
    'deals.edit',
    'deals.delete',
    'deals.approve',
    
    // Project management
    'projects.view',
    'projects.create',
    'projects.edit',
    'projects.delete',
    
    // Reports
    'reports.view',
    'reports.export',
    
    // System settings
    'settings.view',
    'settings.edit',
    
    // Communication
    'communication.whatsapp',
    'communication.sms',
    'communication.email',
  ];

  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        guardName: 'web',
      },
    });
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...');
  
  // Admin gets all permissions
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.roleHasPermission.upsert({
      where: {
        permissionId_roleId: {
          permissionId: permission.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        permissionId: permission.id,
        roleId: adminRole.id,
      },
    });
  }

  // Create default lead sources
  console.log('📊 Creating default lead sources...');
  const websiteSource = await prisma.source.upsert({
    where: { name: 'Website' },
    update: {},
    create: { name: 'Website' },
  });

  const socialMediaSource = await prisma.source.upsert({
    where: { name: 'Social Media' },
    update: {},
    create: { name: 'Social Media' },
  });

  const googleAdsSource = await prisma.source.upsert({
    where: { name: 'Google Ads' },
    update: {},
    create: { name: 'Google Ads' },
  });

  const facebookAdsSource = await prisma.source.upsert({
    where: { name: 'Facebook Ads' },
    update: {},
    create: { name: 'Facebook Ads' },
  });

  const referralSource = await prisma.source.upsert({
    where: { name: 'Referral' },
    update: {},
    create: { name: 'Referral' },
  });

  const coldCallSource = await prisma.source.upsert({
    where: { name: 'Cold Call' },
    update: {},
    create: { name: 'Cold Call' },
  });

  // Create sub-sources
  console.log('📋 Creating sub-sources...');
  await prisma.subSource.createMany({
    data: [
      { sourceId: websiteSource.id, name: 'Contact Form' },
      { sourceId: websiteSource.id, name: 'Live Chat' },
      { sourceId: websiteSource.id, name: 'Landing Page' },
      
      { sourceId: socialMediaSource.id, name: 'Facebook' },
      { sourceId: socialMediaSource.id, name: 'Instagram' },
      { sourceId: socialMediaSource.id, name: 'LinkedIn' },
      { sourceId: socialMediaSource.id, name: 'Twitter' },
      
      { sourceId: referralSource.id, name: 'Customer Referral' },
      { sourceId: referralSource.id, name: 'Employee Referral' },
      { sourceId: referralSource.id, name: 'Partner Referral' },
    ],
    skipDuplicates: true,
  });

  // Create default lead statuses
  console.log('🎯 Creating default lead statuses...');
  const newStatus = await prisma.status.upsert({
    where: { name: 'New' },
    update: {},
    create: { name: 'New', color: '#3B82F6', sortOrder: 1 },
  });

  const contactedStatus = await prisma.status.upsert({
    where: { name: 'Contacted' },
    update: {},
    create: { name: 'Contacted', color: '#F59E0B', sortOrder: 2 },
  });

  const qualifiedStatus = await prisma.status.upsert({
    where: { name: 'Qualified' },
    update: {},
    create: { name: 'Qualified', color: '#10B981', sortOrder: 3 },
  });

  const proposalStatus = await prisma.status.upsert({
    where: { name: 'Proposal' },
    update: {},
    create: { name: 'Proposal', color: '#8B5CF6', sortOrder: 4 },
  });

  const negotiationStatus = await prisma.status.upsert({
    where: { name: 'Negotiation' },
    update: {},
    create: { name: 'Negotiation', color: '#F97316', sortOrder: 5 },
  });

  const closedWonStatus = await prisma.status.upsert({
    where: { name: 'Closed Won' },
    update: {},
    create: { name: 'Closed Won', color: '#059669', sortOrder: 6 },
  });

  const closedLostStatus = await prisma.status.upsert({
    where: { name: 'Closed Lost' },
    update: {},
    create: { name: 'Closed Lost', color: '#DC2626', sortOrder: 7 },
  });

  const notInterestedStatus = await prisma.status.upsert({
    where: { name: 'Not Interested' },
    update: {},
    create: { name: 'Not Interested', color: '#6B7280', sortOrder: 8 },
  });

  // Create sub-statuses
  console.log('📝 Creating sub-statuses...');
  await prisma.subStatus.createMany({
    data: [
      { statusId: contactedStatus.id, name: 'Call Made', color: '#F59E0B' },
      { statusId: contactedStatus.id, name: 'Email Sent', color: '#F59E0B' },
      { statusId: contactedStatus.id, name: 'WhatsApp Sent', color: '#F59E0B' },
      
      { statusId: qualifiedStatus.id, name: 'Budget Confirmed', color: '#10B981' },
      { statusId: qualifiedStatus.id, name: 'Timeline Confirmed', color: '#10B981' },
      { statusId: qualifiedStatus.id, name: 'Decision Maker Identified', color: '#10B981' },
      
      { statusId: notInterestedStatus.id, name: 'Budget Issues', color: '#6B7280' },
      { statusId: notInterestedStatus.id, name: 'Wrong Timing', color: '#6B7280' },
      { statusId: notInterestedStatus.id, name: 'No Response', color: '#6B7280' },
    ],
    skipDuplicates: true,
  });

  // Create default reasons for status changes
  console.log('📄 Creating default reasons...');
  await prisma.reason.createMany({
    data: [
      { name: 'Budget constraints' },
      { name: 'Wrong timing' },
      { name: 'Not the right fit' },
      { name: 'Competitor chosen' },
      { name: 'Project on hold' },
      { name: 'No response' },
      { name: 'Price too high' },
      { name: 'Better offer elsewhere' },
    ],
    skipDuplicates: true,
  });

  // Create default amenities
  console.log('🏢 Creating default amenities...');
  await prisma.amenity.createMany({
    data: [
      { name: 'Swimming Pool', icon: '🏊' },
      { name: 'Gymnasium', icon: '🏋️' },
      { name: 'Parking', icon: '🚗' },
      { name: 'Security', icon: '🛡️' },
      { name: 'Garden', icon: '🌳' },
      { name: 'Playground', icon: '🎪' },
      { name: 'Club House', icon: '🏛️' },
      { name: 'Lift', icon: '🛗' },
      { name: 'Power Backup', icon: '🔌' },
      { name: 'Water Supply', icon: '💧' },
      { name: 'Internet/WiFi', icon: '📶' },
      { name: 'Intercom', icon: '📞' },
      { name: 'CCTV', icon: '📹' },
      { name: 'Fire Safety', icon: '🔥' },
      { name: 'Waste Management', icon: '♻️' },
    ],
    skipDuplicates: true,
  });

  // Create default leave types
  console.log('🏖️ Creating default leave types...');
  await prisma.leaveType.createMany({
    data: [
      { name: 'Annual Leave', description: 'Yearly vacation leave', maxDaysPerYear: 21 },
      { name: 'Sick Leave', description: 'Medical leave', maxDaysPerYear: 12 },
      { name: 'Casual Leave', description: 'Short-term personal leave', maxDaysPerYear: 12 },
      { name: 'Maternity Leave', description: 'Maternity leave for mothers', maxDaysPerYear: 180 },
      { name: 'Paternity Leave', description: 'Paternity leave for fathers', maxDaysPerYear: 15 },
      { name: 'Emergency Leave', description: 'Emergency situations', maxDaysPerYear: 5 },
    ],
    skipDuplicates: true,
  });

  // Create default languages
  console.log('🌐 Creating default languages...');
  await prisma.language.createMany({
    data: [
      { name: 'English', code: 'en' },
      { name: 'Hindi', code: 'hi' },
      { name: 'Gujarati', code: 'gu' },
      { name: 'Marathi', code: 'mr' },
      { name: 'Bengali', code: 'bn' },
      { name: 'Tamil', code: 'ta' },
      { name: 'Telugu', code: 'te' },
      { name: 'Kannada', code: 'kn' },
      { name: 'Malayalam', code: 'ml' },
      { name: 'Punjabi', code: 'pa' },
    ],
    skipDuplicates: true,
  });

  // Create default admin user
  console.log('👤 Creating default admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@moderncrmapp.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@moderncrmapp.com',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
      mobileNumber: '+1234567890',
      designation: 'System Administrator',
      joiningDate: new Date(),
      isActive: true,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create sample developer
  console.log('🏗️ Creating sample developer...');
  const existingDeveloper = await prisma.developer.findFirst({
    where: { name: 'Sample Developers Pvt Ltd' }
  });
  
  const sampleDeveloper = existingDeveloper || await prisma.developer.create({
    data: {
      name: 'Sample Developers Pvt Ltd',
      description: 'Leading real estate developer in the region',
      contactInfo: 'Contact: +91-9876543210\nEmail: info@sampledevelopers.com',
      website: 'https://sampledevelopers.com',
    },
  });

  // Create sample project
  console.log('🏢 Creating sample project...');
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Green Valley Residency' }
  });
  
  const sampleProject = existingProject || await prisma.project.create({
    data: {
      name: 'Green Valley Residency',
      description: 'Luxury residential project with modern amenities and green spaces',
      developerId: sampleDeveloper.id,
      location: 'Sector 21, New Town',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      projectType: 'Residential',
      status: 'active',
      launchDate: new Date('2024-01-01'),
      completionDate: new Date('2026-12-31'),
      minPrice: 5000000,
      maxPrice: 15000000,
    },
  });

  // Assign some amenities to the sample project
  const amenities = await prisma.amenity.findMany({ take: 5 });
  for (const amenity of amenities) {
    await prisma.projectAmenity.upsert({
      where: {
        projectId_amenityId: {
          projectId: sampleProject.id,
          amenityId: amenity.id,
        },
      },
      update: {},
      create: {
        projectId: sampleProject.id,
        amenityId: amenity.id,
      },
    });
  }

  // Create some default settings
  console.log('⚙️ Creating default settings...');
  await prisma.setting.createMany({
    data: [
      {
        key: 'app_name',
        value: 'Modern CRM',
        type: 'string',
        category: 'general',
        description: 'Application name',
      },
      {
        key: 'app_version',
        value: '1.0.0',
        type: 'string',
        category: 'general',
        description: 'Application version',
      },
      {
        key: 'lead_auto_assignment',
        value: 'true',
        type: 'boolean',
        category: 'leads',
        description: 'Enable automatic lead assignment',
      },
      {
        key: 'lead_assignment_strategy',
        value: 'round_robin',
        type: 'string',
        category: 'leads',
        description: 'Lead assignment strategy (round_robin, territory_based, manual)',
      },
      {
        key: 'max_leads_per_agent',
        value: '50',
        type: 'number',
        category: 'leads',
        description: 'Maximum leads per agent',
      },
      {
        key: 'follow_up_reminder_hours',
        value: '24',
        type: 'number',
        category: 'communication',
        description: 'Hours before follow-up reminder',
      },
      {
        key: 'whatsapp_integration_enabled',
        value: 'true',
        type: 'boolean',
        category: 'communication',
        description: 'Enable WhatsApp integration',
      },
      {
        key: 'sms_integration_enabled',
        value: 'true',
        type: 'boolean',
        category: 'communication',
        description: 'Enable SMS integration',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('🔑 Default Admin Credentials:');
  console.log('Email: admin@moderncrmapp.com');
  console.log('Password: admin123');
  console.log('');
  console.log('📊 Created:');
  console.log('- 4 User Roles (Admin, HR, Team Leader, Agent)');
  console.log('- 20+ Permissions');
  console.log('- 6 Lead Sources with Sub-sources');
  console.log('- 8 Lead Statuses with Sub-statuses');
  console.log('- 8 Status Change Reasons');
  console.log('- 15 Property Amenities');
  console.log('- 6 Leave Types');
  console.log('- 10 Languages');
  console.log('- 1 Sample Developer & Project');
  console.log('- 8 System Settings');
  console.log('- 1 Admin User');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
