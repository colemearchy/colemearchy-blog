import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// Trigger Vercel redeployment
async function triggerRedeploy() {
  const webhookUrl = process.env.REDEPLOY_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('REDEPLOY_WEBHOOK_URL not configured');
    return false;
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to trigger redeploy:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify that this is a legitimate cron job request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Running scheduled post publication...');
    
    // Find all draft posts that are scheduled to be published
    const now = new Date();
    const postsToPublish = await prisma.post.findMany({
      where: {
        status: 'DRAFT',
        scheduledAt: {
          lte: now, // Less than or equal to current time
          not: null
        }
      }
    });
    
    console.log(`Found ${postsToPublish.length} posts to publish`);
    
    if (postsToPublish.length === 0) {
      return NextResponse.json({ 
        message: 'No posts to publish',
        timestamp: now.toISOString()
      });
    }
    
    // Update posts to published status
    const publishedPosts = [];
    for (const post of postsToPublish) {
      try {
        const published = await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now
          }
        });
        publishedPosts.push(published);
        console.log(`Published post: ${published.title} (${published.id})`);
      } catch (error) {
        console.error(`Failed to publish post ${post.id}:`, error);
      }
    }
    
    // Trigger redeploy if any posts were published
    if (publishedPosts.length > 0) {
      console.log('Triggering Vercel redeploy...');
      const redeployed = await triggerRedeploy();
      
      if (!redeployed) {
        console.error('Failed to trigger redeploy, but posts were published');
      }
    }
    
    return NextResponse.json({
      message: `Published ${publishedPosts.length} posts`,
      publishedPosts: publishedPosts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt
      })),
      timestamp: now.toISOString(),
      redeployTriggered: publishedPosts.length > 0
    });
    
  } catch (error) {
    console.error('Error in publish-posts handler:', error);
    return NextResponse.json({ 
      error: 'Failed to publish posts',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Also support GET for manual testing (protected by secret)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Just check for scheduled posts without publishing
  const now = new Date();
  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: 'DRAFT',
      scheduledAt: {
        lte: now,
        not: null
      }
    },
    select: {
      id: true,
      title: true,
      scheduledAt: true
    }
  });
  
  return NextResponse.json({
    scheduledPosts,
    currentTime: now.toISOString(),
    count: scheduledPosts.length
  });
}