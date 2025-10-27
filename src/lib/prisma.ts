import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 개발 환경에서 DATABASE_URL 확인
if (process.env.NODE_ENV === 'development') {
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('DATABASE_AUTH_TOKEN exists:', !!process.env.DATABASE_AUTH_TOKEN)
}

// Prisma adapter 생성 (설정 객체 직접 전달)
const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma