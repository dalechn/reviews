import nodemailer from 'nodemailer'

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailersend.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail({ to, subject, html, text }: EmailData): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
      }

      console.log('🔄 Attempting to send email to:', to)
      console.log('📧 SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***configured***' : 'NOT_SET',
        from: mailOptions.from
      })

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully to:', to)
      console.log('📨 Message ID:', result.messageId)
    } catch (error) {
      console.error('❌ Failed to send email to:', to)
      console.error('🚨 Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        command: error && typeof error === 'object' && 'command' in error ? error.command : undefined,
        response: error && typeof error === 'object' && 'response' in error ? error.response : undefined
      })
      throw error
    }
  }

  async sendNewReviewNotification(reviewData: {
    customerName: string
    productTitle: string
    rating: number
    title: string
    content: string
    mediaUrls?: string[]
  }): Promise<void> {
    const { customerName, productTitle, rating, title, content, mediaUrls = [] } = reviewData

    const subject = `新评论通知 - ${productTitle}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">收到新的产品评论</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">评论详情</h3>
          <p><strong>客户姓名：</strong>${customerName}</p>
          <p><strong>产品名称：</strong>${productTitle}</p>
          <p><strong>评分：</strong>${'⭐'.repeat(rating)} (${rating}/5)</p>
          <p><strong>评论标题：</strong>${title}</p>
          <p><strong>评论内容：</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
            ${content}
          </div>
          ${generateMediaHtml(mediaUrls)}
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </div>
    `

    const text = `
收到新的产品评论

评论详情：
客户姓名：${customerName}
产品名称：${productTitle}
评分：${rating}/5
评论标题：${title}
评论内容：${content}${generateMediaText(mediaUrls)}
    `

    // 发送给管理员邮箱，如果没有设置则发送到SMTP用户名对应的邮箱
    const adminEmail = process.env.ADMIN_EMAIL

    if (adminEmail) {
      await this.sendEmail({
        to: adminEmail,
        subject,
        html,
        text,
      })
    }
  }
}

// 辅助函数：生成媒体文件HTML
function generateMediaHtml(mediaUrls: string[]): string {
  if (!mediaUrls || mediaUrls.length === 0) {
    return ''
  }

  const mediaHtml = mediaUrls.map(url => {
    const isVideo = /\.(mp4|webm|ogg|avi|mov|wmv)$/i.test(url)
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)

    if (isImage) {
      return `
        <div style="margin: 10px 0;">
          <img src="${url}" alt="评论图片" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ddd;" />
        </div>
      `
    } else if (isVideo) {
      return `
        <div style="margin: 10px 0;">
          <video controls style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ddd;">
            <source src="${url}" type="video/mp4">
            您的浏览器不支持视频播放。
          </video>
        </div>
      `
    } else {
      // 其他类型的文件显示为链接
      return `
        <div style="margin: 10px 0;">
          <a href="${url}" style="color: #007bff; text-decoration: none; padding: 8px 12px; border: 1px solid #007bff; border-radius: 4px; display: inline-block;">
            📎 查看附件文件
          </a>
        </div>
      `
    }
  }).join('')

  return `
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
      <strong>附件媒体文件：</strong>
      ${mediaHtml}
    </div>
  `
}

// 辅助函数：生成媒体文件纯文本描述
function generateMediaText(mediaUrls: string[]): string {
  if (!mediaUrls || mediaUrls.length === 0) {
    return ''
  }

  const imageCount = mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)).length
  const videoCount = mediaUrls.filter(url => /\.(mp4|webm|ogg|avi|mov|wmv)$/i.test(url)).length
  const otherCount = mediaUrls.length - imageCount - videoCount

  let text = '\n\n附件媒体文件：'

  if (imageCount > 0) {
    text += `\n- ${imageCount}张图片`
  }
  if (videoCount > 0) {
    text += `\n- ${videoCount}个视频`
  }
  if (otherCount > 0) {
    text += `\n- ${otherCount}个其他文件`
  }

  text += '\n\n媒体文件链接：'
  mediaUrls.forEach((url, index) => {
    text += `\n${index + 1}. ${url}`
  })

  return text
}

// 创建单例实例
const emailService = new EmailService()

// 导出辅助函数供测试使用
export { generateMediaHtml, generateMediaText }

export default emailService
