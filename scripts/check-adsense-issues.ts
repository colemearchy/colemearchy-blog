// AdSense 승인 문제 체크 스크립트

async function checkAdSenseIssues() {
  console.log('🔍 AdSense 승인 문제 체크 시작...\n')
  
  const issues: string[] = []
  
  // 1. 포스트 개수 확인
  console.log('1. 콘텐츠 양 확인...')
  try {
    const response = await fetch('http://localhost:3001/api/posts')
    const posts = await response.json()
    const publishedPosts = posts.filter((p: any) => p.status === 'PUBLISHED')
    
    console.log(`   ✓ 전체 포스트: ${posts.length}개`)
    console.log(`   ✓ 발행된 포스트: ${publishedPosts.length}개`)
    
    if (publishedPosts.length < 10) {
      issues.push('발행된 포스트가 10개 미만입니다. 더 많은 고품질 콘텐츠가 필요합니다.')
    }
  } catch (error) {
    console.error('   ❌ 포스트 확인 실패:', error)
  }
  
  // 2. 페이지 접근성 확인
  console.log('\n2. 주요 페이지 접근성 확인...')
  const pagesToCheck = [
    '/',
    '/about',
    '/privacy',
    '/terms',
  ]
  
  for (const page of pagesToCheck) {
    try {
      const response = await fetch(`http://localhost:3001${page}`)
      if (response.ok) {
        console.log(`   ✓ ${page}: 정상 (${response.status})`)
      } else {
        console.log(`   ❌ ${page}: 오류 (${response.status})`)
        issues.push(`${page} 페이지가 정상적으로 로드되지 않습니다.`)
      }
    } catch (error) {
      console.log(`   ❌ ${page}: 접근 실패`)
      issues.push(`${page} 페이지에 접근할 수 없습니다.`)
    }
  }
  
  // 3. 필수 페이지 존재 확인
  console.log('\n3. 필수 페이지 존재 확인...')
  const requiredPages = {
    '개인정보 보호정책': '/privacy',
    '이용약관': '/terms',
    '회사 소개': '/about',
  }
  
  for (const [name, path] of Object.entries(requiredPages)) {
    try {
      const response = await fetch(`http://localhost:3001${path}`)
      if (response.ok) {
        console.log(`   ✓ ${name} 페이지 존재`)
      } else {
        console.log(`   ❌ ${name} 페이지 없음`)
        issues.push(`${name} 페이지가 필요합니다.`)
      }
    } catch (error) {
      console.log(`   ❌ ${name} 페이지 확인 실패`)
    }
  }
  
  // 4. 콘텐츠 품질 체크
  console.log('\n4. 콘텐츠 품질 체크...')
  try {
    const response = await fetch('http://localhost:3001/api/posts')
    const posts = await response.json()
    const recentPosts = posts.slice(0, 10)
    
    let shortPosts = 0
    let noImagePosts = 0
    
    for (const post of recentPosts) {
      if (post.content.length < 1000) shortPosts++
      if (!post.coverImage) noImagePosts++
    }
    
    console.log(`   ✓ 짧은 포스트 (1000자 미만): ${shortPosts}개`)
    console.log(`   ✓ 이미지 없는 포스트: ${noImagePosts}개`)
    
    if (shortPosts > 5) {
      issues.push('너무 짧은 포스트가 많습니다. 더 상세한 콘텐츠를 작성하세요.')
    }
  } catch (error) {
    console.error('   ❌ 콘텐츠 품질 체크 실패:', error)
  }
  
  // 결과 출력
  console.log('\n' + '='.repeat(50))
  console.log('📊 체크 결과:\n')
  
  if (issues.length === 0) {
    console.log('✅ 특별한 문제점을 발견하지 못했습니다.')
    console.log('\n다음 사항을 추가로 확인해보세요:')
    console.log('1. 모든 페이지가 JavaScript 없이도 기본 콘텐츠를 표시하는지')
    console.log('2. 페이지 로딩 속도가 적절한지')
    console.log('3. 콘텐츠가 원본이며 가치있는 정보를 제공하는지')
    console.log('4. 다른 사이트의 콘텐츠를 무단 복사하지 않았는지')
  } else {
    console.log('❌ 발견된 문제점:\n')
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`)
    })
  }
  
  console.log('\n💡 추가 권장사항:')
  console.log('1. Google Search Console에서 사이트 인덱싱 상태 확인')
  console.log('2. 페이지 로딩 속도 개선 (Lighthouse 점수 확인)')
  console.log('3. 모바일 친화성 테스트 실행')
  console.log('4. 콘텐츠의 독창성과 가치 향상')
  console.log('5. 일주일 후 다시 신청해보세요')
}

// 스크립트 실행
checkAdSenseIssues().catch(console.error)