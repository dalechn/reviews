const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Create a connection pool for PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://admin:46647451@localhost:5432/shopify_reviews'

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({
    connectionString,
    ssl: false, // Disable SSL for local development
  })),
  log: ['query'],
})

async function cleanupDuplicateCustomers() {
  try {
    console.log('🔍 检查重复的客户数据...')

    // 查找重复的 (email, shopId) 组合
    const duplicates = await prisma.$queryRaw`
      SELECT email, "shopId", COUNT(*) as count
      FROM customers
      GROUP BY email, "shopId"
      HAVING COUNT(*) > 1
    `

    console.log('发现重复的客户组合:', duplicates)

    if (duplicates.length === 0) {
      console.log('✅ 没有发现重复的客户数据')
      return
    }

    // 对于每个重复的组合，保留最新的记录，删除其他的
    for (const dup of duplicates) {
      console.log(`处理重复组合: ${dup.email} - ${dup.shopId}`)

      // 获取这个组合的所有记录，按创建时间排序
      const customers = await prisma.customer.findMany({
        where: {
          email: dup.email,
          shopId: dup.shopId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 保留最新的记录（第一个），删除其他的
      const toDelete = customers.slice(1)

      for (const customer of toDelete) {
        console.log(`删除重复客户: ${customer.id} (${customer.email})`)
        await prisma.customer.delete({
          where: { id: customer.id }
        })
      }
    }

    console.log('✅ 重复客户数据清理完成')

  } catch (error) {
    console.error('清理过程中出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateCustomers()
