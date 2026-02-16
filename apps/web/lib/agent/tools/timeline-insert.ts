import type { ToolResult } from '@video-editor/shared-types';
import type { TimelineSchema, Clip, TimeRange, Track } from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

function createRationalTime(value: number, rate: number) {
  return { value, rate };
}

function generateId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const timelineInsertTool: AgentToolDefinition = {
  name: 'timeline_insert',
  description: 'Insert a clip at a specific position on a track. Creates a new clip in the timeline.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the track to insert the clip into',
      },
      clip: {
        type: 'object',
        description: 'The clip object to insert',
        properties: {
          source_id: { type: 'string', description: 'Source media ID' },
          name: { type: 'string', description: 'Clip name' },
          source_start: { type: 'number', description: 'Start point in source media (seconds)' },
          source_duration: { type: 'number', description: 'Duration in source media (seconds)' },
        },
      },
      position: {
        type: 'number',
        description: 'Timeline position to insert the clip (in seconds)',
      },
    },
    required: ['track_id', 'clip', 'position'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { track_id, clip: clipData, position } = args as {
      track_id: string;
      clip: {
        source_id: string;
        name?: string;
        source_start: number;
        source_duration: number;
      };
      position: number;
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const track = context.timeline.timeline.tracks.find((t) => t.id === track_id);
    if (!track) {
      return { success: false, error: `Track ${track_id} not found` };
    }

    if (track.locked) {
      return { success: false, error: `Track ${track_id} is locked` };
    }

    const source = context.timeline.sources.find((s) => s.id === clipData.source_id);
    if (!source) {
      return { success: false, error: `Source ${clipData.source_id} not found` };
    }

    const rate = context.timeline.timeline.metadata.frameRate;
    const clipId = generateId();

    const sourceRange: TimeRange = {
      start: createRationalTime(clipData.source_start * rate, rate),
      duration: createRationalTime(clipData.source_duration * rate, rate),
    };

    const timelineRange: TimeRange = {
      start: createRationalTime(position * rate, rate),
      duration: createRationalTime(clipData.source_duration * rate, rate),
    };

    const newClip: Clip = {
      id: clipId,
      name: clipData.name || source.name,
      sourceId: clipData.source_id,
      sourceRange,
      timelineRange,
      state: 'active',
      effects: [],
      markers: [],
      properties: {
        opacity: 1,
        volume: 1,
        speed: 1,
        audioEnabled: true,
        videoEnabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const insertIndex = track.clips.findIndex((c) => {
      const clipStart = c.timelineRange.start.value / c.timelineRange.start.rate;
      return clipStart > position;
    });

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === track_id) {
        const newClips = [...t.clips];
        if (insertIndex === -1) {
          newClips.push(newClip);
        } else {
          newClips.splice(insertIndex, 0, newClip);
        }
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
        message: `Inserted clip "${newClip.name}" at position ${position}s on track ${track_id}`,
        clipId: newClip.id,
      },
    };
  },
};

export default timelineInsertTool;
