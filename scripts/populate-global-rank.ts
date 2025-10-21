/**
 * Populate globalRank field for existing posts
 *
 * This script assigns global ranks to non-YouTube posts based on createdAt ASC order.
 * YouTube posts are excluded from ranking (globalRank = null).
 *
 * Usage: pnpm tsx scripts/populate-global-rank.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting globalRank population...\n')

  try {
    // 1. Get all non-YouTube PUBLISHED posts ordered by createdAt ASC
    const nonYouTubePosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        youtubeVideoId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📊 Found ${nonYouTubePosts.length} non-YouTube published posts\n`)

    // 2. Assign global ranks (1-based indexing)
    let updated = 0
    for (let i = 0; i < nonYouTubePosts.length; i++) {
      const post = nonYouTubePosts[i]
      const rank = i + 1

      await prisma.post.update({
        where: { id: post.id },
        data: { globalRank: rank }
      })

      console.log(`✅ Post #${rank}: "${post.title.slice(0, 50)}..." (${post.createdAt.toISOString()})`)
      updated++
    }

    console.log(`\n✨ Successfully updated ${updated} posts with globalRank`)

    // 3. Set YouTube posts to null (explicit null for clarity)
    const youtubePostsResult = await prisma.post.updateMany({
      where: {
        youtubeVideoId: { not: null }
      },
      data: {
        globalRank: null
      }
    })

    console.log(`🎥 Set globalRank=null for ${youtubePostsResult.count} YouTube posts\n`)

    // 4. Verification: Count posts by rank status
    const withRank = await prisma.post.count({
      where: {
        globalRank: { not: null }
      }
    })

    const withoutRank = await prisma.post.count({
      where: {
        globalRank: null
      }
    })

    console.log('📈 Final Stats:')
    console.log(`   Posts with globalRank: ${withRank}`)
    console.log(`   Posts without globalRank (YouTube): ${withoutRank}`)
    console.log(`   Total: ${withRank + withoutRank}`)

  } catch (error) {
    console.error('❌ Error populating globalRank:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
