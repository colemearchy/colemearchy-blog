import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export interface ProcessedTranscript {
  fullText: string;
  chunks: string[];
  duration: number;
  hasTimestamps: boolean;
}

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  thumbnailUrl: string;
}

export class YouTubeTranscriptService {
  /**
   * Fetch transcript for a YouTube video
   */
  async fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
    try {
      // Try to fetch transcript
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'ko', // Try Korean first
      }).catch(() => 
        // Fallback to English if Korean not available
        YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      ).catch(() => 
        // Fallback to any available language
        YoutubeTranscript.fetchTranscript(videoId)
      );

      // Map the response to our TranscriptItem interface
      return transcript.map((item: any) => ({
        text: item.text,
        start: item.start || item.offset || 0,
        duration: item.duration || item.dur || 0
      }));
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      throw new Error('Transcript not available for this video');
    }
  }

  /**
   * Process raw transcript into usable format
   */
  processTranscript(transcript: TranscriptItem[]): ProcessedTranscript {
    // Combine all text
    const fullText = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Calculate total duration
    const duration = transcript.length > 0 
      ? Math.max(...transcript.map(item => item.start + item.duration))
      : 0;

    // Chunk transcript for long videos (4000 characters per chunk)
    const chunks = this.chunkTranscript(fullText, 4000);

    return {
      fullText,
      chunks,
      duration,
      hasTimestamps: transcript.some(item => item.start > 0),
    };
  }

  /**
   * Intelligent chunking that tries to break at sentence boundaries
   */
  private chunkTranscript(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract key moments from transcript with timestamps
   */
  extractKeyMoments(transcript: TranscriptItem[], maxMoments: number = 5): Array<{
    text: string;
    timestamp: number;
    timeString: string;
  }> {
    // Simple implementation: extract evenly distributed moments
    const interval = Math.floor(transcript.length / maxMoments);
    const moments = [];

    for (let i = 0; i < maxMoments && i * interval < transcript.length; i++) {
      const item = transcript[i * interval];
      moments.push({
        text: item.text.slice(0, 100) + '...',
        timestamp: item.start,
        timeString: this.formatTimestamp(item.start),
      });
    }

    return moments;
  }

  /**
   * Format timestamp to YouTube format (e.g., 1:23:45)
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate prompt for Gemini to convert transcript to blog post
   */
  generateBlogPrompt(
    transcript: ProcessedTranscript,
    metadata: YouTubeVideoMetadata,
    chunkIndex?: number
  ): string {
    const chunk = chunkIndex !== undefined 
      ? transcript.chunks[chunkIndex] 
      : transcript.fullText;

    return `
You are Colemearchy, writing a blog post based on a YouTube video.

VIDEO INFORMATION:
- Title: ${metadata.title}
- Channel: ${metadata.channelTitle}
- Published: ${metadata.publishedAt}
- Duration: ${Math.floor(transcript.duration / 60)} minutes

TRANSCRIPT TO CONVERT:
${chunk}

TASK:
1. Transform this video transcript into an engaging blog post
2. Remove filler words, repetitions, and verbal tics
3. Add proper structure with headings and paragraphs
4. Maintain the speaker's key insights and voice
5. Add context and explanations where needed
6. Include relevant quotes from the transcript
7. Make it SEO-friendly with good keyword usage
8. Add a compelling introduction that hooks readers
9. Include a conclusion with key takeaways

IMPORTANT:
- This is ${chunkIndex !== undefined ? `part ${chunkIndex + 1} of ${transcript.chunks.length}` : 'the complete transcript'}
- Maintain the Colemearchy voice and style
- Focus on biohacking, optimization, and practical insights
- Make it valuable for readers who haven't watched the video

Generate a well-structured blog post in Korean.
`;
  }
}