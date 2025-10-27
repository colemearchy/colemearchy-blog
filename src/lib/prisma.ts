import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 개발 환경에서 DATABASE_URL 확인
if (process.env.NODE_ENV === 'development') {
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('DATABASE_AUTH_TOKEN exists:', !!process.env.DATABASE_AUTH_TOKEN)
}

// libSQL 클라이언트 생성
const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
})

// Prisma adapter 생성
const adapter = new PrismaLibSQL(libsql)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma