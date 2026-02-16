export type ContainerFormat = 'mp4' | 'webm' | 'mkv' | 'mov' | 'avi' | 'gif';

export type Codec = 
  | 'h264' 
  | 'h265' 
  | 'vp8' 
  | 'vp9' 
  | 'av1' 
  | 'aac' 
  | 'mp3' 
  | 'opus' 
  | 'vorbis';

export interface MediaCapabilities {
  supportsWebCodecs: boolean;
  supportsWebAssembly: boolean;
  supportedContainers: ContainerFormat[];
  supportedVideoCodecs: Codec[];
  supportedAudioCodecs: Codec[];
  maxResolution: { width: number; height: number };
  hardwareAcceleration: boolean;
}

export interface VideoFrameInfo {
  width: number;
  height: number;
  format: string;
  timestamp: number;
  duration?: number;
  data: VideoFrameData;
}

export interface VideoFrameData {
  type: 'buffer' | 'imagebitmap' | 'videoframe';
  buffer?: ArrayBuffer;
  imageBitmap?: ImageBitmap;
  videoFrame?: VideoFrame;
}

export interface AudioBufferInfo {
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
  length: number;
  data: Float32Array[];
}

export interface DecodeResult {
  success: boolean;
  videoFrames?: VideoFrameInfo[];
  audioBuffer?: AudioBufferInfo;
  metadata?: MediaMetadata;
  error?: string;
}

export interface MediaMetadata {
  duration: number;
  video?: {
    width: number;
    height: number;
    frameRate: number;
    codec: Codec;
    bitrate: number;
  };
  audio?: {
    sampleRate: number;
    channels: number;
    codec: Codec;
    bitrate: number;
  };
  container: ContainerFormat;
}

export interface EncodeConfig {
  container: ContainerFormat;
  video?: VideoEncodeConfig;
  audio?: AudioEncodeConfig;
  metadata?: Record<string, string>;
}

export interface VideoEncodeConfig {
  codec: Codec;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  keyframeInterval: number;
  quality: 'low' | 'medium' | 'high' | 'lossless';
}

export interface AudioEncodeConfig {
  codec: Codec;
  sampleRate: number;
  channels: number;
  bitrate: number;
  quality: 'low' | 'medium' | 'high' | 'lossless';
}

export interface EncodeResult {
  success: boolean;
  data?: ArrayBuffer;
  blob?: Blob;
  size: number;
  duration: number;
  error?: string;
}
