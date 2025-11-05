import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@libsql/client'
import { withErrorHandler, logger, createSuccessResponse, validateRequest } from '@/lib/error-handler'
import { verifyAdminAuth } from '@/lib/auth'
import { z } from 'zod'

// Direct Turso client to bypass Prisma INTEGER/REAL conversion issues
const turso = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
})

const affiliateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  coupangUrl: z.string().url('Valid Coupang URL is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  keywords: z.string().optional().default(''),
  description: z.string().optional().nullable()
})

/**
 * GET /api/admin/affiliate-products
 * Fetch all affiliate products
 * Using raw Turso SQL to bypass Prisma INTEGER/REAL conversion issues
 */
async function getProductsHandler(request: NextRequest) {
  logger.info('Fetching all affiliate products')

  // Use raw SQL query to avoid Prisma type conversion errors
  const result = await turso.execute({
    sql: `
      SELECT
        ap.*,
        COUNT(pap."postId") as post_count
      FROM "AffiliateProduct" ap
      LEFT JOIN "PostAffiliateProduct" pap ON ap.id = pap."affiliateProductId"
      GROUP BY ap.id
      ORDER BY ap.createdAt DESC
    `
  })

  // Transform rows to match the expected format
  const products = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    coupangUrl: row.coupangUrl,
    category: row.category,
    price: row.price,
    imageUrl: row.imageUrl,
    keywords: row.keywords,
    description: row.description,
    createdAt: new Date(Number(row.createdAt)).toISOString(),
    updatedAt: new Date(Number(row.updatedAt)).toISOString(),
    _count: {
      posts: Number(row.post_count || 0)
    }
  }))

  logger.info('Affiliate products fetched', { count: products.length })

  return createSuccessResponse(
    { products },
    new URL(request.url).pathname
  )
}

/**
 * POST /api/admin/affiliate-products
 * Create new affiliate product
 */
async function createProductHandler(request: NextRequest) {
  const validatedData = await validateRequest(request, affiliateProductSchema)

  logger.info('Creating new affiliate product', { name: validatedData.name })

  const product = await prisma.affiliateProduct.create({
    data: {
      name: validatedData.name,
      coupangUrl: validatedData.coupangUrl,
      category: validatedData.category,
      price: validatedData.price ?? null,
      imageUrl: validatedData.imageUrl ?? null,
      keywords: validatedData.keywords,
      description: validatedData.description ?? null
    }
  })

  logger.info('Affiliate product created', { productId: product.id })

  return createSuccessResponse(
    { product },
    new URL(request.url).pathname
  )
}

export async function GET(request: NextRequest) {
  // 🔒 인증 체크
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  return withErrorHandler(getProductsHandler)(request)
}

export async function POST(request: NextRequest) {
  // 🔒 인증 체크
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  return withErrorHandler(createProductHandler)(request)
}
