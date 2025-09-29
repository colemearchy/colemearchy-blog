// Script to publish all draft posts

async function publishDraftPosts() {
  console.log('📡 DRAFT 포스트 발행 시작...')
  
  try {
    // Get all draft posts
    const response = await fetch('http://localhost:3001/api/posts')
    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }
    
    const posts = await response.json()
    const draftPosts = posts.filter((post: any) => post.status === 'DRAFT')
    
    console.log(`🔍 총 ${draftPosts.length}개의 DRAFT 포스트를 찾았습니다.`)
    
    let publishedCount = 0
    
    for (const post of draftPosts) {
      console.log(`\n📝 발행 중: ${post.title}`)
      
      try {
        // Update post to published
        const updateResponse = await fetch(`http://localhost:3001/api/posts/${post.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString(),
          }),
        })
        
        if (!updateResponse.ok) {
          const error = await updateResponse.json()
          console.error(`❌ 발행 실패: ${error.error || 'Unknown error'}`)
          continue
        }
        
        const updatedPost = await updateResponse.json()
        console.log(`✅ 발행 완료: ${updatedPost.slug}`)
        publishedCount++
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`❌ 오류 발생:`, error)
      }
    }
    
    console.log(`\n🎉 총 ${publishedCount}개의 포스트가 발행되었습니다!`)
    
    // Trigger sitemap update if any posts were published
    if (publishedCount > 0) {
      console.log('\n🗺️ 사이트맵 업데이트 트리거...')
      try {
        await fetch('http://localhost:3001/api/sitemap/update', {
          method: 'POST',
        })
        console.log('✅ 사이트맵 업데이트 완료')
      } catch (error) {
        console.error('❌ 사이트맵 업데이트 실패:', error)
      }
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error)
  }
}

// Run the script
publishDraftPosts().catch(console.error)