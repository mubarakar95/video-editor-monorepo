export interface RationalTime {
  numerator: number;
  denominator: number;
}

export interface MediaEngineConfig {
  preferWebCodecs?: boolean;
  ffmpegCorePath?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface DecodeOptions {
  codec?: string;
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface EncodeOptions {
  codec: string;
  width: number;
  height: number;
  bitRate: number;
  frameRate: number;
  keyFrameInterval?: number;
}

export interface DecodeResult {
  frames: VideoFrame[];
  duration: number;
  width: number;
  height: number;
  frameRate: number;
}

export interface EncodeConfig {
  codec: string;
  width: number;
  height: number;
  bitRate: number;
  frameRate: number;
  keyFrameInterval?: number;
  format?: string;
}

export interface TranscodeResult {
  data: ArrayBuffer;
  duration: number;
  width: number;
  height: number;
}

export interface FrameExtractor {
  source: ArrayBuffer;
  times: RationalTime[];
  onFrame?: (frame: VideoFrame, index: number) => void;
}

export interface MediaInfo {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  audioCodec?: string;
  bitRate?: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface MediaCapabilities {
  webCodecs: {
    supported: boolean;
    codecs: string[];
  };
  ffmpeg: {
    supported: boolean;
  };
  webWorker: boolean;
  sharedArrayBuffer: boolean;
}

export interface VideoDecoderConfig {
  codec: string;
  codedWidth: number;
  codedHeight: number;
  description?: ArrayBuffer;
}

export interface VideoEncoderConfig {
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
  keyInterval?: number;
}
