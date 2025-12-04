import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemSettings() {
  console.log('🌱 Seeding system settings...');

  try {
    const settings = [
      // Lead Distribution Settings
      {
        key: 'autoLeaddistribution',
        value: 'true',
        description: 'Enable automatic lead distribution to agents',
      },
      {
        key: 'autoLeadDistributionInterval',
        value: '15',
        description: 'Auto lead distribution interval in minutes',
      },
      {
        key: 'leadQueueUserId',
        value: '821',
        description: 'User ID that holds leads in queue before distribution',
      },

      // Lead Rotation Settings
      {
        key: 'noActivityOnLeadRotation',
        value: 'true',
        description: 'Enable rotation when agent shows no activity',
      },
      {
        key: 'noActivityTimeDuration',
        value: '30',
        description: 'Time in minutes before considering lead inactive',
      },
      {
        key: 'noActivityRotationInterval',
        value: '30',
        description: 'Check for inactive leads every N minutes',
      },

      // Fresh Lead Settings
      {
        key: 'freshLeadAssignmentLimit',
        value: '2',
        description: 'Number of assignments before lead is no longer fresh',
      },
      {
        key: 'freshLeadCheckInterval',
        value: '1440',
        description: 'Check fresh leads daily (1440 minutes = 24 hours)',
      },

      // Status-Based Rotation
      {
        key: 'noAnswerRotationEnabled',
        value: 'true',
        description: 'Enable rotation for No Answer status leads',
      },
      {
        key: 'noAnswerRotationInterval',
        value: '240',
        description: 'Rotate No Answer leads every 4 hours (240 minutes)',
      },
      {
        key: 'noAnswerStatusId',
        value: '8',
        description: 'Status ID for No Answer leads',
      },
      {
        key: 'noAnswerMaxAge',
        value: '2',
        description: 'Max age in days for No Answer leads to be rotated',
      },

      {
        key: 'notInterestedRotationEnabled',
        value: 'true',
        description: 'Enable rotation for Not Interested status leads',
      },
      {
        key: 'notInterestedRotationInterval',
        value: '240',
        description: 'Rotate Not Interested leads every 4 hours (240 minutes)',
      },
      {
        key: 'notInterestedStatusId',
        value: '16',
        description: 'Status ID for Not Interested leads',
      },
      {
        key: 'notInterestedMaxAssignments',
        value: '3',
        description: 'Max assignment attempts for Not Interested leads',
      },

      // Reminder Settings
      {
        key: 'callReminderEnabled',
        value: 'true',
        description: 'Enable call reminders',
      },
      {
        key: 'callReminderInterval',
        value: '5',
        description: 'Check for upcoming calls every 5 minutes',
      },
      {
        key: 'callReminderMinutes',
        value: '5',
        description: 'Send reminder N minutes before scheduled call',
      },

      {
        key: 'meetingReminderEnabled',
        value: 'true',
        description: 'Enable meeting reminders',
      },
      {
        key: 'meetingReminderInterval',
        value: '5',
        description: 'Check for upcoming meetings every 5 minutes',
      },
      {
        key: 'meetingReminderMinutes',
        value: '30',
        description: 'Send reminder N minutes before scheduled meeting',
      },

      // Data Hygiene Settings
      {
        key: 'dumpToColdCallEnabled',
        value: 'true',
        description: 'Enable conversion of dump calls back to cold calls',
      },
      {
        key: 'dumpToColdCallInterval',
        value: '1440',
        description: 'Run dump to cold call conversion daily (1440 min)',
      },
      {
        key: 'dumpToColdCallDays',
        value: '30',
        description: 'Days after which dump calls convert to cold calls',
      },

      {
        key: 'dndCheckEnabled',
        value: 'true',
        description: 'Enable DND (Do Not Disturb) checking',
      },
      {
        key: 'dndCheckInterval',
        value: '1440',
        description: 'Check DND list daily (1440 minutes)',
      },

      // Working Hours
      {
        key: 'standardWorkingFromTime',
        value: '09:00',
        description: 'Office start time (24-hour format)',
      },
      {
        key: 'standardWorkingToTime',
        value: '18:00',
        description: 'Office end time (24-hour format)',
      },
      {
        key: 'workingDays',
        value: '1,2,3,4,5',
        description: 'Working days (1=Monday, 7=Sunday)',
      },

      // Reporting Settings
      {
        key: 'dailyReportEnabled',
        value: 'true',
        description: 'Enable daily email reports',
      },
      {
        key: 'dailyReportTime',
        value: '08:00',
        description: 'Time to send daily reports',
      },
      {
        key: 'dailyReportRecipients',
        value: '',
        description: 'Comma-separated email addresses for daily reports',
      },

      // Commission Settings
      {
        key: 'commissionApprovalRequired',
        value: 'true',
        description: 'Require approval before paying commissions',
      },
      {
        key: 'companyCommissionPercentage',
        value: '20',
        description: 'Company commission percentage on deals',
      },

      // Notification Settings
      {
        key: 'emailNotificationsEnabled',
        value: 'true',
        description: 'Enable email notifications',
      },
      {
        key: 'smsNotificationsEnabled',
        value: 'true',
        description: 'Enable SMS notifications',
      },
      {
        key: 'pushNotificationsEnabled',
        value: 'true',
        description: 'Enable push notifications',
      },
      {
        key: 'whatsappNotificationsEnabled',
        value: 'false',
        description: 'Enable WhatsApp notifications',
      },

      // System Configuration
      {
        key: 'systemTimezone',
        value: 'Asia/Dubai',
        description: 'System timezone',
      },
      {
        key: 'systemCurrency',
        value: 'AED',
        description: 'System currency code',
      },
      {
        key: 'leadExpiryDays',
        value: '90',
        description: 'Days after which leads expire',
      },
      {
        key: 'maxLeadsPerAgent',
        value: '50',
        description: 'Maximum active leads per agent',
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const setting of settings) {
      const existing = await prisma.setting.findUnique({
        where: { key: setting.key },
      });

      if (existing) {
        await prisma.setting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            description: setting.description,
          },
        });
        updatedCount++;
      } else {
        await prisma.setting.create({
          data: setting,
        });
        createdCount++;
      }
    }

    console.log(`✅ Created ${createdCount} new settings`);
    console.log(`✅ Updated ${updatedCount} existing settings`);
    console.log(`📊 Total settings: ${settings.length}`);

    // Display settings by category
    console.log('\n📋 Settings Summary:');
    console.log('   Lead Distribution: 3 settings');
    console.log('   Lead Rotation: 3 settings');
    console.log('   Fresh Lead: 2 settings');
    console.log('   Status-Based Rotation: 8 settings');
    console.log('   Reminders: 6 settings');
    console.log('   Data Hygiene: 4 settings');
    console.log('   Working Hours: 3 settings');
    console.log('   Reporting: 3 settings');
    console.log('   Commission: 2 settings');
    console.log('   Notifications: 4 settings');
    console.log('   System Config: 5 settings');

    console.log('\n✅ System settings seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding system settings:', error);
    throw error;
  }
}

export default seedSystemSettings;

// Run if called directly
if (require.main === module) {
  seedSystemSettings()
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
