import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to manually trigger daily post generation
export async function POST(request: NextRequest) {
  try {
    // Get CRON_SECRET from environment
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    // Call the generate-daily-posts endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://colemearchy.com'}/api/generate-daily-posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to test daily generation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Daily post generation test endpoint',
    instructions: 'Send POST request to trigger test generation',
    timestamp: new Date().toISOString()
  });
}