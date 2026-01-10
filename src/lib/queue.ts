import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
}

// 创建Redis连接实例
export const redis = new Redis(redisConfig)

// 队列名称常量
export const QUEUE_NAMES = {
  REVIEW_NOTIFICATIONS: 'review-notifications',
  EMAIL_PROCESSING: 'email-processing',
} as const

// 创建队列实例
export const queues = {
  reviewNotifications: new Queue(QUEUE_NAMES.REVIEW_NOTIFICATIONS, {
    connection: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 50, // 完成后保留50个作业
      removeOnFail: 100,    // 失败后保留100个作业
      attempts: 3,          // 最大重试次数
      backoff: {
        type: 'exponential',
        delay: 2000,        // 初始延迟2秒
      },
    },
  }),
  emailProcessing: new Queue(QUEUE_NAMES.EMAIL_PROCESSING, {
    connection: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 50,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }),
}

// 队列事件监听器
export const queueEvents = {
  reviewNotifications: new QueueEvents(QUEUE_NAMES.REVIEW_NOTIFICATIONS, {
    connection: redisConfig,
  }),
  emailProcessing: new QueueEvents(QUEUE_NAMES.EMAIL_PROCESSING, {
    connection: redisConfig,
  }),
}

// 关闭所有队列连接
export async function closeQueues() {
  try {
    await Promise.all([
      queues.reviewNotifications.close(),
      queues.emailProcessing.close(),
      redis.quit(),
    ])
    console.log('✅ All queues closed successfully')
  } catch (error) {
    console.error('❌ Error closing queues:', error)
  }
}

// 健康检查
export async function checkQueueHealth() {
  try {
    const ping = await redis.ping()
    return {
      redis: ping === 'PONG',
      queues: {
        reviewNotifications: await queues.reviewNotifications.getWaiting(),
        emailProcessing: await queues.emailProcessing.getWaiting(),
      },
    }
  } catch (error) {
    console.error('❌ Queue health check failed:', error)
    return { redis: false, queues: null, error: error instanceof Error ? error.message : String(error) }
  }
}
