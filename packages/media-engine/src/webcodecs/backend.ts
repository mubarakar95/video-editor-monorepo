import type { DecodeResult, EncodeConfig, VideoDecoderConfig } from '../types.js';

export class WebCodecsBackend {
  private initialized = false;
  private supportedCodecs: Set<string> = new Set();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined') {
      const codecsToTest = ['avc1.42001E', 'avc1.4D401E', 'vp8', 'vp09.00.10.08', 'av01.0.01M.08'];
      
      for (const codec of codecsToTest) {
        try {
          const decoderSupport = await VideoDecoder.isConfigSupported({
            codec,
            codedWidth: 1920,
            codedHeight: 1080,
          });
          
          if (decoderSupport.supported) {
            this.supportedCodecs.add(codec);
          }
        } catch {
          // Codec not supported
        }
      }
    }

    this.initialized = true;
  }

  async isSupported(codec: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const support = await VideoDecoder.isConfigSupported({
        codec,
        codedWidth: 1920,
        codedHeight: 1080,
      });
      return support.supported ?? false;
    } catch {
      return false;
    }
  }

  async decode(source: ArrayBuffer, codec: string): Promise<DecodeResult> {
    this.ensureInitialized();

    const frames: VideoFrame[] = [];
    let width = 0;
    let height = 0;
    let duration = 0;

    return new Promise((resolve, reject) => {
      const decoder = new VideoDecoder({
        output: (frame) => {
          width = frame.displayWidth;
          height = frame.displayHeight;
          duration = Math.max(duration, frame.duration ?? 0);
          frames.push(frame);
        },
        error: (e) => {
          reject(new Error(`VideoDecoder error: ${e.message}`));
        },
      });

      decoder.configure({
        codec,
        codedWidth: 1920,
        codedHeight: 1080,
      });

      const chunk = new EncodedVideoChunk({
        type: 'key',
        timestamp: 0,
        data: source,
      });

      decoder.decode(chunk);
      decoder.flush().then(() => {
        decoder.close();
        resolve({
          frames,
          duration,
          width,
          height,
          frameRate: 30, // Default, should be extracted from stream
        });
      }).catch(reject);
    });
  }

  async encode(frames: VideoFrame[], config: EncodeConfig): Promise<ArrayBuffer> {
    this.ensureInitialized();

    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      const encoder = new VideoEncoder({
        output: (chunk, _metadata) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push(data);
        },
        error: (e) => {
          reject(new Error(`VideoEncoder error: ${e.message}`));
        },
      });

      encoder.configure({
        codec: config.codec,
        width: config.width,
        height: config.height,
        bitrate: config.bitRate,
        framerate: config.frameRate,
      });

      let frameIndex = 0;
      for (const frame of frames) {
        const keyFrame = frameIndex % (config.keyFrameInterval ?? 30) === 0;
        encoder.encode(frame, { keyFrame });
        frameIndex++;
      }

      encoder.flush().then(() => {
        encoder.close();
        
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        resolve(result.buffer);
      }).catch(reject);
    });
  }

  createVideoDecoder(config: VideoDecoderConfig): VideoDecoder {
    const decoder = new VideoDecoder({
      output: () => {},
      error: () => {},
    });

    decoder.configure(config);
    return decoder;
  }

  createVideoEncoder(config: EncodeConfig): VideoEncoder {
    const encoder = new VideoEncoder({
      output: () => {},
      error: () => {},
    });

    encoder.configure({
      codec: config.codec,
      width: config.width,
      height: config.height,
      bitrate: config.bitRate,
      framerate: config.frameRate,
    });

    return encoder;
  }

  getSupportedCodecs(): string[] {
    return Array.from(this.supportedCodecs);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('WebCodecsBackend not initialized. Call initialize() first.');
    }
  }
}
