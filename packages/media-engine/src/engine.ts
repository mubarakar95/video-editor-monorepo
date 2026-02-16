import type { MediaEngineConfig, MediaCapabilities, DecodeResult, EncodeConfig, RationalTime } from './types.js';
import { WebCodecsBackend } from './webcodecs/backend.js';
import { FFmpegBackend } from './ffmpeg/backend.js';

export class MediaEngine {
  private config: MediaEngineConfig;
  private webcodecsBackend: WebCodecsBackend;
  private ffmpegBackend: FFmpegBackend;
  private capabilities: MediaCapabilities | null = null;
  private initialized = false;

  constructor(config: MediaEngineConfig = {}) {
    this.config = config;
    this.webcodecsBackend = new WebCodecsBackend();
    this.ffmpegBackend = new FFmpegBackend(config.ffmpegCorePath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Promise.all([
      this.webcodecsBackend.initialize(),
      this.ffmpegBackend.initialize(),
    ]);

    this.capabilities = await this.detectCapabilities();
    this.initialized = true;
  }

  async detectCapabilities(): Promise<MediaCapabilities> {
    const webCodecsSupported = typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
    
    const supportedCodecs: string[] = [];
    if (webCodecsSupported) {
      const codecsToTest = ['avc1.42001E', 'vp8', 'vp09.00.10.08', 'av01.0.01M.08'];
      for (const codec of codecsToTest) {
        try {
          const support = await VideoDecoder.isConfigSupported({ codec, codedWidth: 1920, codedHeight: 1080 });
          if (support.supported) {
            supportedCodecs.push(codec);
          }
        } catch {
          // Codec not supported
        }
      }
    }

    return {
      webCodecs: {
        supported: webCodecsSupported,
        codecs: supportedCodecs,
      },
      ffmpeg: {
        supported: true,
      },
      webWorker: typeof Worker !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    };
  }

  getPreferredBackend(): 'webcodecs' | 'ffmpeg' {
    if (!this.capabilities) {
      throw new Error('MediaEngine not initialized. Call initialize() first.');
    }

    if (this.config.preferWebCodecs && this.capabilities.webCodecs.supported) {
      return 'webcodecs';
    }

    return 'ffmpeg';
  }

  async decode(source: ArrayBuffer, format: string): Promise<DecodeResult> {
    this.ensureInitialized();

    const backend = this.getPreferredBackend();

    if (backend === 'webcodecs') {
      return this.webcodecsBackend.decode(source, this.getCodecFromFormat(format));
    }

    return this.ffmpegBackend.decode(source, format);
  }

  async encode(frames: VideoFrame[], config: EncodeConfig): Promise<ArrayBuffer> {
    this.ensureInitialized();

    const backend = this.getPreferredBackend();

    if (backend === 'webcodecs') {
      return this.webcodecsBackend.encode(frames, config);
    }

    return this.ffmpegBackend.encode(frames, config);
  }

  async transcode(input: ArrayBuffer, from: string, to: string): Promise<ArrayBuffer> {
    this.ensureInitialized();

    return this.ffmpegBackend.transcode(input, from, to);
  }

  async extractFrames(source: ArrayBuffer, times: RationalTime[]): Promise<VideoFrame[]> {
    this.ensureInitialized();

    const backend = this.getPreferredBackend();

    if (backend === 'webcodecs') {
      return this.extractFramesWebCodecs(source, times);
    }

    const results = await this.ffmpegBackend.extractFramesAtTimes(
      source,
      times.map(t => t.numerator / t.denominator)
    );
    return results;
  }

  private async extractFramesWebCodecs(source: ArrayBuffer, times: RationalTime[]): Promise<VideoFrame[]> {
    const frames: VideoFrame[] = [];
    const timeSet = new Set(times.map(t => t.numerator / t.denominator));

    return new Promise((resolve, reject) => {
      const decoder = new VideoDecoder({
        output: (frame: VideoFrame) => {
          const time = frame.timestamp / 1000000; // Convert from microseconds
          if (timeSet.has(time)) {
            frames.push(frame);
          } else {
            frame.close();
          }

          if (frames.length === times.length) {
            decoder.close();
            resolve(frames);
          }
        },
        error: (e: Error) => reject(e),
      });

      decoder.configure({ codec: 'avc1.42001E', codedWidth: 1920, codedHeight: 1080 });
    });
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('MediaEngine not initialized. Call initialize() first.');
    }
  }

  private getCodecFromFormat(format: string): string {
    const codecMap: Record<string, string> = {
      'mp4': 'avc1.42001E',
      'webm': 'vp09.00.10.08',
      'mkv': 'avc1.42001E',
    };
    return codecMap[format] || 'avc1.42001E';
  }

  getCapabilities(): MediaCapabilities {
    this.ensureInitialized();
    return this.capabilities!;
  }
}
