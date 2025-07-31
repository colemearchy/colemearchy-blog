const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function checkPosts() {
  try {
    console.log('🔍 Analyzing posts in colemearchy-blog database...\n');

    // Get all posts ordered by creation date
    const allPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        scheduledAt: true,
        author: true,
        tags: true,
        excerpt: true,
        content: true,
        views: true
      }
    });

    // Count posts by status
    const statusCounts = await prisma.post.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get scheduled posts
    const scheduledPosts = await prisma.post.findMany({
      where: {
        scheduledAt: {
          not: null
        },
        status: 'DRAFT'
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    // Analysis
    console.log('📊 DATABASE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total posts: ${allPosts.length}`);
    
    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});
    
    console.log(`Published posts: ${statusSummary.PUBLISHED || 0}`);
    console.log(`Draft posts: ${statusSummary.DRAFT || 0}`);
    console.log(`Recent posts (last 7 days): ${recentPosts.length}`);
    console.log(`Scheduled posts: ${scheduledPosts.length}`);

    // Analyze AI-generated content patterns
    console.log('\n🤖 AI-GENERATED CONTENT ANALYSIS');
    console.log('='.repeat(50));
    
    const aiPatterns = [
      'comprehensive guide',
      'ultimate guide',
      'step-by-step',
      'everything you need to know',
      'in-depth analysis',
      'mastering',
      'complete tutorial',
      'best practices'
    ];

    const likelyAiPosts = allPosts.filter(post => {
      const titleLower = post.title.toLowerCase();
      const contentLower = post.content.toLowerCase();
      return aiPatterns.some(pattern => 
        titleLower.includes(pattern) || contentLower.includes(pattern)
      );
    });

    console.log(`Likely AI-generated posts: ${likelyAiPosts.length}`);
    
    if (likelyAiPosts.length > 0) {
      console.log('\nRecent AI-generated titles:');
      likelyAiPosts.slice(0, 5).forEach(post => {
        console.log(`  • ${post.title} (${post.status})`);
      });
    }

    // Recent posts details
    if (recentPosts.length > 0) {
      console.log('\n📅 RECENT POSTS (Last 7 days)');
      console.log('='.repeat(50));
      recentPosts.forEach(post => {
        console.log(`${post.createdAt.toISOString().split('T')[0]} | ${post.status} | ${post.title}`);
        if (post.tags.length > 0) {
          console.log(`  Tags: ${post.tags.join(', ')}`);
        }
        if (post.author) {
          console.log(`  Author: ${post.author}`);
        }
        console.log('');
      });
    }

    // Scheduled posts
    if (scheduledPosts.length > 0) {
      console.log('\n⏰ SCHEDULED POSTS');
      console.log('='.repeat(50));
      scheduledPosts.forEach(post => {
        const scheduledDate = post.scheduledAt.toISOString().split('T')[0];
        const scheduledTime = post.scheduledAt.toISOString().split('T')[1].split('.')[0];
        console.log(`${scheduledDate} ${scheduledTime} | ${post.title}`);
      });
    }

    // Quality indicators
    console.log('\n📈 QUALITY INDICATORS');
    console.log('='.repeat(50));
    
    const avgContentLength = allPosts.reduce((sum, post) => sum + post.content.length, 0) / allPosts.length;
    const postsWithExcerpts = allPosts.filter(post => post.excerpt && post.excerpt.trim().length > 0).length;
    const postsWithTags = allPosts.filter(post => post.tags && post.tags.length > 0).length;
    const postsWithAuthors = allPosts.filter(post => post.author && post.author.trim().length > 0).length;
    const totalViews = allPosts.reduce((sum, post) => sum + (post.views || 0), 0);

    console.log(`Average content length: ${Math.round(avgContentLength)} characters`);
    console.log(`Posts with excerpts: ${postsWithExcerpts}/${allPosts.length} (${Math.round(postsWithExcerpts/allPosts.length*100)}%)`);
    console.log(`Posts with tags: ${postsWithTags}/${allPosts.length} (${Math.round(postsWithTags/allPosts.length*100)}%)`);
    console.log(`Posts with authors: ${postsWithAuthors}/${allPosts.length} (${Math.round(postsWithAuthors/allPosts.length*100)}%)`);
    console.log(`Total views across all posts: ${totalViews}`);

    // Most popular posts
    const popularPosts = allPosts
      .filter(post => post.status === 'PUBLISHED')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    if (popularPosts.length > 0 && popularPosts[0].views > 0) {
      console.log('\n🔥 MOST POPULAR POSTS');
      console.log('='.repeat(50));
      popularPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} (${post.views} views)`);
      });
    }

    // Tag analysis
    const allTags = allPosts.flatMap(post => post.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    if (topTags.length > 0) {
      console.log('\n🏷️  TOP TAGS');
      console.log('='.repeat(50));
      topTags.forEach(([tag, count]) => {
        console.log(`${tag}: ${count} posts`);
      });
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();