import { google } from 'googleapis';

// YouTube API 클라이언트 초기화
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
}

// 채널의 최신 동영상 가져오기
export async function getChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    
    if (!channelId) {
      throw new Error('YouTube Channel ID not configured');
    }

    // 채널의 업로드 플레이리스트 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    } as any);

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist');
    }

    // 플레이리스트의 동영상 목록 가져오기 (order는 playlistItems에서 지원하지 않음)
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults,
    } as any);

    const videos: YouTubeVideo[] = [];
    
    for (const item of playlistResponse.data.items || []) {
      const snippet = item.snippet;
      if (!snippet) continue;
      
      const videoId = snippet.resourceId?.videoId;
      if (!videoId) continue;
      
      videos.push({
        id: videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        publishedAt: snippet.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    }

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

// 특정 동영상의 상세 정보 가져오기
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
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
      thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
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