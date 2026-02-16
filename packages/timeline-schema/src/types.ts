export interface RationalTime {
  value: number;
  rate: number;
}

export interface TimeRange {
  start: RationalTime;
  duration: RationalTime;
}

export type TrackKind = 'video' | 'audio' | 'subtitle' | 'data';

export type ClipState = 'active' | 'muted' | 'disabled' | 'pending';

export interface MediaMetadata {
  width?: number;
  height?: number;
  aspectRatio?: number;
  frameRate?: number;
  duration?: RationalTime;
  audioChannels?: number;
  audioSampleRate?: number;
  codec?: string;
  bitrate?: number;
  colorSpace?: string;
  [key: string]: unknown;
}

export interface MediaSource {
  id: string;
  name: string;
  path: string;
  sourceType: 'file' | 'url' | 'proxy' | 'generated';
  metadata?: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface EffectParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'color' | 'point' | 'enum';
  value: number | string | boolean | { r: number; g: number; b: number; a: number } | { x: number; y: number };
  minValue?: number;
  maxValue?: number;
  enumValues?: string[];
  keyframes?: Array<{
    time: RationalTime;
    value: EffectParameter['value'];
    interpolation: 'linear' | 'bezier' | 'step' | 'hold';
  }>;
}

export interface Effect {
  id: string;
  name: string;
  effectType: 'filter' | 'transition' | 'generator' | 'color' | 'audio';
  enabled: boolean;
  parameters: EffectParameter[];
  timeRange?: TimeRange;
}

export type TransitionType = 'cross-dissolve' | 'dip' | 'wipe' | 'fade' | 'push' | 'slide' | 'zoom';

export interface Transition {
  id: string;
  name: string;
  transitionType: TransitionType;
  duration: RationalTime;
  fromClipId: string;
  toClipId: string;
  parameters?: EffectParameter[];
}

export interface Marker {
  id: string;
  name: string;
  color?: string;
  time: RationalTime;
  duration?: RationalTime;
  comment?: string;
  completed?: boolean;
}

export interface Clip {
  id: string;
  name: string;
  sourceId: string;
  sourceRange: TimeRange;
  timelineRange: TimeRange;
  state: ClipState;
  effects: Effect[];
  markers: Marker[];
  properties: {
    opacity?: number;
    volume?: number;
    speed?: number;
    isReversed?: boolean;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    transform?: {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
      anchorX: number;
      anchorY: number;
    };
    crop?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  index: number;
  clips: Clip[];
  enabled: boolean;
  locked: boolean;
  solo: boolean;
  muted: boolean;
  volume?: number;
  pan?: number;
  color?: string;
}

export interface TimelineMetadata {
  frameRate: number;
  sampleRate?: number;
  width?: number;
  height?: number;
  pixelAspectRatio?: number;
  fieldOrder?: 'progressive' | 'upper' | 'lower';
  colorSpace?: string;
  startTime?: RationalTime;
  [key: string]: unknown;
}

export interface Timeline {
  id: string;
  name: string;
  tracks: Track[];
  transitions: Transition[];
  markers: Marker[];
  metadata: TimelineMetadata;
  createdAt: string;
  updatedAt: string;
}

export type PendingOperationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PendingOperation {
  id: string;
  operation: string;
  params: Record<string, unknown>;
  status: PendingOperationStatus;
  error?: string;
  createdAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  timestamp: string;
}

export interface AgentContext {
  currentTimelineId?: string;
  selectedClipIds: string[];
  selectedTrackIds: string[];
  playbackPosition?: RationalTime;
  zoomLevel: number;
  [key: string]: unknown;
}

export interface AgentState {
  conversationHistory: ConversationMessage[];
  pendingOperations: PendingOperation[];
  context: AgentContext;
}

export interface TimelineSchema {
  version: string;
  timeline: Timeline;
  sources: MediaSource[];
  agentState?: AgentState;
}
