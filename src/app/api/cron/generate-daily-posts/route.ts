import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify that this is a legitimate cron job request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Daily blog post generation started...');
    const startTime = Date.now();

    // Import and execute the generation script
    // Note: We need to dynamically import since this is in the Edge runtime
    const { generateDailyPosts } = await import('@/../scripts/generate-daily-posts');

    const result = await generateDailyPosts();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Daily blog post generation completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      message: `Generated ${result.success} posts successfully`,
      stats: {
        successful: result.success,
        failed: result.failed,
        dryRun: result.dryRun,
        durationSeconds: parseFloat(duration)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in daily post generation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate daily posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (protected by secret)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Daily post generation endpoint is ready',
    config: {
      postsPerDay: process.env.POSTS_PER_DAY || '10',
      hoursBetweenPosts: process.env.HOURS_BETWEEN_POSTS || '2',
      dryRun: process.env.DRY_RUN === 'true'
    },
    timestamp: new Date().toISOString()
  });
}

// Export runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes (max for Pro plan)
