/**
 * Daily Shorts Regeneration & Creation Script
 *
 * Strategy based on Gemini's advice:
 * - Mix regeneration (2/day) + new posts (3-7/day)
 * - UPDATE existing posts to preserve SEO
 * - All posts set to DRAFT for manual review
 * - Log failures for retry next day
 *
 * Run via GitHub Actions cron job (daily)
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.colemearchy.com'

// Configuration
const CONFIG = {
  MAX_REGENERATIONS_PER_DAY: process.env.TEST_MODE ? 1 : 2,
  MAX_NEW_POSTS_PER_DAY: process.env.TEST_MODE ? 2 : 7,
  MIN_CONTENT_LENGTH: 1000, // Posts below this need regeneration
  RETRY_DELAY_MS: 2000, // 2 seconds between API calls
  DRY_RUN: process.env.DRY_RUN === 'true', // Don't actually call API
}

async function fetchPostsNeedingRegeneration() {
  // Fetch all posts with YouTube video IDs
  // We'll filter by content length in-memory
  return await prisma.post.findMany({
    where: {
      youtubeVideoId: { not: null }
    },
    select: {
      id: true,
      title: true,
      youtubeVideoId: true,
      content: true,
      slug: true,
      tags: true
    },
    orderBy: {
      createdAt: 'asc' // Oldest first
    }
  })
}

async function fetchShortsWithoutPosts() {
  // Get all existing video IDs
  const existingPosts = await prisma.post.findMany({
    where: {
      youtubeVideoId: { not: null }
    },
    select: {
      youtubeVideoId: true
    }
  })

  const existingVideoIds = new Set(existingPosts.map(p => p.youtubeVideoId))

  // Import YouTube API (dynamic import for ES modules)
  const { getChannelVideos } = await import('../src/lib/youtube.js')

  // Fetch all Shorts from YouTube
  let allVideos = []
  let pageToken = undefined
  let pageCount = 0

  do {
    const { videos, nextPageToken } = await getChannelVideos(50, pageToken)
    allVideos = allVideos.concat(videos)
    pageToken = nextPageToken
    pageCount++

    if (allVideos.length >= 200) break // Limit to avoid quota issues
  } while (pageToken)

  // Filter to Shorts only, without existing posts
  const shortsWithoutPosts = allVideos
    .filter(v => v.isShort && !existingVideoIds.has(v.id))
    .map(v => ({
      videoId: v.id,
      title: v.title,
      duration: v.duration
    }))

  return shortsWithoutPosts
}

async function regeneratePost(post, isNew = false) {
  const videoId = post.youtubeVideoId || post.videoId

  console.log(`${isNew ? '🆕 Creating' : '🔄 Regenerating'}: ${videoId} - ${post.title}`)

  // Dry run mode - just log without calling API
  if (CONFIG.DRY_RUN) {
    console.log(`   [DRY RUN] Would call API for video: ${videoId}`)
    return {
      success: true,
      videoId,
      postId: 'dry-run-' + videoId,
      slug: 'dry-run-slug'
    }
  }

  try {
    // Call the youtube-to-blog API
    const response = await fetch(`${API_BASE_URL}/api/youtube-to-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        autoPublish: false // Always DRAFT for manual review
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`API returned error: ${result.error || 'Unknown error'}`)
    }

    console.log(`   ✅ Success: ${result.post.slug}`)

    return {
      success: true,
      videoId,
      postId: result.post.id,
      slug: result.post.slug
    }

  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`)

    return {
      success: false,
      videoId,
      error: error.message
    }
  }
}

async function main() {
  console.log('🚀 Starting Daily Shorts Regeneration\n')
  console.log(`📅 Date: ${new Date().toISOString()}`)
  console.log(`🎯 Target: ${CONFIG.MAX_REGENERATIONS_PER_DAY} regenerations + ${CONFIG.MAX_NEW_POSTS_PER_DAY} new posts\n`)

  const results = {
    regenerated: [],
    created: [],
    failed: [],
  }

  try {
    // Step 1: Find posts needing regeneration
    console.log('🔍 Finding posts needing regeneration...')
    const allPostsNeedingUpdate = await fetchPostsNeedingRegeneration()

    // Filter in-memory for content length
    const postsToRegenerate = allPostsNeedingUpdate
      .filter(p => !p.content || p.content.length < CONFIG.MIN_CONTENT_LENGTH)
      .slice(0, CONFIG.MAX_REGENERATIONS_PER_DAY)

    console.log(`   Found ${postsToRegenerate.length} posts to regenerate\n`)

    // Step 2: Process regenerations
    for (const post of postsToRegenerate) {
      const result = await regeneratePost(post, false)

      if (result.success) {
        results.regenerated.push(result)
      } else {
        results.failed.push(result)
      }

      // Delay between calls
      if (postsToRegenerate.length > 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS))
      }
    }

    // Step 3: Find Shorts without posts
    console.log('\n🔍 Finding Shorts videos without posts...')
    const shortsWithoutPosts = await fetchShortsWithoutPosts()

    const numberOfNewPosts = Math.min(
      CONFIG.MAX_NEW_POSTS_PER_DAY,
      shortsWithoutPosts.length
    )

    console.log(`   Found ${shortsWithoutPosts.length} Shorts without posts`)
    console.log(`   Processing ${numberOfNewPosts} new posts today\n`)

    // Step 4: Create new posts
    const shortsToCreate = shortsWithoutPosts.slice(0, numberOfNewPosts)

    for (const short of shortsToCreate) {
      const result = await regeneratePost(short, true)

      if (result.success) {
        results.created.push(result)
      } else {
        results.failed.push(result)
      }

      // Delay between calls
      if (shortsToCreate.length > 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS))
      }
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 DAILY SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Regenerated: ${results.regenerated.length}`)
    console.log(`🆕 Created: ${results.created.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)
    console.log(`📝 Total Processed: ${results.regenerated.length + results.created.length}`)
    console.log('='.repeat(80))

    if (results.failed.length > 0) {
      console.log('\n❌ Failed Videos (will retry tomorrow):')
      results.failed.forEach((f, i) => {
        console.log(`${i + 1}. ${f.videoId}: ${f.error}`)
      })
    }

    console.log('\n💡 Next Steps:')
    console.log('1. Review DRAFT posts in admin dashboard')
    console.log('2. Publish approved posts')
    console.log('3. Failed videos will be retried tomorrow')

    // Log to file for GitHub Actions
    const fs = await import('fs')
    const logEntry = {
      date: new Date().toISOString(),
      regenerated: results.regenerated.length,
      created: results.created.length,
      failed: results.failed.length,
      failedVideos: results.failed.map(f => ({ videoId: f.videoId, error: f.error }))
    }

    fs.appendFileSync(
      'logs/shorts-regeneration.log',
      JSON.stringify(logEntry) + '\n',
      'utf-8'
    )

  } catch (error) {
    console.error('\n💥 Critical Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
