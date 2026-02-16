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

export const timelineSplitTool: AgentToolDefinition = {
  name: 'timeline_split',
  description: 'Split a clip at a specific position on the timeline. This creates two clips from one, split at the specified time position.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the track containing the clip to split',
      },
      clip_id: {
        type: 'string',
        description: 'The ID of the clip to split',
      },
      position: {
        type: 'number',
        description: 'The timeline position (in seconds) where to split the clip',
      },
    },
    required: ['track_id', 'clip_id', 'position'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { track_id, clip_id, position } = args as {
      track_id: string;
      clip_id: string;
      position: number;
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const result = findClip(context.timeline, track_id, clip_id);
    if (!result) {
      return { success: false, error: `Clip ${clip_id} not found in track ${track_id}` };
    }

    const { track, clip, clipIndex } = result;
    const rate = context.timeline.timeline.metadata.frameRate;
    const timelineStart = clip.timelineRange.start.value / clip.timelineRange.start.rate;
    const timelineEnd = timelineStart + clip.timelineRange.duration.value / clip.timelineRange.duration.rate;

    if (position <= timelineStart || position >= timelineEnd) {
      return { success: false, error: 'Split position must be within the clip bounds' };
    }

    const sourceStart = clip.sourceRange.start.value / clip.sourceRange.start.rate;
    const sourceDuration = clip.sourceRange.duration.value / clip.sourceRange.duration.rate;
    const splitRatio = (position - timelineStart) / (timelineEnd - timelineStart);

    const clip1Duration = (position - timelineStart) * rate;
    const clip2Duration = (timelineEnd - position) * rate;
    const sourceSplitPoint = sourceStart + sourceDuration * splitRatio;

    const newClip1: Clip = {
      ...clip,
      id: `${clip.id}_split_1`,
      timelineRange: {
        start: clip.timelineRange.start,
        duration: createRationalTime(clip1Duration, rate),
      },
      sourceRange: {
        start: clip.sourceRange.start,
        duration: createRationalTime(sourceDuration * splitRatio * rate, rate),
      },
      updatedAt: new Date().toISOString(),
    };

    const newClip2: Clip = {
      ...clip,
      id: `${clip.id}_split_2`,
      timelineRange: {
        start: createRationalTime(position * rate, rate),
        duration: createRationalTime(clip2Duration, rate),
      },
      sourceRange: {
        start: createRationalTime(sourceSplitPoint * rate, rate),
        duration: createRationalTime(sourceDuration * (1 - splitRatio) * rate, rate),
      },
      updatedAt: new Date().toISOString(),
    };

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === track_id) {
        const newClips = [...t.clips];
        newClips.splice(clipIndex, 1, newClip1, newClip2);
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
        message: `Split clip ${clip_id} at position ${position}s`,
        newClips: [newClip1.id, newClip2.id],
      },
    };
  },
};

export default timelineSplitTool;
