#!/usr/bin/env node

/**
 * 队列工作器启动脚本
 * 用于处理异步任务，如邮件发送等
 */

import { startWorkers, closeWorkers } from './lib/queue-processors'

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  await closeWorkers()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  await closeWorkers()
  process.exit(0)
})

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  closeWorkers().finally(() => {
    process.exit(1)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  closeWorkers().finally(() => {
    process.exit(1)
  })
})

async function main() {
  try {
    console.log('🚀 Starting queue worker...')

    // 启动所有工作器
    await startWorkers()

    console.log('✅ Queue worker started successfully')
    console.log('📧 Listening for jobs...')

    // 保持进程运行
    process.stdin.resume()

  } catch (error) {
    console.error('💥 Failed to start queue worker:', error)
    process.exit(1)
  }
}

// 只有当直接运行此脚本时才启动
if (require.main === module) {
  main()
}

export {}
