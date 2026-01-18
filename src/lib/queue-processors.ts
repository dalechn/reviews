import { Worker } from 'bullmq'
import { QUEUE_NAMES } from './queue'
import emailService from './email'
import { prisma } from './prisma'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from '@ffmpeg-installer/ffmpeg'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import os from 'os'

// 设置 ffmpeg 路径
ffmpeg.setFfmpegPath(ffmpegStatic.path)

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
}

// Cloudflare R2 配置
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'd90013cbe8093bed5ad1ee1c239f5a2a'
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '341e9a9c9a08ebbfa6d148f9e85df43d8f89ccd0459f5bc2aca5fa9d337de6a8'
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '90c92d63facae1160b45024cfa9de08d'
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'review'
const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN || 'https://img.frenmap.fun'

// 创建 R2 客户端
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

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

// 视频缩略图生成处理器
export const videoThumbnailWorker = new Worker(
  QUEUE_NAMES.VIDEO_THUMBNAIL,
  async (job) => {
    const { videoUrl, reviewId, fileName } = job.data

    console.log(`🎥 Generating thumbnail for video ${fileName} in review ${reviewId}`)

    let tempDir = ''
    let tempVideoPath = ''
    let tempThumbnailPath = ''

    try {
      // 创建临时目录
      tempDir = path.join(os.tmpdir(), `video-thumb-${uuidv4()}`)
      await fs.promises.mkdir(tempDir, { recursive: true })

      tempVideoPath = path.join(tempDir, `video-${fileName}`)
      tempThumbnailPath = path.join(tempDir, `thumb-${fileName}.jpg`)

      // 下载视频文件
      console.log(`📥 Downloading video from ${videoUrl}`)
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`)
      }

      const videoBuffer = await videoResponse.arrayBuffer()
      await fs.promises.writeFile(tempVideoPath, Buffer.from(videoBuffer))

      // 使用ffmpeg生成缩略图（第1秒的截图）
      console.log(`🎬 Generating thumbnail at 1 second mark`)
      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .inputOptions(['-ss 00:00:01']) // 从第1秒开始
          .outputOptions([
            '-vframes 1', // 只提取1帧
            '-q:v 2',     // 质量设置
            '-vf scale=320:-2' // 缩放宽度为320，保持比例
          ])
          .output(tempThumbnailPath)
          .on('end', () => {
            console.log('✅ Thumbnail generated successfully')
            resolve(void 0)
          })
          .on('error', (err) => {
            console.error('❌ FFmpeg error:', err)
            reject(err)
          })
          .run()
      })

      // 使用sharp优化缩略图
      console.log(`🖼️ Optimizing thumbnail`)
      const optimizedThumbnail = await sharp(tempThumbnailPath)
        .jpeg({ quality: 85 })
        .resize(320, null, { withoutEnlargement: true })
        .toBuffer()

      // 上传缩略图到R2
      const thumbnailFileName = `thumb-${uuidv4()}.jpg`
      console.log(`☁️ Uploading thumbnail to R2: ${thumbnailFileName}`)

      const uploadParams = {
        Bucket: R2_BUCKET_NAME,
        Key: thumbnailFileName,
        Body: optimizedThumbnail,
        ContentType: 'image/jpeg',
      }

      const command = new PutObjectCommand(uploadParams)
      await s3Client.send(command)

      const thumbnailUrl = `${R2_CUSTOM_DOMAIN}/${thumbnailFileName}`

      // 更新数据库中的评论，添加缩略图URL
      console.log(`💾 Updating review ${reviewId} with thumbnail URL`)
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { media: true },
      })

      if (!review) {
        throw new Error(`Review ${reviewId} not found`)
      }

      // 更新媒体对象中的缩略图URL
      let media = review.media as any[] || []
      media = media.map(item => {
        if (item.type === 'video' && item.url === videoUrl) {
          return {
            ...item,
            thumbnailUrl,
          }
        }
        return item
      })

      await prisma.review.update({
        where: { id: reviewId },
        data: { media },
      })

      console.log(`✅ Thumbnail generated and saved for review ${reviewId}`)
      return { success: true, thumbnailUrl, videoUrl }

    } catch (error) {
      console.error(`❌ Failed to generate thumbnail for video ${fileName}:`, error)
      throw error
    } finally {
      // 清理临时文件
      try {
        if (tempDir) {
          await fs.promises.rm(tempDir, { recursive: true, force: true })
          console.log(`🧹 Cleaned up temporary files in ${tempDir}`)
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up temporary files:`, cleanupError)
      }
    }
  },
  {
    connection: redisConfig,
    concurrency: 2, // 限制并发，避免占用过多资源
    limiter: {
      max: 5,
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

videoThumbnailWorker.on('completed', (job) => {
  if (job) {
    console.log(`✅ Video thumbnail job ${job.id} completed`)
  }
})

videoThumbnailWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Video thumbnail job ${job.id} failed:`, err.message)
  } else {
    console.error(`❌ Video thumbnail job failed:`, err.message)
  }
})

// 优雅关闭工作器
export async function closeWorkers() {
  try {
    await Promise.all([
      reviewNotificationWorker.close(),
      emailProcessingWorker.close(),
      ratingCalculationWorker.close(), // 新增
      videoThumbnailWorker.close(), // 新增视频缩略图worker
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
  console.log('✅ Video thumbnail worker started') // 新增

  // 处理未完成的作业
  await reviewNotificationWorker.waitUntilReady()
  await emailProcessingWorker.waitUntilReady()
  await ratingCalculationWorker.waitUntilReady() // 新增
  await videoThumbnailWorker.waitUntilReady() // 新增

  console.log('✅ All workers are ready and processing jobs')
}
