// 테스트용 이미지 업로드 시뮬레이션
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testImageUpload() {
  console.log('🧪 이미지 업로드 테스트 시작...\n');

  // 1. 게시물 목록 가져오기 (발행일 순)
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'asc' },
    select: { id: true, title: true, slug: true }
  });

  console.log(`📋 총 ${posts.length}개 게시물 발견\n`);

  // 2. 테스트용 이미지 URL 생성 (실제로는 피그마에서 업로드)
  const testImages = [
    '/uploads/1.png',
    '/uploads/2.png',
    '/uploads/3.png',
    '/uploads/4.png',
    '/uploads/5.png'
  ];

  // 3. 상위 5개 게시물에 이미지 추가
  const updates = [];
  for (let i = 0; i < Math.min(5, posts.length); i++) {
    const post = posts[i];
    const imageUrl = testImages[i];
    
    try {
      const updated = await prisma.post.update({
        where: { id: post.id },
        data: { coverImage: imageUrl }
      });
      
      updates.push({
        order: i + 1,
        title: post.title,
        imageUrl: imageUrl,
        success: true
      });
      
      console.log(`✅ ${i + 1}. "${post.title}"`);
      console.log(`   → 이미지: ${imageUrl}\n`);
    } catch (error) {
      console.error(`❌ 실패: ${post.title}`);
      updates.push({
        order: i + 1,
        title: post.title,
        imageUrl: '',
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n📊 업로드 결과 요약:');
  console.log(`- 성공: ${updates.filter(u => u.success).length}개`);
  console.log(`- 실패: ${updates.filter(u => !u.success).length}개`);

  return updates;
}

// 테스트 실행
testImageUpload()
  .then(() => {
    console.log('\n✨ 테스트 완료!');
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());