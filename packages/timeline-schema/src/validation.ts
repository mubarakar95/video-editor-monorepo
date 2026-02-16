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
  TrackKind,
  ClipState,
  TransitionType,
} from './types.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

const TRACK_KINDS: TrackKind[] = ['video', 'audio', 'subtitle', 'data'];
const CLIP_STATES: ClipState[] = ['active', 'muted', 'disabled', 'pending'];
const TRANSITION_TYPES: TransitionType[] = [
  'cross-dissolve',
  'dip',
  'wipe',
  'fade',
  'push',
  'slide',
  'zoom',
];

function validateRationalTime(data: unknown): RationalTime | null {
  if (!isObject(data)) return null;
  const value = data['value'];
  const rate = data['rate'];
  if (!isNumber(value) || !isNumber(rate) || rate <= 0) return null;
  return { value, rate };
}

function validateTimeRange(data: unknown): TimeRange | null {
  if (!isObject(data)) return null;
  const start = validateRationalTime(data['start']);
  const duration = validateRationalTime(data['duration']);
  if (!start || !duration) return null;
  return { start, duration };
}

function validateMarker(data: unknown): Marker | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const time = validateRationalTime(data['time']);
  if (!isString(id) || !isString(name) || !time) return null;
  return {
    id,
    name,
    time,
    color: isString(data['color']) ? data['color'] : undefined,
    duration: validateRationalTime(data['duration']) ?? undefined,
    comment: isString(data['comment']) ? data['comment'] : undefined,
    completed: isBoolean(data['completed']) ? data['completed'] : undefined,
  };
}

function validateEffectParameter(data: unknown): Effect['parameters'][number] | null {
  if (!isObject(data)) return null;
  const name = data['name'];
  const type = data['type'];
  const value = data['value'];
  if (!isString(name) || !isString(type) || value === undefined) return null;
  const validTypes = ['number', 'string', 'boolean', 'color', 'point', 'enum'];
  if (!validTypes.includes(type)) return null;
  return {
    name,
    type: type as Effect['parameters'][number]['type'],
    value: value as Effect['parameters'][number]['value'],
    minValue: isNumber(data['minValue']) ? data['minValue'] : undefined,
    maxValue: isNumber(data['maxValue']) ? data['maxValue'] : undefined,
    enumValues: isArray(data['enumValues'])
      ? data['enumValues'].filter(isString)
      : undefined,
  };
}

function validateEffect(data: unknown): Effect | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const effectType = data['effectType'];
  const enabled = data['enabled'];
  const parameters = data['parameters'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isString(effectType) ||
    !isBoolean(enabled) ||
    !isArray(parameters)
  )
    return null;
  const validTypes = ['filter', 'transition', 'generator', 'color', 'audio'];
  if (!validTypes.includes(effectType)) return null;
  return {
    id,
    name,
    effectType: effectType as Effect['effectType'],
    enabled,
    parameters: parameters.map(validateEffectParameter).filter((p): p is NonNullable<typeof p> => p !== null),
    timeRange: validateTimeRange(data['timeRange']) ?? undefined,
  };
}

function validateClip(data: unknown): Clip | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const sourceId = data['sourceId'];
  const sourceRange = validateTimeRange(data['sourceRange']);
  const timelineRange = validateTimeRange(data['timelineRange']);
  const state = data['state'];
  const effects = data['effects'];
  const markers = data['markers'];
  const createdAt = data['createdAt'];
  const updatedAt = data['updatedAt'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isString(sourceId) ||
    !sourceRange ||
    !timelineRange ||
    !isString(state) ||
    !CLIP_STATES.includes(state as ClipState) ||
    !isArray(effects) ||
    !isArray(markers) ||
    !isString(createdAt) ||
    !isString(updatedAt)
  )
    return null;
  return {
    id,
    name,
    sourceId,
    sourceRange,
    timelineRange,
    state: state as ClipState,
    effects: effects.map(validateEffect).filter((e): e is NonNullable<typeof e> => e !== null),
    markers: markers.map(validateMarker).filter((m): m is NonNullable<typeof m> => m !== null),
    properties: isObject(data['properties']) ? data['properties'] : {},
    createdAt,
    updatedAt,
  };
}

function validateTrack(data: unknown): Track | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const kind = data['kind'];
  const index = data['index'];
  const clips = data['clips'];
  const enabled = data['enabled'];
  const locked = data['locked'];
  const solo = data['solo'];
  const muted = data['muted'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isString(kind) ||
    !TRACK_KINDS.includes(kind as TrackKind) ||
    !isNumber(index) ||
    !isArray(clips) ||
    !isBoolean(enabled) ||
    !isBoolean(locked) ||
    !isBoolean(solo) ||
    !isBoolean(muted)
  )
    return null;
  return {
    id,
    name,
    kind: kind as TrackKind,
    index,
    clips: clips.map(validateClip).filter((c): c is NonNullable<typeof c> => c !== null),
    enabled,
    locked,
    solo,
    muted,
    volume: isNumber(data['volume']) ? data['volume'] : undefined,
    pan: isNumber(data['pan']) ? data['pan'] : undefined,
    color: isString(data['color']) ? data['color'] : undefined,
  };
}

function validateTransition(data: unknown): Transition | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const transitionType = data['transitionType'];
  const duration = validateRationalTime(data['duration']);
  const fromClipId = data['fromClipId'];
  const toClipId = data['toClipId'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isString(transitionType) ||
    !TRANSITION_TYPES.includes(transitionType as TransitionType) ||
    !duration ||
    !isString(fromClipId) ||
    !isString(toClipId)
  )
    return null;
  return {
    id,
    name,
    transitionType: transitionType as TransitionType,
    duration,
    fromClipId,
    toClipId,
    parameters: isArray(data['parameters'])
      ? data['parameters'].map(validateEffectParameter).filter((p): p is NonNullable<typeof p> => p !== null)
      : undefined,
  };
}

function validateMediaMetadata(data: unknown): Timeline['metadata'] | null {
  if (!isObject(data)) return null;
  const frameRate = data['frameRate'];
  if (!isNumber(frameRate) || frameRate <= 0) return null;
  return {
    frameRate,
    sampleRate: isNumber(data['sampleRate']) ? data['sampleRate'] : undefined,
    width: isNumber(data['width']) ? data['width'] : undefined,
    height: isNumber(data['height']) ? data['height'] : undefined,
    pixelAspectRatio: isNumber(data['pixelAspectRatio']) ? data['pixelAspectRatio'] : undefined,
    fieldOrder: isString(data['fieldOrder']) ? (data['fieldOrder'] as Timeline['metadata']['fieldOrder']) : undefined,
    colorSpace: isString(data['colorSpace']) ? data['colorSpace'] : undefined,
    startTime: validateRationalTime(data['startTime']) ?? undefined,
  };
}

function validateMediaSource(data: unknown): MediaSource | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const path = data['path'];
  const sourceType = data['sourceType'];
  const createdAt = data['createdAt'];
  const updatedAt = data['updatedAt'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isString(path) ||
    !isString(sourceType) ||
    !['file', 'url', 'proxy', 'generated'].includes(sourceType) ||
    !isString(createdAt) ||
    !isString(updatedAt)
  )
    return null;
  return {
    id,
    name,
    path,
    sourceType: sourceType as MediaSource['sourceType'],
    metadata: isObject(data['metadata']) ? data['metadata'] as MediaSource['metadata'] : undefined,
    createdAt,
    updatedAt,
  };
}

function validateTimeline(data: unknown): Timeline | null {
  if (!isObject(data)) return null;
  const id = data['id'];
  const name = data['name'];
  const tracks = data['tracks'];
  const transitions = data['transitions'];
  const markers = data['markers'];
  const metadata = validateMediaMetadata(data['metadata']);
  const createdAt = data['createdAt'];
  const updatedAt = data['updatedAt'];
  if (
    !isString(id) ||
    !isString(name) ||
    !isArray(tracks) ||
    !isArray(transitions) ||
    !isArray(markers) ||
    !metadata ||
    !isString(createdAt) ||
    !isString(updatedAt)
  )
    return null;
  return {
    id,
    name,
    tracks: tracks.map(validateTrack).filter((t): t is NonNullable<typeof t> => t !== null),
    transitions: transitions.map(validateTransition).filter((t): t is NonNullable<typeof t> => t !== null),
    markers: markers.map(validateMarker).filter((m): m is NonNullable<typeof m> => m !== null),
    metadata,
    createdAt,
    updatedAt,
  };
}

export function validateTimelineSchema(data: unknown): TimelineSchema | null {
  if (!isObject(data)) return null;
  const version = data['version'];
  const timeline = validateTimeline(data['timeline']);
  const sources = data['sources'];
  if (!isString(version) || !timeline || !isArray(sources)) return null;
  return {
    version,
    timeline,
    sources: sources.map(validateMediaSource).filter((s): s is NonNullable<typeof s> => s !== null),
    agentState: isObject(data['agentState']) ? data['agentState'] as unknown as TimelineSchema['agentState'] : undefined,
  };
}

export { validateClip, validateTrack };

export function isTimelineSchema(obj: unknown): boolean {
  return validateTimelineSchema(obj) !== null;
}

export function assertTimelineSchema(data: unknown): asserts data is TimelineSchema {
  if (!isTimelineSchema(data)) {
    throw new Error('Invalid timeline schema');
  }
}
