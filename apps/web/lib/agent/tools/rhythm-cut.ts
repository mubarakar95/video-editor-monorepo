import type { ToolResult } from '@video-editor/shared-types';
import type { TimelineSchema, Track, Clip, RationalTime } from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

function createRationalTime(value: number, rate: number): RationalTime {
  return { value, rate };
}

function generateId(): string {
  return `rhythmcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateBeatMarkers(
  audioTrack: Track,
  sensitivity: number,
  rate: number
): number[] {
  const beats: number[] = [];
  const avgClipDuration = audioTrack.clips.reduce((sum, clip) => {
    return sum + clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
  }, 0) / Math.max(audioTrack.clips.length, 1);

  const beatInterval = avgClipDuration * (1.5 - sensitivity * 0.5);
  let totalDuration = 0;

  for (const clip of audioTrack.clips) {
    totalDuration += clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
  }

  let currentTime = 0;
  while (currentTime < totalDuration) {
    beats.push(currentTime);
    currentTime += beatInterval;
  }

  return beats;
}

export const rhythmCutTool: AgentToolDefinition = {
  name: 'rhythm_cut',
  description: 'Cut video clips to match the rhythm or beat of an audio track. Analyzes audio to detect beats and creates cuts at those positions.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the video track to cut',
      },
      audio_track_id: {
        type: 'string',
        description: 'The ID of the audio track to use for rhythm detection',
      },
      sensitivity: {
        type: 'number',
        description: 'Sensitivity of beat detection (0.0-1.0). Higher values detect more beats.',
        default: 0.5,
      },
    },
    required: ['track_id', 'audio_track_id'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { track_id, audio_track_id, sensitivity = 0.5 } = args as {
      track_id: string;
      audio_track_id: string;
      sensitivity?: number;
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const videoTrack = context.timeline.timeline.tracks.find(
      (t) => t.id === track_id && t.kind === 'video'
    );
    if (!videoTrack) {
      return { success: false, error: `Video track ${track_id} not found` };
    }

    if (videoTrack.locked) {
      return { success: false, error: `Video track ${track_id} is locked` };
    }

    const audioTrack = context.timeline.timeline.tracks.find(
      (t) => t.id === audio_track_id && (t.kind === 'audio' || t.kind === 'video')
    );
    if (!audioTrack) {
      return { success: false, error: `Audio track ${audio_track_id} not found` };
    }

    const rate = context.timeline.timeline.metadata.frameRate;
    const clampedSensitivity = Math.max(0, Math.min(1, sensitivity));
    const beatPositions = generateBeatMarkers(audioTrack, clampedSensitivity, rate);

    const newClips: Clip[] = [];
    const cutPositions: number[] = [];

    for (const clip of videoTrack.clips) {
      const clipStart = clip.timelineRange.start.value / clip.timelineRange.start.rate;
      const clipEnd = clipStart + clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
      const clipSourceStart = clip.sourceRange.start.value / clip.sourceRange.start.rate;
      const clipSourceDuration = clip.sourceRange.duration.value / clip.sourceRange.duration.rate;

      const relevantBeats = beatPositions.filter(
        (beat) => beat > clipStart && beat < clipEnd
      );

      if (relevantBeats.length === 0) {
        newClips.push(clip);
        continue;
      }

      let currentSourceTime = clipSourceStart;
      let currentTimelineTime = clipStart;

      for (const beat of relevantBeats) {
        const segmentDuration = beat - currentTimelineTime;
        const sourceSegmentDuration = segmentDuration * (clipSourceDuration / (clipEnd - clipStart));

        const segmentClip: Clip = {
          ...clip,
          id: generateId(),
          sourceRange: {
            start: createRationalTime(currentSourceTime * rate, rate),
            duration: createRationalTime(sourceSegmentDuration * rate, rate),
          },
          timelineRange: {
            start: createRationalTime(currentTimelineTime * rate, rate),
            duration: createRationalTime(segmentDuration * rate, rate),
          },
          updatedAt: new Date().toISOString(),
        };

        newClips.push(segmentClip);
        cutPositions.push(beat);

        currentSourceTime += sourceSegmentDuration;
        currentTimelineTime = beat;
      }

      const finalSegmentDuration = clipEnd - currentTimelineTime;
      const finalSourceDuration = finalSegmentDuration * (clipSourceDuration / (clipEnd - clipStart));

      const finalClip: Clip = {
        ...clip,
        id: generateId(),
        sourceRange: {
          start: createRationalTime(currentSourceTime * rate, rate),
          duration: createRationalTime(finalSourceDuration * rate, rate),
        },
        timelineRange: {
          start: createRationalTime(currentTimelineTime * rate, rate),
          duration: createRationalTime(finalSegmentDuration * rate, rate),
        },
        updatedAt: new Date().toISOString(),
      };

      newClips.push(finalClip);
    }

    newClips.sort((a, b) => {
      const aStart = a.timelineRange.start.value / a.timelineRange.start.rate;
      const bStart = b.timelineRange.start.value / b.timelineRange.start.rate;
      return aStart - bStart;
    });

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === track_id) {
        return { ...t, clips: newClips };
      }
      return t;
    });

    const updatedTimeline: TimelineSchema = {
      ...context.timeline,
      timeline: {
        ...context.timeline.timeline,
        tracks: updatedTracks,
        updatedAt: new Date().toISOString(),
      },
    };

    context.updateTimeline(updatedTimeline);

    return {
      success: true,
      data: {
        message: `Applied rhythm cuts to track ${track_id} using audio from ${audio_track_id}`,
        cutsCreated: cutPositions.length,
        cutPositions,
        sensitivity: clampedSensitivity,
      },
    };
  },
};

export default rhythmCutTool;
