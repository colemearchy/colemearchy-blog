import { google } from 'googleapis';
import { getBestThumbnailFromApiResponse } from './youtube-thumbnail';

// ISO 8601 duration을 초 단위로 변환하는 함수
function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// YouTube API 클라이언트를 함수로 변경하여 런타임에 환경 변수 로드
function getYouTubeClient() {
  return google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  });
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
  duration?: string;
  isShort?: boolean;
}

// 채널의 최신 동영상 가져오기
export async function getChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    console.log('YouTube API Config:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      hasChannelId: !!channelId,
      channelId: channelId
    });
    
    if (!apiKey) {
      throw new Error('YouTube API Key not configured. Please set YOUTUBE_API_KEY environment variable.');
    }
    
    if (!channelId) {
      throw new Error('YouTube Channel ID not configured. Please set YOUTUBE_CHANNEL_ID environment variable.');
    }

    const youtube = getYouTubeClient();

    // 채널의 업로드 플레이리스트 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    } as any);

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist for channel: ' + channelId);
    }

    // 플레이리스트의 동영상 목록 가져오기
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults,
    } as any);

    const videos: YouTubeVideo[] = [];
    const videoIds: string[] = [];
    
    // 먼저 비디오 ID들을 수집
    for (const item of playlistResponse.data.items || []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId) {
        videoIds.push(videoId);
      }
    }
    
    // 비디오 상세 정보 가져오기 (duration 포함)
    let videoDetails = new Map();
    if (videoIds.length > 0) {
      const videoResponse = await youtube.videos.list({
        part: ['contentDetails', 'snippet'],
        id: videoIds,
      } as any);
      
      for (const video of videoResponse.data.items || []) {
        if (video.id) {
          videoDetails.set(video.id, video);
        }
      }
    }
    
    // 비디오 정보 조합
    for (const item of playlistResponse.data.items || []) {
      const snippet = item.snippet;
      if (!snippet) continue;
      
      const videoId = snippet.resourceId?.videoId;
      if (!videoId) continue;
      
      const details = videoDetails.get(videoId);
      const duration = details?.contentDetails?.duration || '';
      const durationInSeconds = parseDuration(duration);
      const isShort = durationInSeconds > 0 && durationInSeconds <= 60;
      
      videos.push({
        id: videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        thumbnailUrl: getBestThumbnailFromApiResponse(details?.snippet?.thumbnails || snippet.thumbnails) || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: snippet.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        duration,
        isShort,
      });
    }

    return videos;
  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    throw error;
  }
}

// 특정 동영상의 상세 정보 가져오기
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const youtube = getYouTubeClient();
    
    const response = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    } as any);

    const video = response.data.items?.[0];
    if (!video || !video.snippet) return null;

    return {
      id: videoId,
      title: video.snippet.title || '',
      description: video.snippet.description || '',
      thumbnailUrl: getBestThumbnailFromApiResponse(video.snippet.thumbnails),
      publishedAt: video.snippet.publishedAt || '',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

// YouTube 설명에서 블로그 콘텐츠용 텍스트 추출
export function extractContentFromDescription(description: string): {
  excerpt: string;
  content: string;
  hashtags: string[];
} {
  // 설명에서 해시태그 추출
  const hashtagRegex = /#\w+/g;
  const hashtags = (description.match(hashtagRegex) || []).map(tag => tag.slice(1));
  
  // 첫 3줄을 excerpt로 사용
  const lines = description.split('\n').filter(line => line.trim());
  const excerpt = lines.slice(0, 3).join(' ').substring(0, 200);
  
  // 전체 설명을 마크다운으로 변환
  const content = description
    .replace(/\n\n/g, '\n\n') // 단락 유지
    .replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)'); // URL을 링크로 변환
  
  return {
    excerpt,
    content,
    hashtags: hashtags.slice(0, 5), // 최대 5개 태그
  };
}