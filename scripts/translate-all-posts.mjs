import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function translatePosts() {
  console.log('🌍 Starting bulk translation...\n')
  
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
  
  // Find posts needing EN translation
  const needsEN = posts.filter(p => 
    p.originalLanguage === 'ko' && 
    !p.translations.some(t => t.locale === 'en')
  )
  
  // Find posts needing KO translation
  const needsKO = posts.filter(p => 
    p.originalLanguage === 'en' && 
    !p.translations.some(t => t.locale === 'ko')
  )
  
  console.log(`📊 Found ${needsEN.length} posts needing English translation`)
  console.log(`📊 Found ${needsKO.length} posts needing Korean translation`)
  console.log(`📊 Total: ${needsEN.length + needsKO.length} translations needed\n`)
  
  const BATCH_SIZE = 10
  const DELAY_MS = 2000 // 2 seconds between batches
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  // Translate to English
  if (needsEN.length > 0) {
    console.log('🇬🇧 Translating to English...')
    for (let i = 0; i < needsEN.length; i += BATCH_SIZE) {
      const batch = needsEN.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(needsEN.length / BATCH_SIZE)
      
      console.log(`\n  Batch ${batchNum}/${totalBatches} (${batch.length} posts)`)
      
      try {
        const response = await fetch('http://localhost:3000/api/admin/translate-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postIds: batch.map(p => p.id),
            targetLang: 'en'
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          result.results.forEach(r => {
            if (r.status === 'success') {
              successCount++
              console.log(`    ✓ ${r.postId.substring(0, 8)}...`)
            } else if (r.status === 'skipped') {
              skippedCount++
              console.log(`    ○ ${r.postId.substring(0, 8)}... (skipped)`)
            } else {
              errorCount++
              console.log(`    ✗ ${r.postId.substring(0, 8)}... (${r.message})`)
            }
          })
        }
      } catch (error) {
        console.error(`    ✗ Batch failed:`, error.message)
        errorCount += batch.length
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < needsEN.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }
  }
  
  // Translate to Korean
  if (needsKO.length > 0) {
    console.log('\n🇰🇷 Translating to Korean...')
    for (let i = 0; i < needsKO.length; i += BATCH_SIZE) {
      const batch = needsKO.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(needsKO.length / BATCH_SIZE)
      
      console.log(`\n  Batch ${batchNum}/${totalBatches} (${batch.length} posts)`)
      
      try {
        const response = await fetch('http://localhost:3000/api/admin/translate-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postIds: batch.map(p => p.id),
            targetLang: 'ko'
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          result.results.forEach(r => {
            if (r.status === 'success') {
              successCount++
              console.log(`    ✓ ${r.postId.substring(0, 8)}...`)
            } else if (r.status === 'skipped') {
              skippedCount++
              console.log(`    ○ ${r.postId.substring(0, 8)}... (skipped)`)
            } else {
              errorCount++
              console.log(`    ✗ ${r.postId.substring(0, 8)}... (${r.message})`)
            }
          })
        }
      } catch (error) {
        console.error(`    ✗ Batch failed:`, error.message)
        errorCount += batch.length
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < needsKO.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Translation Complete!')
  console.log('='.repeat(50))
  console.log(`✓ Success: ${successCount}`)
  console.log(`○ Skipped: ${skippedCount}`)
  console.log(`✗ Errors: ${errorCount}`)
  console.log(`📊 Total: ${successCount + skippedCount + errorCount}`)
  
  await prisma.$disconnect()
}

translatePosts().catch(console.error)
