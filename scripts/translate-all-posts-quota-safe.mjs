import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

// Configuration
const DAILY_QUOTA = 45 // Leave 5 requests as buffer
const DELAY_MS = 3000 // 3 seconds between requests
const PROGRESS_FILE = './translation-progress.json'

// Load progress
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    }
  } catch (error) {
    console.log('No previous progress found')
  }
  return { completed: [], failed: [] }
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

async function translatePosts() {
  console.log('🌍 Starting quota-safe bulk translation...\n')
  console.log(`📊 Daily quota: ${DAILY_QUOTA} requests\n`)

  // Load previous progress
  const progress = loadProgress()
  const completedIds = new Set(progress.completed || [])

  console.log(`✓ Already completed: ${completedIds.size} translations\n`)

  // Get posts needing translation
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      slug: true,
      title: true,
      originalLanguage: true,
      translations: {
        select: { locale: true }
      }
    }
  })

  // Find posts needing EN translation (not already completed)
  const needsEN = posts.filter(p =>
    p.originalLanguage === 'ko' &&
    !p.translations.some(t => t.locale === 'en') &&
    !completedIds.has(`${p.id}-en`)
  )

  // Find posts needing KO translation (not already completed)
  const needsKO = posts.filter(p =>
    p.originalLanguage === 'en' &&
    !p.translations.some(t => t.locale === 'ko') &&
    !completedIds.has(`${p.id}-ko`)
  )

  console.log(`📊 Remaining: ${needsEN.length} posts → English`)
  console.log(`📊 Remaining: ${needsKO.length} posts → Korean`)
  console.log(`📊 Total remaining: ${needsEN.length + needsKO.length} translations\n`)

  const allTranslations = [
    ...needsEN.map(p => ({ ...p, targetLang: 'en' })),
    ...needsKO.map(p => ({ ...p, targetLang: 'ko' }))
  ]

  // Only process up to daily quota
  const todaysBatch = allTranslations.slice(0, DAILY_QUOTA)

  if (todaysBatch.length === 0) {
    console.log('✅ All translations complete!')
    await prisma.$disconnect()
    return
  }

  console.log(`🚀 Processing ${todaysBatch.length} translations today`)
  console.log(`⏰ Estimated time: ${Math.ceil(todaysBatch.length * DELAY_MS / 1000 / 60)} minutes\n`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (let i = 0; i < todaysBatch.length; i++) {
    const item = todaysBatch[i]
    const progressStr = `[${i + 1}/${todaysBatch.length}]`

    console.log(`\n${progressStr} Translating: "${item.title.substring(0, 50)}..." → ${item.targetLang.toUpperCase()}`)

    try {
      const response = await fetch('http://localhost:3000/api/admin/translate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds: [item.id],
          targetLang: item.targetLang
        })
      })

      const result = await response.json()

      if (result.success && result.results.length > 0) {
        const r = result.results[0]
        if (r.status === 'success') {
          successCount++
          completedIds.add(`${item.id}-${item.targetLang}`)
          console.log(`    ✓ Success`)
        } else if (r.status === 'skipped') {
          skippedCount++
          completedIds.add(`${item.id}-${item.targetLang}`)
          console.log(`    ○ Skipped (${r.message})`)
        } else {
          errorCount++
          progress.failed = progress.failed || []
          progress.failed.push({ id: item.id, lang: item.targetLang, error: r.message })
          console.log(`    ✗ Error: ${r.message}`)

          // If quota exceeded, stop immediately
          if (r.message.includes('quota') || r.message.includes('429')) {
            console.log('\n⚠️  Daily quota exceeded. Stopping for today.')
            break
          }
        }
      } else {
        errorCount++
        console.log(`    ✗ API call failed`)
      }

      // Save progress after each translation
      progress.completed = Array.from(completedIds)
      saveProgress(progress)

      // Delay between requests
      if (i < todaysBatch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    } catch (error) {
      errorCount++
      console.error(`    ✗ Request failed:`, error.message)

      // If network error, might want to retry
      if (error.message.includes('ECONNREFUSED')) {
        console.log('⚠️  Server not responding. Is pnpm dev running?')
        break
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Today\'s Session Complete!')
  console.log('='.repeat(60))
  console.log(`✓ Success: ${successCount}`)
  console.log(`○ Skipped: ${skippedCount}`)
  console.log(`✗ Errors: ${errorCount}`)
  console.log(`📊 Total today: ${successCount + skippedCount + errorCount}`)
  console.log(`\n✓ Total completed so far: ${completedIds.size}`)
  console.log(`⏳ Remaining: ${allTranslations.length - todaysBatch.length + errorCount}`)

  const daysRemaining = Math.ceil((allTranslations.length - todaysBatch.length) / DAILY_QUOTA)
  if (daysRemaining > 0) {
    console.log(`\n📅 Run this script again tomorrow (${daysRemaining} more days needed)`)
  } else {
    console.log('\n🎉 All translations will be complete!')
  }

  await prisma.$disconnect()
}

translatePosts().catch(console.error)
