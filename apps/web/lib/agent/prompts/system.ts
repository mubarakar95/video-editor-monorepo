import type { TimelineSchema, AgentState, RationalTime } from '@video-editor/timeline-schema';

export const BASE_SYSTEM_PROMPT = `You are an intelligent video editing assistant powered by GLM-5. You help users edit videos through natural language commands.

CAPABILITIES:
- Split, trim, and arrange clips on the timeline
- Add transitions between clips (cross-dissolve, wipe, fade, etc.)
- Place B-roll footage at specified positions
- Cut clips to match audio rhythm/beats
- Generate captions from audio tracks
- Navigate and modify multi-track timelines

TIMELINE OPERATIONS:
1. timeline_split - Split a clip at a specific position
2. timeline_trim - Adjust clip in/out points
3. timeline_insert - Insert a new clip at a position
4. broll_place - Find and place B-roll footage
5. rhythm_cut - Cut clips to audio beats
6. caption_generate - Create captions from audio
7. transition_add - Add transitions between clips

GUIDELINES:
- Always confirm destructive operations before executing
- Provide clear feedback about what changes were made
- Suggest creative alternatives when appropriate
- Consider timeline context (selected clips, playback position) for smarter edits
- Use precise timing values when specified by the user
- Handle errors gracefully and suggest solutions`;

export const CHAT_MODE_PROMPT = `

CHAT MODE BEHAVIOR:
- Be conversational and helpful
- Explain editing concepts when asked
- Provide step-by-step guidance for complex operations
- Ask clarifying questions when the request is ambiguous
- Offer suggestions for improving the edit
- Remember the conversation context for follow-up commands`;

export const TERMINAL_MODE_PROMPT = `

TERMINAL MODE BEHAVIOR:
- Be concise and command-focused
- Execute operations immediately without lengthy explanations
- Return structured responses suitable for CLI parsing
- Support batch operations when multiple commands are given
- Minimize conversational filler
- Focus on efficiency and precision`;

export function getSystemPrompt(
  source: 'chat' | 'terminal',
  timelineContext?: TimelineSchema | null
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (source === 'chat') {
    prompt += CHAT_MODE_PROMPT;
  } else {
    prompt += TERMINAL_MODE_PROMPT;
  }

  if (timelineContext) {
    const { timeline, sources, agentState } = timelineContext;
    const trackSummary = timeline.tracks.map((track) => {
      const clipCount = track.clips.length;
      const trackDuration = track.clips.reduce((max, clip) => {
        const end = clip.timelineRange.start.value / clip.timelineRange.start.rate +
          clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
        return Math.max(max, end);
      }, 0);
      return `${track.kind}[${track.index}]: ${clipCount} clips, ${trackDuration.toFixed(1)}s`;
    }).join('\n');

    const selectedClips = agentState?.context?.selectedClipIds?.length || 0;
    const selectedTracks = agentState?.context?.selectedTrackIds?.length || 0;
    const playbackPos = agentState?.context?.playbackPosition;

    prompt += `

CURRENT TIMELINE CONTEXT:
Project: ${timeline.name}
Duration: ${timeline.tracks.reduce((max, track) => {
  const trackEnd = track.clips.reduce((tMax, clip) => {
    const end = clip.timelineRange.start.value / clip.timelineRange.start.rate +
      clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
    return Math.max(tMax, end);
  }, 0);
  return Math.max(max, trackEnd);
}, 0).toFixed(1)}s
Frame Rate: ${timeline.metadata.frameRate}fps
Resolution: ${timeline.metadata.width || '?'}x${timeline.metadata.height || '?'}

Tracks:
${trackSummary}

Sources Available: ${sources.length} media files
${selectedClips > 0 ? `Selected Clips: ${selectedClips}` : ''}
${selectedTracks > 0 ? `Selected Tracks: ${selectedTracks}` : ''}
${playbackPos ? `Playback Position: ${(playbackPos.value / playbackPos.rate).toFixed(2)}s` : ''}`;
  }

  return prompt;
}

export function formatTimelineSummary(timeline: TimelineSchema): string {
  const trackSummaries = timeline.timeline.tracks.map((track) => {
    const clips = track.clips.map((clip) => {
      const start = clip.timelineRange.start.value / clip.timelineRange.start.rate;
      const duration = clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
      return `    - ${clip.name}: ${start.toFixed(1)}s - ${(start + duration).toFixed(1)}s`;
    });
    return `${track.kind.toUpperCase()} Track ${track.index}:\n${clips.join('\n')}`;
  });

  return `Timeline: ${timeline.timeline.name}
${trackSummaries.join('\n')}`;
}

export function formatTimestamp(time: RationalTime): string {
  const seconds = time.value / time.rate;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
}
