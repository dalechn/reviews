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
    reviewId: string
  }): Promise<void> {
    const { customerName, productTitle, rating, title, content, reviewId } = reviewData

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
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reviews/${reviewId}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看评论详情
          </a>
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
评论内容：${content}

查看详情：${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reviews/${reviewId}
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

// 创建单例实例
const emailService = new EmailService()

export default emailService
