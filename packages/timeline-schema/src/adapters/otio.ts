import type {
  TimelineSchema,
  Timeline,
  Track,
  Clip,
  MediaSource,
  RationalTime,
  TimeRange,
  Effect,
  Transition,
  Marker,
} from '../types.js';

interface OTIOObject {
  OTIO_SCHEMA?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

interface OTIORationalTime {
  value: number;
  rate: number;
}

interface OTIOTimeRange {
  start_time: OTIORationalTime;
  duration: OTIORationalTime;
}

interface OTIOClip extends OTIOObject {
  OTIO_SCHEMA: 'Clip.1';
  name: string;
  source_range?: OTIOTimeRange;
  media_reference?: OTIOMediaReference;
  effects?: OTIOEffect[];
  markers?: OTIOMarker[];
  metadata?: Record<string, unknown>;
}

interface OTIOGap extends OTIOObject {
  OTIO_SCHEMA: 'Gap.1';
  source_range: OTIOTimeRange;
}

interface OTIOTrack extends OTIOObject {
  OTIO_SCHEMA: 'Track.1';
  name: string;
  kind: string;
  children: Array<OTIOClip | OTIOGap>;
  effects?: OTIOEffect[];
  metadata?: Record<string, unknown>;
}

interface OTIOTimeline extends OTIOObject {
  OTIO_SCHEMA: 'Timeline.1';
  name: string;
  global_start_time?: OTIORationalTime;
  tracks: OTIOTrack[];
  metadata?: Record<string, unknown>;
}

interface OTIOMediaReference extends OTIOObject {
  OTIO_SCHEMA: 'MediaReference.1' | 'ExternalReference.1';
  name?: string;
  available_range?: OTIOTimeRange;
  target_url?: string;
  metadata?: Record<string, unknown>;
}

interface OTIOEffect extends OTIOObject {
  OTIO_SCHEMA: 'Effect.1';
  name: string;
  effect_name: string;
  metadata?: Record<string, unknown>;
}

interface OTIOMarker extends OTIOObject {
  OTIO_SCHEMA: 'Marker.1';
  name: string;
  marked_range: OTIOTimeRange;
  color?: string;
  comment?: string;
}

interface OTIOSerializableCollection extends OTIOObject {
  OTIO_SCHEMA: 'SerializableCollection.1';
  children: OTIOTimeline[];
  metadata?: Record<string, unknown>;
}

function convertOTIORationalTime(otio: OTIORationalTime): RationalTime {
  return { value: otio.value, rate: otio.rate };
}

function convertOTIOTimeRange(otio: OTIOTimeRange): TimeRange {
  return {
    start: convertOTIORationalTime(otio.start_time),
    duration: convertOTIORationalTime(otio.duration),
  };
}

function convertOTIOKind(kind: string): Track['kind'] {
  const kindMap: Record<string, Track['kind']> = {
    Video: 'video',
    Audio: 'audio',
    subtitle: 'subtitle',
    data: 'data',
  };
  return kindMap[kind] ?? 'video';
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function convertOTIOClip(
  clip: OTIOClip,
  trackStartTime: RationalTime,
  sources: Map<string, MediaSource>
): { clip: Clip; endTime: RationalTime } | null {
  const now = new Date().toISOString();
  const sourceRange = clip.source_range
    ? convertOTIOTimeRange(clip.source_range)
    : null;
  
  if (!sourceRange) return null;
  
  let sourceId = '';
  const mediaRef = clip.media_reference;
  
  if (mediaRef && mediaRef.target_url) {
    const existingSource = sources.get(mediaRef.target_url);
    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      const newSource: MediaSource = {
        id: generateId(),
        name: mediaRef.name ?? clip.name ?? 'Unknown',
        path: mediaRef.target_url,
        sourceType: 'file',
        metadata: mediaRef.available_range
          ? { duration: convertOTIOTimeRange(mediaRef.available_range).duration }
          : undefined,
        createdAt: now,
        updatedAt: now,
      };
      sources.set(mediaRef.target_url, newSource);
      sourceId = newSource.id;
    }
  }
  
  const clipId = generateId();
  const convertedClip: Clip = {
    id: clipId,
    name: clip.name ?? 'Untitled Clip',
    sourceId,
    sourceRange,
    timelineRange: {
      start: trackStartTime,
      duration: sourceRange.duration,
    },
    state: 'active',
    effects: (clip.effects ?? []).map((e) => convertOTIOEffect(e)),
    markers: (clip.markers ?? []).map((m) => convertOTIOMarker(m)),
    properties: {},
    createdAt: now,
    updatedAt: now,
  };
  
  return {
    clip: convertedClip,
    endTime: {
      value: trackStartTime.value + sourceRange.duration.value,
      rate: trackStartTime.rate,
    },
  };
}

function convertOTIOGap(
  gap: OTIOGap,
  trackStartTime: RationalTime
): { duration: RationalTime } {
  const duration = convertOTIORationalTime(gap.source_range.duration);
  return { duration };
}

function convertOTIOEffect(effect: OTIOEffect): Effect {
  return {
    id: generateId(),
    name: effect.name ?? effect.effect_name ?? 'Unknown Effect',
    effectType: 'filter',
    enabled: true,
    parameters: [],
  };
}

function convertOTIOMarker(marker: OTIOMarker): Marker {
  return {
    id: generateId(),
    name: marker.name ?? 'Marker',
    time: convertOTIORationalTime(marker.marked_range.start_time),
    duration: convertOTIORationalTime(marker.marked_range.duration),
    color: marker.color,
    comment: marker.comment,
  };
}

function convertOTIOTrack(
  track: OTIOTrack,
  index: number,
  sources: Map<string, MediaSource>
): Track {
  const now = new Date().toISOString();
  const clips: Clip[] = [];
  let currentTime: RationalTime = { value: 0, rate: 24 };
  
  for (const child of track.children) {
    if (child.OTIO_SCHEMA === 'Clip.1') {
      const result = convertOTIOClip(child as OTIOClip, currentTime, sources);
      if (result) {
        clips.push(result.clip);
        currentTime = result.endTime;
      }
    } else if (child.OTIO_SCHEMA === 'Gap.1') {
      const gap = child as OTIOGap;
      const gapInfo = convertOTIOGap(gap, currentTime);
      currentTime = {
        value: currentTime.value + gapInfo.duration.value,
        rate: gapInfo.duration.rate,
      };
    }
  }
  
  return {
    id: generateId(),
    name: track.name ?? `Track ${index + 1}`,
    kind: convertOTIOKind(track.kind),
    index,
    clips,
    enabled: true,
    locked: false,
    solo: false,
    muted: false,
  };
}

function detectFrameRate(timeline: OTIOTimeline): number {
  for (const track of timeline.tracks) {
    for (const child of track.children) {
      if (child.OTIO_SCHEMA === 'Clip.1') {
        const clip = child as OTIOClip;
        if (clip.source_range) {
          return clip.source_range.duration.rate;
        }
      }
    }
  }
  return 24;
}

export function fromOTIO(otioJson: unknown): TimelineSchema {
  const now = new Date().toISOString();
  const sources = new Map<string, MediaSource>();
  
  let otioTimeline: OTIOTimeline | null = null;
  
  if (typeof otioJson === 'object' && otioJson !== null) {
    const obj = otioJson as Record<string, unknown>;
    if (obj['OTIO_SCHEMA'] === 'Timeline.1') {
      otioTimeline = obj as unknown as OTIOTimeline;
    } else if (obj['OTIO_SCHEMA'] === 'SerializableCollection.1') {
      const collection = obj as unknown as OTIOSerializableCollection;
      otioTimeline = collection.children[0] ?? null;
    }
  }
  
  if (!otioTimeline) {
    throw new Error('Invalid OpenTimelineIO JSON: expected Timeline or SerializableCollection');
  }
  
  const frameRate = detectFrameRate(otioTimeline);
  const tracks = otioTimeline.tracks.map((track, index) =>
    convertOTIOTrack(track, index, sources)
  );
  
  const timeline: Timeline = {
    id: generateId(),
    name: otioTimeline.name ?? 'Untitled Timeline',
    tracks,
    transitions: [],
    markers: [],
    metadata: {
      frameRate,
      startTime: otioTimeline.global_start_time
        ? convertOTIORationalTime(otioTimeline.global_start_time)
        : undefined,
    },
    createdAt: now,
    updatedAt: now,
  };
  
  return {
    version: '1.0.0',
    timeline,
    sources: Array.from(sources.values()),
  };
}

function convertToOTIORationalTime(time: RationalTime): OTIORationalTime {
  return { value: time.value, rate: time.rate };
}

function convertToOTIOTimeRange(range: TimeRange): OTIOTimeRange {
  return {
    start_time: convertToOTIORationalTime(range.start),
    duration: convertToOTIORationalTime(range.duration),
  };
}

function convertToOTIOTrack(track: Track, sources: MediaSource[]): OTIOTrack {
  const children: Array<OTIOClip | OTIOGap> = [];
  
  for (const clip of track.clips) {
    const source = sources.find((s) => s.id === clip.sourceId);
    const otioClip: OTIOClip = {
      OTIO_SCHEMA: 'Clip.1',
      name: clip.name,
      source_range: convertToOTIOTimeRange(clip.sourceRange),
      media_reference: source
        ? {
            OTIO_SCHEMA: 'ExternalReference.1',
            name: source.name,
            target_url: source.path,
          }
        : undefined,
      effects: clip.effects.map((e) => ({
        OTIO_SCHEMA: 'Effect.1',
        name: e.name,
        effect_name: e.name,
      })),
      markers: clip.markers.map((m) => ({
        OTIO_SCHEMA: 'Marker.1',
        name: m.name,
        marked_range: {
          start_time: convertToOTIORationalTime(m.time),
          duration: convertToOTIORationalTime(m.duration ?? { value: 0, rate: 1 }),
        },
        color: m.color,
        comment: m.comment,
      })),
    };
    children.push(otioClip);
  }
  
  return {
    OTIO_SCHEMA: 'Track.1',
    name: track.name,
    kind: track.kind === 'video' ? 'Video' : track.kind === 'audio' ? 'Audio' : track.kind,
    children,
  };
}

export function toOTIO(schema: TimelineSchema): unknown {
  const tracks = schema.timeline.tracks.map((track) =>
    convertToOTIOTrack(track, schema.sources)
  );
  
  const otio: OTIOTimeline = {
    OTIO_SCHEMA: 'Timeline.1',
    name: schema.timeline.name,
    global_start_time: schema.timeline.metadata.startTime
      ? convertToOTIORationalTime(schema.timeline.metadata.startTime)
      : undefined,
    tracks,
    metadata: {
      frame_rate: schema.timeline.metadata.frameRate,
    },
  };
  
  return otio;
}
