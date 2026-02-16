import type { ToolResult } from '@video-editor/shared-types';
import type { TimelineSchema, Clip, TransitionType } from '@video-editor/timeline-schema';
import type { AgentToolDefinition, ToolContext } from './types';

interface BRollCandidate {
  sourceId: string;
  name: string;
  relevanceScore: number;
  duration: number;
}

function createRationalTime(value: number, rate: number) {
  return { value, rate };
}

function generateId(): string {
  return `broll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findBRollCandidates(
  query: string,
  sources: TimelineSchema['sources']
): BRollCandidate[] {
  const candidates: BRollCandidate[] = [];
  const queryLower = query.toLowerCase();

  for (const source of sources) {
    const nameLower = source.name.toLowerCase();
    const relevanceScore = calculateRelevance(queryLower, nameLower);
    
    if (relevanceScore > 0) {
      candidates.push({
        sourceId: source.id,
        name: source.name,
        relevanceScore,
        duration: source.metadata?.duration
          ? source.metadata.duration.value / source.metadata.duration.rate
          : 5,
      });
    }
  }

  return candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateRelevance(query: string, text: string): number {
  const queryWords = query.split(/\s+/);
  let score = 0;

  for (const word of queryWords) {
    if (text.includes(word)) {
      score += 1;
    }
  }

  return score;
}

export const brollPlaceTool: AgentToolDefinition = {
  name: 'broll_place',
  description: 'Find and place B-roll footage at a specified position. Searches available media sources for relevant B-roll content.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query describing the desired B-roll content (e.g., "city skyline", "nature landscape")',
      },
      position: {
        type: 'number',
        description: 'Timeline position to place the B-roll (in seconds)',
      },
      duration: {
        type: 'number',
        description: 'Desired duration of the B-roll clip (in seconds)',
      },
      transition_type: {
        type: 'string',
        description: 'Type of transition to apply',
        enum: ['cross-dissolve', 'cut', 'fade', 'dip'],
        default: 'cross-dissolve',
      },
    },
    required: ['query', 'position'],
  },
  execute: async (
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { query, position, duration = 5, transition_type = 'cross-dissolve' } = args as {
      query: string;
      position: number;
      duration?: number;
      transition_type?: 'cross-dissolve' | 'cut' | 'fade' | 'dip';
    };

    if (!context.timeline) {
      return { success: false, error: 'No timeline available' };
    }

    const videoTracks = context.timeline.timeline.tracks.filter(
      (t) => t.kind === 'video' && !t.locked
    );

    if (videoTracks.length === 0) {
      return { success: false, error: 'No available video tracks for B-roll placement' };
    }

    const candidates = findBRollCandidates(query, context.timeline.sources);

    if (candidates.length === 0) {
      return {
        success: false,
        error: `No B-roll footage found matching "${query}"`,
      };
    }

    const bestMatch = candidates[0];
    const targetTrack = videoTracks[0];
    const rate = context.timeline.timeline.metadata.frameRate;
    const clipId = generateId();

    const actualDuration = Math.min(duration, bestMatch.duration);

    const newClip: Clip = {
      id: clipId,
      name: `[B-Roll] ${bestMatch.name}`,
      sourceId: bestMatch.sourceId,
      sourceRange: {
        start: createRationalTime(0, rate),
        duration: createRationalTime(actualDuration * rate, rate),
      },
      timelineRange: {
        start: createRationalTime(position * rate, rate),
        duration: createRationalTime(actualDuration * rate, rate),
      },
      state: 'active',
      effects: [],
      markers: [],
      properties: {
        opacity: 1,
        volume: 0,
        speed: 1,
        audioEnabled: false,
        videoEnabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const insertIndex = targetTrack.clips.findIndex((c) => {
      const clipStart = c.timelineRange.start.value / c.timelineRange.start.rate;
      return clipStart > position;
    });

    const updatedTracks = context.timeline.timeline.tracks.map((t) => {
      if (t.id === targetTrack.id) {
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

    const operationId = context.addPendingOperation({
      operation: 'apply_transition',
      params: {
        clipId,
        transitionType: transition_type,
        position,
        duration: transition_type !== 'cut' ? 0.5 : 0,
      },
    });

    return {
      success: true,
      data: {
        message: `Placed B-roll "${bestMatch.name}" at ${position}s for ${actualDuration}s with ${transition_type} transition`,
        clipId,
        sourceId: bestMatch.sourceId,
        transitionOperationId: operationId,
        candidatesFound: candidates.length,
      },
    };
  },
};

export default brollPlaceTool;
