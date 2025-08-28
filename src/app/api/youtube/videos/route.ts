import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';

export async function GET(request: Request) {
  try {
    // API 키 확인
    if (!process.env.YOUTUBE_API_KEY || !process.env.YOUTUBE_CHANNEL_ID) {
      return NextResponse.json(
        { error: 'YouTube API not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const videos = await getChannelVideos(limit);
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error in YouTube API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' },
      { status: 500 }
    );
  }
}