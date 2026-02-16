import type { ContainerFormat, Codec, VideoEncodeConfig, AudioEncodeConfig, MediaMetadata } from './media.js';

export type MediaFileStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
  mediaFiles: MediaFile[];
  timeline?: TimelineData;
  metadata?: Record<string, unknown>;
}

export interface ProjectSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  sampleRate: number;
  defaultContainer: ContainerFormat;
  defaultVideoCodec: Codec;
  defaultAudioCodec: Codec;
  colorSpace: 'srgb' | 'display-p3' | 'rec2020';
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface MediaFile {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  status: MediaFileStatus;
  duration: number;
  metadata?: MediaMetadata;
  thumbnailPath?: string;
  proxyPath?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface TimelineData {
  tracks: Track[];
  duration: number;
  markers: Marker[];
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  name: string;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  mediaFileId: string;
  startTime: number;
  endTime: number;
  inPoint: number;
  outPoint: number;
  effects?: Effect[];
}

export interface Effect {
  id: string;
  type: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export interface Marker {
  id: string;
  time: number;
  name: string;
  color?: string;
  comment?: string;
}

export interface ExportConfig {
  projectId: string;
  format: ContainerFormat;
  video: VideoEncodeConfig;
  audio: AudioEncodeConfig;
  range?: { start: number; end: number };
  outputPath: string;
  filename: string;
  quality: 'draft' | 'preview' | 'final';
}

export interface ExportJob {
  id: string;
  projectId: string;
  config: ExportConfig;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  output?: {
    path: string;
    size: number;
    duration: number;
  };
}
