import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

// Cloudflare R2 配置
const R2_ACCESS_KEY_ID = 'd90013cbe8093bed5ad1ee1c239f5a2a'
const R2_SECRET_ACCESS_KEY = '341e9a9c9a08ebbfa6d148f9e85df43d8f89ccd0459f5bc2aca5fa9d337de6a8'
const R2_ACCOUNT_ID = '90c92d63facae1160b45024cfa9de08d'
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
    // 检查bucket是否存在
    try {
      const headBucketCommand = new HeadBucketCommand({ Bucket: R2_BUCKET_NAME })
      await s3Client.send(headBucketCommand)
    } catch (error) {
      return NextResponse.json(
        { error: `Bucket '${R2_BUCKET_NAME}' does not exist or is not accessible. Please create the bucket in Cloudflare R2 and set it to public access.` },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      )
    }

    // 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // 转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到 R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // R2 不需要 ACL 参数
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    // 生成公开访问URL
    const fileUrl = `${R2_CUSTOM_DOMAIN}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      fileType: file.type,
      fileSize: file.size,
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
