// backend/src/queues/config.ts
import Bull from 'bull';

// Redis configuration for Bull
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  // Retry strategy for connection failures
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create queue with error handling
export function createQueue(name: string) {
  try {
    const queue = new Bull(name, {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500 // Keep last 500 failed jobs for debugging
      }
    });

    // Error handling
    queue.on('error', (error) => {
      console.error(`Queue ${name} error:`, error.message);
    });

    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} in queue ${name} failed:`, error.message);
    });

    return queue;
  } catch (error) {
    console.warn(`⚠️  Failed to create Bull queue "${name}". Using fallback in-memory queue.`);
    console.warn('To use Bull queues, install and run Redis server.');
    return null;
  }
}

// Queue names
export const QueueNames = {
  LEAD_DISTRIBUTION: 'lead-distribution',
  LEAD_ROTATION: 'lead-rotation',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  SMS: 'sms'
};
