import { Worker } from 'bullmq'
import { QUEUE_NAMES } from './queue'
import emailService from './email'
import { prisma } from './prisma'

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
}

// 评论通知处理器
export const reviewNotificationWorker = new Worker(
  QUEUE_NAMES.REVIEW_NOTIFICATIONS,
  async (job) => {
    const { customerName, productTitle, rating, title, content, mediaUrls } = job.data

    console.log(`📧 Processing review notification job ${job.id} for product: ${productTitle}`)

    try {
      await emailService.sendNewReviewNotification({
        customerName,
        productTitle,
        rating,
        title: title || '',
        content,
        mediaUrls: mediaUrls || [],
      })

      console.log(`✅ Review notification email sent successfully for job ${job.id}`)
      return { success: true }
    } catch (error) {
      console.error(`❌ Failed to send review notification email for job ${job.id}:`, error)
      throw error
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // 同时处理5个作业
    limiter: {
      max: 10, // 每duration毫秒最多处理10个作业
      duration: 1000,
    },
  }
)

// 邮件处理工作器（通用邮件处理）
export const emailProcessingWorker = new Worker(
  QUEUE_NAMES.EMAIL_PROCESSING,
  async (job) => {
    const { type, data } = job.data

    console.log(`📧 Processing email job ${job.id} of type: ${type}`)

    try {
      switch (type) {
        case 'review-notification':
          await emailService.sendNewReviewNotification(data)
          break
        case 'welcome':
          // 可以添加其他类型的邮件处理
          break
        default:
          throw new Error(`Unknown email type: ${type}`)
      }

      console.log(`✅ Email processed successfully for job ${job.id}`)
      return { success: true }
    } catch (error) {
      console.error(`❌ Failed to process email job ${job.id}:`, error)
      throw error
    }
  },
  {
    connection: redisConfig,
    concurrency: 3,
    limiter: {
      max: 20,
      duration: 1000,
    },
  }
)

// 评分计算处理器
export const ratingCalculationWorker = new Worker(
  QUEUE_NAMES.RATING_CALCULATION,
  async (job) => {
    const { productId } = job.data

    console.log(`📊 Calculating rating stats for product ${productId}`)

    try {
      // 获取该产品所有已发布的评论
      const reviews = await prisma.review.findMany({
        where: {
          productId,
          published: true,
        },
        select: {
          rating: true,
        },
      })

      if (reviews.length === 0) {
        // 如果没有评论，重置评分统计
        await prisma.product.update({
          where: { id: productId },
          data: {
            averageRating: null,
            reviewCount: 0,
            ratingStats: {},
          },
        })
        console.log(`✅ Reset rating stats for product ${productId} (no reviews)`)
        return { success: true, reviewCount: 0, averageRating: null }
      }

      // 计算评分分布
      const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      let totalRating = 0

      reviews.forEach(review => {
        ratingStats[review.rating as keyof typeof ratingStats]++
        totalRating += review.rating
      })

      // 计算平均评分（保留两位小数）
      const averageRating = Math.round((totalRating / reviews.length) * 100) / 100

      // 更新产品评分统计
      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating,
          reviewCount: reviews.length,
          ratingStats,
        },
      })

      console.log(`✅ Updated rating stats for product ${productId}: ${averageRating} (${reviews.length} reviews)`)
      return { success: true, reviewCount: reviews.length, averageRating }
    } catch (error) {
      console.error(`❌ Failed to calculate rating stats for product ${productId}:`, error)
      throw error
    }
  },
  {
    connection: redisConfig,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 1000,
    },
  }
)

// 工作器事件监听
reviewNotificationWorker.on('completed', (job) => {
  if (job) {
    console.log(`✅ Review notification job ${job.id} completed`)
  }
})

reviewNotificationWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Review notification job ${job.id} failed:`, err.message)
  } else {
    console.error(`❌ Review notification job failed:`, err.message)
  }
})

emailProcessingWorker.on('completed', (job) => {
  if (job) {
    console.log(`✅ Email processing job ${job.id} completed`)
  }
})

emailProcessingWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Email processing job ${job.id} failed:`, err.message)
  } else {
    console.error(`❌ Email processing job failed:`, err.message)
  }
})

ratingCalculationWorker.on('completed', (job) => {
  if (job) {
    console.log(`✅ Rating calculation job ${job.id} completed`)
  }
})

ratingCalculationWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Rating calculation job ${job.id} failed:`, err.message)
  } else {
    console.error(`❌ Rating calculation job failed:`, err.message)
  }
})

// 优雅关闭工作器
export async function closeWorkers() {
  try {
    await Promise.all([
      reviewNotificationWorker.close(),
      emailProcessingWorker.close(),
      ratingCalculationWorker.close(), // 新增
    ])
    console.log('✅ All workers closed successfully')
  } catch (error) {
    console.error('❌ Error closing workers:', error)
  }
}

// 启动所有工作器
export async function startWorkers() {
  console.log('🚀 Starting queue workers...')

  // 工作器已经在实例化时启动，这里只是为了明确启动过程
  console.log('✅ Review notification worker started')
  console.log('✅ Email processing worker started')
  console.log('✅ Rating calculation worker started') // 新增

  // 处理未完成的作业
  await reviewNotificationWorker.waitUntilReady()
  await emailProcessingWorker.waitUntilReady()
  await ratingCalculationWorker.waitUntilReady() // 新增

  console.log('✅ All workers are ready and processing jobs')
}
