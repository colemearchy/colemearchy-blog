import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const drafts = await prisma.post.findMany({
    where: { status: 'DRAFT' },
    select: {
      title: true,
      status: true,
      scheduledAt: true,
      originalLanguage: true,
      createdAt: true
    },
    orderBy: { scheduledAt: 'asc' },
    take: 15
  });

  console.log(`\n📋 예약된 DRAFT 포스트: ${drafts.length}개\n`);

  drafts.forEach((post, i) => {
    console.log(`${i + 1}. ${post.title}`);
    console.log(`   언어: ${post.originalLanguage}`);
    console.log(`   예약: ${post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'N/A'}`);
    console.log(`   생성: ${new Date(post.createdAt).toLocaleString()}\n`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
