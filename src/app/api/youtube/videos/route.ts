import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';

export async function GET(request: Request) {
  try {
    // API 키 확인 및 디버깅 로그
    console.log('YouTube API Debug:', {
      hasApiKey: !!process.env.YOUTUBE_API_KEY,
      apiKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
      hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID,
      channelId: process.env.YOUTUBE_CHANNEL_ID || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV
    });

    if (!process.env.YOUTUBE_API_KEY || !process.env.YOUTUBE_CHANNEL_ID) {
      return NextResponse.json(
        { 
          error: 'YouTube API not configured',
          message: 'Please set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in Vercel Dashboard',
          instructions: {
            step1: 'Go to https://vercel.com and select your project',
            step2: 'Navigate to Settings → Environment Variables',
            step3: 'Add YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID',
            step4: 'Redeploy the project',
          },
          debug: {
            apiKeyMissing: !process.env.YOUTUBE_API_KEY,
            channelIdMissing: !process.env.YOUTUBE_CHANNEL_ID,
            environment: process.env.NODE_ENV || 'unknown'
          }
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const videos = await getChannelVideos(limit);
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error in YouTube API:', error);
    
    // 더 상세한 에러 정보 반환
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      type: error?.constructor?.name || 'UnknownError',
      // Google API 에러의 경우 추가 정보
      ...(error?.response?.data && { apiError: error.response.data })
    };
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch YouTube videos',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}