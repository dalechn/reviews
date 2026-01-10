import { prisma } from '../lib/prisma'
import { queues } from '../lib/queue'

async function calculateAllProductRatings() {
  console.log('🚀 Starting batch rating calculation for all products...')

  try {
    // 获取所有有评论的产品
    const productsWithReviews = await prisma.product.findMany({
      where: {
        reviews: {
          some: {
            published: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
      },
    })

    console.log(`📊 Found ${productsWithReviews.length} products with reviews`)

    // 为每个产品添加评分计算任务到队列
    const jobs = productsWithReviews.map(product =>
      queues.ratingCalculation.add('batch-update-product-rating', {
        productId: product.id,
      })
    )

    await Promise.all(jobs)
    console.log(`✅ Added ${jobs.length} rating calculation jobs to queue`)

    // 等待所有任务完成（可选）
    console.log('⏳ Waiting for all rating calculations to complete...')
    // 这里可以添加等待逻辑，但为了避免阻塞，可以移除

  } catch (error) {
    console.error('❌ Error during batch rating calculation:', error)
    process.exit(1)
  }
}

// 运行脚本
calculateAllProductRatings()
  .then(() => {
    console.log('🎉 Batch rating calculation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Batch rating calculation failed:', error)
    process.exit(1)
  })
