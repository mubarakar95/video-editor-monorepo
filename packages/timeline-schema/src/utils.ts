import type { TimelineSchema, Timeline, RationalTime, TimeRange, Track, MediaSource } from './types.js';

export function rationalTime(value: number, rate: number): RationalTime {
  if (rate <= 0) {
    throw new Error('Rate must be a positive number');
  }
  return { value, rate };
}

export function timeRange(start: RationalTime, duration: RationalTime): TimeRange {
  if (start.rate !== duration.rate) {
    throw new Error('Start and duration must have the same rate');
  }
  return { start, duration };
}

export function createEmptyTimeline(name: string, frameRate: number): TimelineSchema {
  if (frameRate <= 0) {
    throw new Error('Frame rate must be a positive number');
  }
  const now = new Date().toISOString();
  const timelineId = generateId();
  const timeline: Timeline = {
    id: timelineId,
    name,
    tracks: [],
    transitions: [],
    markers: [],
    metadata: {
      frameRate,
    },
    createdAt: now,
    updatedAt: now,
  };
  return {
    version: '1.0.0',
    timeline,
    sources: [],
  };
}

export function formatTimecode(time: RationalTime, dropFrame = false): string {
  const { value, rate } = time;
  const totalSeconds = value / rate;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (dropFrame && [29.97, 59.94].includes(rate)) {
    const frames = Math.round(value % rate);
    const dropFrameRate = rate === 29.97 ? 30 : 60;
    const dropFrames = rate === 29.97 ? 2 : 4;
    const totalMinutes = hours * 60 + minutes;
    const adjustedFrames = Math.round(frames - dropFrames * Math.floor(totalMinutes));
    const actualFrames = adjustedFrames < 0 ? Math.round(adjustedFrames + dropFrameRate) : adjustedFrames;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)};${pad(actualFrames)}`;
  }
  
  const frames = Math.round(value % rate);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

export function parseTimecode(timecode: string, rate: number): RationalTime {
  const dropFrame = timecode.includes(';');
  const parts = timecode.replace(';', ':').split(':').map(Number);
  
  if (parts.length !== 4) {
    throw new Error('Invalid timecode format. Expected HH:MM:SS:FF or HH:MM:SS;FF');
  }
  
  const [hours, minutes, seconds, frames] = parts;
  
  if (dropFrame && [29.97, 59.94].includes(rate)) {
    const dropFrames = rate === 29.97 ? 2 : 4;
    const totalMinutes = hours * 60 + minutes;
    const adjustedFrames = frames + dropFrames * Math.floor(totalMinutes);
    const totalFrames =
      hours * 3600 * rate +
      minutes * 60 * rate +
      seconds * rate +
      adjustedFrames;
    return { value: Math.round(totalFrames), rate };
  }
  
  const totalFrames = hours * 3600 * rate + minutes * 60 * rate + seconds * rate + frames;
  return { value: Math.round(totalFrames), rate };
}

export function createTrack(
  name: string,
  kind: Track['kind'],
  index: number,
  options?: Partial<Track>
): Track {
  return {
    id: generateId(),
    name,
    kind,
    index,
    clips: [],
    enabled: true,
    locked: false,
    solo: false,
    muted: false,
    ...options,
  };
}

export function createMediaSource(
  name: string,
  path: string,
  sourceType: MediaSource['sourceType'],
  metadata?: MediaSource['metadata']
): MediaSource {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    path,
    sourceType,
    metadata,
    createdAt: now,
    updatedAt: now,
  };
}

export function addTrackToTimeline(
  schema: TimelineSchema,
  track: Track
): TimelineSchema {
  return {
    ...schema,
    timeline: {
      ...schema.timeline,
      tracks: [...schema.timeline.tracks, track].sort((a, b) => a.index - b.index),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addSourceToTimeline(
  schema: TimelineSchema,
  source: MediaSource
): TimelineSchema {
  return {
    ...schema,
    sources: [...schema.sources, source],
  };
}

export function getTimelineDuration(timeline: Timeline): RationalTime {
  let maxValue = 0;
  const rate = timeline.metadata.frameRate;
  
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      const clipEnd = clip.timelineRange.start.value + clip.timelineRange.duration.value;
      if (clipEnd > maxValue) {
        maxValue = clipEnd;
      }
    }
  }
  
  return { value: maxValue, rate };
}

export function resampleTime(time: RationalTime, targetRate: number): RationalTime {
  if (time.rate === targetRate) {
    return time;
  }
  const seconds = time.value / time.rate;
  return { value: seconds * targetRate, rate: targetRate };
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
