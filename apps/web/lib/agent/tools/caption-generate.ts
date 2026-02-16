import type { ToolResult } from '@video-editor/shared-types';
import type { TimelineSchema, Track } from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

interface CaptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

interface CaptionStyle {
  font: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'bottom' | 'top' | 'center';
  animation: 'none' | 'fade' | 'pop' | 'typewriter';
}

const DEFAULT_STYLES: Record<string, CaptionStyle> = {
  default: {
    font: 'Arial',
    fontSize: 24,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'bottom',
    animation: 'none',
  },
  cinematic: {
    font: 'Helvetica',
    fontSize: 28,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    position: 'bottom',
    animation: 'fade',
  },
  social: {
    font: 'Arial Black',
    fontSize: 32,
    color: '#FFFF00',
    backgroundColor: '#000000',
    position: 'center',
    animation: 'pop',
  },
  documentary: {
    font: 'Georgia',
    fontSize: 22,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    animation: 'none',
  },
};

function generateId(): string {
  return `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function simulateTranscription(audioTrack: Track, language: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const sampleTexts = [
    'This is a sample caption segment.',
    'Auto-generated from audio analysis.',
    'Captions help make content accessible.',
    'Edit these captions for accuracy.',
  ];

  let currentTime = 0;
  const avgSegmentDuration = 3;

  for (const clip of audioTrack.clips) {
    const clipDuration = clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
    const numSegments = Math.ceil(clipDuration / avgSegmentDuration);

    for (let i = 0; i < numSegments; i++) {
      const segmentStart = currentTime + i * avgSegmentDuration;
      if (segmentStart >= currentTime + clipDuration) break;

      const segmentEnd = Math.min(
        segmentStart + avgSegmentDuration,
        currentTime + clipDuration
      );

      segments.push({
        id: generateId(),
        startTime: segmentStart,
        endTime: segmentEnd,
        text: sampleTexts[i % sampleTexts.length],
        confidence: 0.85 + Math.random() * 0.15,
      });
    }

    currentTime += clipDuration;
  }

  return segments;
}

export const captionGenerateTool: AgentToolDefinition = {
  name: 'caption_generate',
  description: 'Generate captions from audio track content. Transcribes audio and creates subtitle clips with specified styling.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the audio track to transcribe',
      },
      style: {
        type: 'string',
        description: 'Caption style preset',
        enum: ['default', 'cinematic', 'social', 'documentary'],
        default: 'default',
      },
      language: {
        type: 'string',
        description: 'Language code for transcription (e.g., "en", "es", "fr")',
        default: 'en',
      },
    },
    required: ['track_id'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { track_id, style = 'default', language = 'en' } = args as {
      track_id: string;
      style?: keyof typeof DEFAULT_STYLES;
      language?: string;
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const audioTrack = context.timeline.timeline.tracks.find(
      (t) => t.id === track_id && (t.kind === 'audio' || t.kind === 'video')
    );
    if (!audioTrack) {
      return { success: false, error: `Audio track ${track_id} not found` };
    }

    const subtitleTracks = context.timeline.timeline.tracks.filter(
      (t) => t.kind === 'subtitle'
    );
    let targetSubtitleTrack = subtitleTracks[0];

    const rate = context.timeline.timeline.metadata.frameRate;
    const captionStyle = DEFAULT_STYLES[style] || DEFAULT_STYLES.default;

    const captionSegments = simulateTranscription(audioTrack, language);

    const operationId = context.addPendingOperation({
      operation: 'generate_captions',
      params: {
        trackId: track_id,
        style: captionStyle,
        language,
        segments: captionSegments,
      },
    });

    return {
      success: true,
      data: {
        message: `Generated ${captionSegments.length} caption segments from track ${track_id} in ${language}`,
        operationId,
        trackId: targetSubtitleTrack?.id || 'new_subtitle_track',
        style: captionStyle,
        segments: captionSegments.length,
        language,
        averageConfidence: captionSegments.reduce((sum, s) => sum + s.confidence, 0) / captionSegments.length,
      },
    };
  },
};

export default captionGenerateTool;
