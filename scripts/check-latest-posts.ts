import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get posts created in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentPosts = await prisma.post.findMany({
    where: {
      status: 'DRAFT',
      createdAt: { gte: oneHourAgo }
    },
    select: {
      title: true,
      status: true,
      scheduledAt: true,
      originalLanguage: true,
      createdAt: true,
      tags: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n📝 최근 1시간 내 생성된 DRAFT 포스트: ${recentPosts.length}개\n`);

  recentPosts.forEach((post, i) => {
    console.log(`${i + 1}. ${post.title}`);
    console.log(`   태그: ${post.tags.slice(0, 3).join(', ')}`);
    console.log(`   언어: ${post.originalLanguage}`);
    console.log(`   예약: ${post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A'}`);
    console.log();
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
