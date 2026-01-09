import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a connection pool for PostgreSQL
const connectionString = process.env.DATABASE_URL

// Ensure connection string is available
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(new Pool({
      connectionString,
      // Additional options for better compatibility
      ssl: false, // Disable SSL for local development
    })),
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
