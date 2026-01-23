import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

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

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize } = await request.json()

    // 验证参数
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required parameters: fileName, fileType, fileSize' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = [
      // 图片格式
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
      'image/bmp', 'image/svg+xml', 'image/tiff', 'image/heic', 'image/heif',
      // 视频格式
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'video/mkv', 'video/flv', 'video/wmv', 'video/3gpp', 'video/quicktime'
    ]
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      )
    }

    // 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // 创建 PutObjectCommand
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
      ContentLength: fileSize,
    })

    // 生成预签名 URL，有效期 15 分钟
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 15 * 60, // 15 minutes
    })

    // 生成公开访问URL
    const publicUrl = `${R2_CUSTOM_DOMAIN}/${uniqueFileName}`

    // 检查是否为视频文件
    const isVideo = fileType.startsWith('video/')

    return NextResponse.json({
      success: true,
      signedUrl,
      publicUrl,
      fileName: uniqueFileName,
      fileType,
      isVideo,
    })

  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
