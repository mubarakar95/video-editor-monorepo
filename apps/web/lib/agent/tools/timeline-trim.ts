import type { ToolResult } from '@video-editor/shared-types';
import type { TimelineSchema, Clip, Track } from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

function findClip(timeline: TimelineSchema, trackId: string, clipId: string): { track: Track; clip: Clip; clipIndex: number } | null {
  const track = timeline.timeline.tracks.find((t) => t.id === trackId);
  if (!track) return null;

  const clipIndex = track.clips.findIndex((c) => c.id === clipId);
  if (clipIndex === -1) return null;

  return { track, clip: track.clips[clipIndex], clipIndex };
}

function createRationalTime(value: number, rate: number) {
  return { value, rate };
}

export const timelineTrimTool: AgentToolDefinition = {
  name: 'timeline_trim',
  description: 'Trim a clip by adjusting its in/out points. This changes which portion of the source media is used.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the track containing the clip to trim',
      },
      clip_id: {
        type: 'string',
        description: 'The ID of the clip to trim',
      },
      new_start: {
        type: 'number',
        description: 'New start point in source media (in seconds)',
      },
      new_duration: {
        type: 'number',
        description: 'New duration of the clip (in seconds)',
      },
    },
    required: ['track_id', 'clip_id', 'new_start', 'new_duration'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { track_id, clip_id, new_start, new_duration } = args as {
      track_id: string;
      clip_id: string;
      new_start: number;
      new_duration: number;
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const result = findClip(context.timeline, track_id, clip_id);
    if (!result) {
      return { success: false, error: `Clip ${clip_id} not found in track ${track_id}` };
    }

    const { clip, clipIndex } = result;
    const rate = context.timeline.timeline.metadata.frameRate;

    if (new_duration <= 0) {
      return { success: false, error: 'Duration must be greater than 0' };
    }

    const originalSourceStart = clip.sourceRange.start.value / clip.sourceRange.start.rate;
    const originalSourceEnd = originalSourceStart + clip.sourceRange.duration.value / clip.sourceRange.duration.rate;

    if (new_start < 0) {
      return { success: false, error: 'New start cannot be negative' };
    }

    const sourceMedia = context.timeline.sources.find((s) => s.id === clip.sourceId);
    const maxDuration = sourceMedia?.metadata?.duration
      ? sourceMedia.metadata.duration.value / sourceMedia.metadata.duration.rate
      : Infinity;

    if (new_start + new_duration > maxDuration) {
      return { success: false, error: 'Trim extends beyond source media bounds' };
    }

    const timelineStart = clip.timelineRange.start.value / clip.timelineRange.start.rate;
    const newTimelineStart = timelineStart - (originalSourceStart - new_start);

    const updatedClip: Clip = {
      ...clip,
      sourceRange: {
        start: createRationalTime(new_start * rate, rate),
        duration: createRationalTime(new_duration * rate, rate),
      },
      timelineRange: {
        start: createRationalTime(newTimelineStart * rate, rate),
        duration: createRationalTime(new_duration * rate, rate),
      },
      updatedAt: new Date().toISOString(),
    };

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === track_id) {
        const newClips = [...t.clips];
        newClips[clipIndex] = updatedClip;
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
        message: `Trimmed clip ${clip_id}: start=${new_start}s, duration=${new_duration}s`,
        clipId: updatedClip.id,
      },
    };
  },
};

export default timelineTrimTool;
