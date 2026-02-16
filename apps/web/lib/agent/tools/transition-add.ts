import type { ToolResult } from '@video-editor/shared-types';
import type {
  TimelineSchema,
  TransitionType,
  Transition,
  EffectParameter,
} from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

function createRationalTime(value: number, rate: number) {
  return { value, rate };
}

function generateId(): string {
  return `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const TRANSITION_TYPES: TransitionType[] = [
  'cross-dissolve',
  'dip',
  'wipe',
  'fade',
  'push',
  'slide',
  'zoom',
];

export const transitionAddTool: AgentToolDefinition = {
  name: 'transition_add',
  description: 'Add a transition between two clips on the same track. Creates smooth visual transitions like cross-dissolve, wipe, or fade.',
  parameters: {
    type: 'object',
    properties: {
      track_id: {
        type: 'string',
        description: 'The ID of the track containing both clips',
      },
      clip_a_id: {
        type: 'string',
        description: 'The ID of the first clip (outgoing)',
      },
      clip_b_id: {
        type: 'string',
        description: 'The ID of the second clip (incoming)',
      },
      transition_type: {
        type: 'string',
        description: 'Type of transition to apply',
        enum: ['cross-dissolve', 'dip', 'wipe', 'fade', 'push', 'slide', 'zoom'],
        default: 'cross-dissolve',
      },
      duration: {
        type: 'number',
        description: 'Duration of the transition in seconds',
        default: 0.5,
      },
    },
    required: ['track_id', 'clip_a_id', 'clip_b_id'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const {
      track_id,
      clip_a_id,
      clip_b_id,
      transition_type = 'cross-dissolve',
      duration = 0.5,
    } = args as {
      track_id: string;
      clip_a_id: string;
      clip_b_id: string;
      transition_type?: TransitionType;
      duration?: number;
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

    const clipAIndex = track.clips.findIndex((c) => c.id === clip_a_id);
    const clipBIndex = track.clips.findIndex((c) => c.id === clip_b_id);

    if (clipAIndex === -1) {
      return { success: false, error: `Clip ${clip_a_id} not found in track` };
    }
    if (clipBIndex === -1) {
      return { success: false, error: `Clip ${clip_b_id} not found in track` };
    }

    if (Math.abs(clipAIndex - clipBIndex) !== 1) {
      return {
        success: false,
        error: 'Clips must be adjacent to add a transition',
      };
    }

    const clipA = track.clips[clipAIndex];
    const clipB = track.clips[clipBIndex];

    const clipAEnd = clipA.timelineRange.start.value / clipA.timelineRange.start.rate +
      clipA.timelineRange.duration.value / clipA.timelineRange.duration.rate;
    const clipBStart = clipB.timelineRange.start.value / clipB.timelineRange.start.rate;

    const gap = clipBStart - clipAEnd;
    if (Math.abs(gap) > duration) {
      return {
        success: false,
        error: 'Clips are not adjacent enough for a transition',
      };
    }

    const rate = context.timeline.timeline.metadata.frameRate;
    const transitionId = generateId();

    const parameters: EffectParameter[] = [];

    if (transition_type === 'dip') {
      parameters.push({
        name: 'dipColor',
        type: 'color',
        value: { r: 0, g: 0, b: 0, a: 1 },
      } as EffectParameter);
    }

    if (transition_type === 'wipe') {
      parameters.push({
        name: 'wipeDirection',
        type: 'enum',
        value: 'left',
        enumValues: ['left', 'right', 'up', 'down'],
      } as EffectParameter);
    }

    const transition: Transition = {
      id: transitionId,
      name: `${transition_type} (${clipA.name} → ${clipB.name})`,
      transitionType: transition_type,
      duration: createRationalTime(duration * rate, rate),
      fromClipId: clip_a_id,
      toClipId: clip_b_id,
      parameters,
    };

    const halfDuration = duration / 2;
    const updatedClips = track.clips.map((clip, index) => {
      if (index === clipAIndex) {
        return {
          ...clip,
          timelineRange: {
            ...clip.timelineRange,
            duration: createRationalTime(
              clip.timelineRange.duration.value / clip.timelineRange.duration.rate + halfDuration,
              rate
            ),
          },
          updatedAt: new Date().toISOString(),
        };
      }
      if (index === clipBIndex) {
        return {
          ...clip,
          timelineRange: {
            ...clip.timelineRange,
            start: createRationalTime(
              clip.timelineRange.start.value / clip.timelineRange.start.rate - halfDuration,
              rate
            ),
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return clip;
    });

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === track_id) {
        return { ...t, clips: updatedClips };
      }
      return t;
    });

    const updatedTransitions = [...context.timeline.timeline.transitions, transition];

    const updatedTimeline: TimelineSchema = {
      ...context.timeline,
      timeline: {
        ...context.timeline.timeline,
        tracks: updatedTracks,
        transitions: updatedTransitions,
        updatedAt: new Date().toISOString(),
      },
    };

    context.updateTimeline(updatedTimeline);

    return {
      success: true,
      data: {
        message: `Added ${transition_type} transition between "${clipA.name}" and "${clipB.name}" (${duration}s)`,
        transitionId,
        transitionType: transition_type,
        duration,
        fromClipId: clip_a_id,
        toClipId: clip_b_id,
      },
    };
  },
};

export default transitionAddTool;
