import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    
    connection.on('error', (err) => {
      console.error('[JOB QUEUE] Redis connection error:', err.message);
    });
    
    connection.on('connect', () => {
      console.log('[JOB QUEUE] Connected to Redis');
    });
  }
  return connection;
}

// Job type definitions
export type JobType = 
  | 'resume.parse'
  | 'matching.batch'
  | 'email.send'
  | 'analytics.aggregate'
  | 'webhook.deliver'
  | 'notification.send'
  | 'report.generate';

// Job data interfaces
export interface ResumeParseJobData {
  userId: string;
  resumeUrl: string;
  fileName: string;
}

export interface BatchMatchingJobData {
  jobId?: string;
  candidateId?: string;
  tenantId: string;
  matchAll?: boolean;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsJobData {
  tenantId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: string[];
}

export interface WebhookJobData {
  url: string;
  payload: Record<string, unknown>;
  tenantId: string;
  eventType: string;
  signature?: string;
  subscriptionId?: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ReportJobData {
  tenantId: string;
  reportType: string;
  filters?: Record<string, unknown>;
  format: 'pdf' | 'csv' | 'xlsx';
}

export type JobData = 
  | ResumeParseJobData
  | BatchMatchingJobData
  | EmailJobData
  | AnalyticsJobData
  | WebhookJobData
  | NotificationJobData
  | ReportJobData;

// Default job options with exponential backoff
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // Start with 2 seconds
  },
  removeOnComplete: {
    count: 1000, // Keep last 1000 completed jobs
    age: 24 * 60 * 60, // Remove after 24 hours
  },
  removeOnFail: {
    count: 5000, // Keep more failed jobs for debugging
    age: 7 * 24 * 60 * 60, // Remove after 7 days
  },
};

// Queue configurations
const QUEUE_CONFIGS: Record<string, { concurrency: number; limiter?: { max: number; duration: number } }> = {
  'resume': { concurrency: 5 },
  'matching': { concurrency: 3 },
  'email': { concurrency: 10, limiter: { max: 100, duration: 60000 } }, // 100 emails per minute
  'analytics': { concurrency: 2 },
  'webhook': { concurrency: 20, limiter: { max: 1000, duration: 60000 } },
  'notification': { concurrency: 20 },
  'report': { concurrency: 2 },
};

// Queue instances
const queues: Map<string, Queue> = new Map();
const workers: Map<string, Worker> = new Map();
const queueEvents: Map<string, QueueEvents> = new Map();

// Check if Redis is available
let redisAvailable = false;

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const conn = getConnection();
    await conn.ping();
    redisAvailable = true;
    return true;
  } catch (error) {
    redisAvailable = false;
    console.warn('[JOB QUEUE] Redis not available, jobs will be processed synchronously');
    return false;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

// Get or create a queue
export function getQueue(name: string): Queue | null {
  if (!redisAvailable) return null;

  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: getConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

// Add a job to a queue
export async function addJob<T extends JobData>(
  queueName: string,
  jobName: string,
  data: T,
  options?: {
    priority?: number;
    delay?: number;
    jobId?: string;
    repeat?: { pattern: string } | { every: number };
  }
): Promise<Job<T> | null> {
  const queue = getQueue(queueName);

  if (!queue) {
    console.log(`[JOB QUEUE] Queue ${queueName} not available, skipping job ${jobName}`);
    return null;
  }

  const job = await queue.add(jobName, data, {
    priority: options?.priority,
    delay: options?.delay,
    jobId: options?.jobId,
    repeat: options?.repeat,
  });

  console.log(`[JOB QUEUE] Added job ${jobName} to queue ${queueName}:`, job.id);
  return job as Job<T>;
}

// Register a worker for a queue
export function registerWorker<T extends JobData>(
  queueName: string,
  processor: (job: Job<T>) => Promise<unknown>
): Worker | null {
  if (!redisAvailable) return null;

  const config = QUEUE_CONFIGS[queueName] || { concurrency: 5 };

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      console.log(`[JOB QUEUE] Processing job ${job.name} (${job.id}) from queue ${queueName}`);
      const startTime = Date.now();

      try {
        const result = await processor(job as Job<T>);
        const duration = Date.now() - startTime;
        console.log(`[JOB QUEUE] Job ${job.id} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[JOB QUEUE] Job ${job.id} failed after ${duration}ms:`, error);
        throw error;
      }
    },
    {
      connection: getConnection(),
      concurrency: config.concurrency,
      limiter: config.limiter,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[JOB QUEUE] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[JOB QUEUE] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[JOB QUEUE] Worker error in queue ${queueName}:`, err.message);
  });

  workers.set(queueName, worker);
  console.log(`[JOB QUEUE] Registered worker for queue: ${queueName}`);

  return worker;
}

// Get queue status for monitoring
export async function getQueueStatus(queueName: string): Promise<{
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
} | null> {
  const queue = getQueue(queueName);
  if (!queue) return null;

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.isPaused(),
  ]);

  return { name: queueName, waiting, active, completed, failed, delayed, paused };
}

// Get all queue statuses
export async function getAllQueueStatuses(): Promise<Array<{
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}>> {
  const statuses = [];
  for (const name of Object.keys(QUEUE_CONFIGS)) {
    const status = await getQueueStatus(name);
    if (status) statuses.push(status);
  }
  return statuses;
}

// Get recent jobs from a queue
export async function getRecentJobs(queueName: string, status: 'completed' | 'failed' | 'delayed' | 'active' | 'waiting', limit = 20): Promise<Array<{
  id: string;
  name: string;
  data: unknown;
  status: string;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  processedOn?: number;
  finishedOn?: number;
  timestamp: number;
}>> {
  const queue = getQueue(queueName);
  if (!queue) return [];

  let jobs: Job[] = [];
  switch (status) {
    case 'completed':
      jobs = await queue.getCompleted(0, limit);
      break;
    case 'failed':
      jobs = await queue.getFailed(0, limit);
      break;
    case 'delayed':
      jobs = await queue.getDelayed(0, limit);
      break;
    case 'active':
      jobs = await queue.getActive(0, limit);
      break;
    case 'waiting':
      jobs = await queue.getWaiting(0, limit);
      break;
  }

  return jobs.map(job => ({
    id: job.id || '',
    name: job.name,
    data: job.data,
    status,
    progress: job.progress as number || 0,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    timestamp: job.timestamp,
  }));
}

// Retry a failed job
export async function retryJob(queueName: string, jobId: string): Promise<boolean> {
  const queue = getQueue(queueName);
  if (!queue) return false;

  const job = await queue.getJob(jobId);
  if (!job) return false;

  await job.retry();
  return true;
}

// Remove a job
export async function removeJob(queueName: string, jobId: string): Promise<boolean> {
  const queue = getQueue(queueName);
  if (!queue) return false;

  const job = await queue.getJob(jobId);
  if (!job) return false;

  await job.remove();
  return true;
}

// Pause/Resume queue
export async function pauseQueue(queueName: string): Promise<boolean> {
  const queue = getQueue(queueName);
  if (!queue) return false;
  await queue.pause();
  return true;
}

export async function resumeQueue(queueName: string): Promise<boolean> {
  const queue = getQueue(queueName);
  if (!queue) return false;
  await queue.resume();
  return true;
}

// Clean up old jobs
export async function cleanQueue(queueName: string, gracePeriod = 24 * 60 * 60 * 1000): Promise<void> {
  const queue = getQueue(queueName);
  if (!queue) return;

  await queue.clean(gracePeriod, 1000, 'completed');
  await queue.clean(gracePeriod * 7, 1000, 'failed');
}

// Graceful shutdown
export async function shutdown(): Promise<void> {
  console.log('[JOB QUEUE] Shutting down...');

  // Close all workers
  for (const name of Array.from(workers.keys())) {
    const worker = workers.get(name);
    if (worker) {
      console.log(`[JOB QUEUE] Closing worker: ${name}`);
      await worker.close();
    }
  }

  // Close all queues
  for (const name of Array.from(queues.keys())) {
    const queue = queues.get(name);
    if (queue) {
      console.log(`[JOB QUEUE] Closing queue: ${name}`);
      await queue.close();
    }
  }

  // Close all queue events
  for (const name of Array.from(queueEvents.keys())) {
    const events = queueEvents.get(name);
    if (events) {
      console.log(`[JOB QUEUE] Closing queue events: ${name}`);
      await events.close();
    }
  }

  // Close Redis connection
  if (connection) {
    await connection.quit();
    connection = null;
  }

  console.log('[JOB QUEUE] Shutdown complete');
}

