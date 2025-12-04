import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
  console.log('🌱 Seeding automation settings...');

  const settings = [
    // Automation Configuration
    {
      key: 'autoLeaddistribution',
      value: 'true',
      type: 'boolean',
      category: 'automation',
      description: 'Enable/disable auto lead distribution cron job'
    },
    {
      key: 'noActivityOnLeadRotation',
      value: 'true',
      type: 'boolean',
      category: 'automation',
      description: 'Enable/disable no activity lead rotation'
    },
    {
      key: 'noActivityTimeDuration',
      value: '30',
      type: 'integer',
      category: 'automation',
      description: 'Minutes before reassigning lead due to no activity'
    },
    {
      key: 'leadDistributionInterval',
      value: '15',
      type: 'integer',
      category: 'automation',
      description: 'Minutes between auto distribution runs'
    },
    {
      key: 'activityRotationInterval',
      value: '30',
      type: 'integer',
      category: 'automation',
      description: 'Minutes between no activity rotation checks'
    },
    
    // Office Hours Configuration
    {
      key: 'standard_working_from_time',
      value: '09:00',
      type: 'time',
      category: 'working_hours',
      description: 'Office start time (24-hour format)'
    },
    {
      key: 'standard_working_to_time',
      value: '18:00',
      type: 'time',
      category: 'working_hours',
      description: 'Office end time (24-hour format)'
    },
    {
      key: 'working_days',
      value: '1,2,3,4,5', // Monday to Friday
      type: 'string',
      category: 'working_hours',
      description: 'Working days (0=Sunday, 1=Monday, ..., 6=Saturday)'
    },
    
    // Lead Assignment Configuration
    {
      key: 'queue_user_id',
      value: '821',
      type: 'integer',
      category: 'lead_assignment',
      description: 'User ID that holds leads in queue for distribution'
    },
    {
      key: 'max_assignment_attempts',
      value: '3',
      type: 'integer',
      category: 'lead_assignment',
      description: 'Maximum times a lead can be reassigned'
    },
    {
      key: 'fallback_admin_id',
      value: '1',
      type: 'integer',
      category: 'lead_assignment',
      description: 'Admin user ID to assign leads after max attempts'
    },
    {
      key: 'fresh_lead_threshold',
      value: '2',
      type: 'integer',
      category: 'lead_assignment',
      description: 'Number of assignments before marking lead as not fresh'
    },
    
    // Status-Based Rotation
    {
      key: 'no_answer_rotation_enabled',
      value: 'true',
      type: 'boolean',
      category: 'status_rotation',
      description: 'Rotate leads stuck in No Answer status'
    },
    {
      key: 'no_answer_rotation_interval',
      value: '240', // 4 hours
      type: 'integer',
      category: 'status_rotation',
      description: 'Minutes before rotating No Answer leads'
    },
    {
      key: 'not_interested_rotation_enabled',
      value: 'true',
      type: 'boolean',
      category: 'status_rotation',
      description: 'Rotate leads marked as Not Interested'
    },
    {
      key: 'not_interested_rotation_interval',
      value: '240', // 4 hours
      type: 'integer',
      category: 'status_rotation',
      description: 'Minutes before rotating Not Interested leads'
    },
    
    // Data Hygiene
    {
      key: 'dump_to_cold_call_enabled',
      value: 'true',
      type: 'boolean',
      category: 'data_hygiene',
      description: 'Convert dump calls back to cold calls after N days'
    },
    {
      key: 'dump_data_to_cold_call_conversion_interval',
      value: '30',
      type: 'integer',
      category: 'data_hygiene',
      description: 'Days before converting dump to cold call'
    },
    {
      key: 'dnd_check_enabled',
      value: 'true',
      type: 'boolean',
      category: 'data_hygiene',
      description: 'Check leads against DND registry'
    },
    
    // Reminders
    {
      key: 'call_reminder_enabled',
      value: 'true',
      type: 'boolean',
      category: 'reminders',
      description: 'Send reminders before scheduled calls'
    },
    {
      key: 'call_reminder_minutes_before',
      value: '5',
      type: 'integer',
      category: 'reminders',
      description: 'Minutes before call to send reminder'
    },
    {
      key: 'meeting_reminder_enabled',
      value: 'true',
      type: 'boolean',
      category: 'reminders',
      description: 'Send reminders before scheduled meetings'
    },
    {
      key: 'meeting_reminder_minutes_before',
      value: '30',
      type: 'integer',
      category: 'reminders',
      description: 'Minutes before meeting to send reminder'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }

  console.log(`✅ Seeded ${settings.length} automation settings`);
}

seedSettings()
  .then(async () => {
    await prisma.$disconnect();
    console.log('🎉 Settings seed completed successfully');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Settings seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
