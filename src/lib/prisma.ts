import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined
}

// Lazy Prisma client — never connects during build
// Only creates the client on first actual database query
function getPrismaClient(): PrismaClient {
  if (globalForPrisma._prisma) return globalForPrisma._prisma

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    // During build, return a dummy client that will fail gracefully at runtime
    // This prevents build crashes when DATABASE_URL is not set
    console.warn('[prisma] DATABASE_URL not set — database queries will fail')
  }

  // Only import and use LibSQL adapter when we have a URL
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSQL } = require('@prisma/adapter-libsql')
  const adapter = new PrismaLibSQL({
    url: dbUrl || 'file:./dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma._prisma = client
  }

  return client
}

// Export as a Proxy so the client is only created when a property is accessed
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
