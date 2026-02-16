import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { DecodeResult, EncodeConfig, MediaInfo } from '../types.js';

export class FFmpegBackend {
  private ffmpeg: FFmpeg;
  private initialized = false;
  private corePath?: string;

  constructor(corePath?: string) {
    this.ffmpeg = new FFmpeg();
    this.corePath = corePath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const baseURL = this.corePath || 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.initialized = true;
  }

  async decode(source: ArrayBuffer, format: string): Promise<DecodeResult> {
    this.ensureInitialized();

    const inputName = `input.${format}`;
    const outputName = 'output.raw';

    await this.ffmpeg.writeFile(inputName, new Uint8Array(source));

    const command = this.buildDecodeCommand(format);
    await this.ffmpeg.exec([...command, '-i', inputName, '-f', 'rawvideo', '-pix_fmt', 'rgba', outputName]);

    const data = await this.ffmpeg.readFile(outputName);
    
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Parse raw video data into frames (simplified)
    const rawData = data as unknown;
    const pixelData = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as ArrayBuffer);
    const frameCount = Math.floor(pixelData.length / (1920 * 1080 * 4)); // Assuming 1080p RGBA

    const frames: VideoFrame[] = [];
    for (let i = 0; i < frameCount; i++) {
      const frameData = pixelData.slice(i * 1920 * 1080 * 4, (i + 1) * 1920 * 1080 * 4);
      const frame = new VideoFrame(frameData, {
        format: 'RGBA',
        codedWidth: 1920,
        codedHeight: 1080,
        timestamp: i * 33333, // ~30fps in microseconds
      });
      frames.push(frame);
    }

    return {
      frames,
      duration: frameCount / 30,
      width: 1920,
      height: 1080,
      frameRate: 30,
    };
  }

  async encode(frames: VideoFrame[], config: EncodeConfig): Promise<ArrayBuffer> {
    this.ensureInitialized();

    const outputName = `output.${config.format || 'mp4'}`;
    const inputPrefix = 'frame_';

    // Write frames as raw images
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameData = new Uint8Array(frame.allocationSize());
      frame.copyTo(frameData);
      
      const frameName = `${inputPrefix}${i.toString().padStart(6, '0')}.rgba`;
      await this.ffmpeg.writeFile(frameName, frameData);
    }

    const command = buildEncodeCommand(config);
    await this.ffmpeg.exec([
      '-framerate', config.frameRate.toString(),
      '-s', `${config.width}x${config.height}`,
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-i', `${inputPrefix}%06d.rgba`,
      ...command,
      outputName,
    ]);

    const data = await this.ffmpeg.readFile(outputName);

    // Cleanup
    for (let i = 0; i < frames.length; i++) {
      const frameName = `${inputPrefix}${i.toString().padStart(6, '0')}.rgba`;
      await this.ffmpeg.deleteFile(frameName);
    }
    await this.ffmpeg.deleteFile(outputName);

    return (data instanceof Uint8Array ? data.buffer : data) as ArrayBuffer;
  }

  async transcode(input: ArrayBuffer, inputFormat: string, outputFormat: string): Promise<ArrayBuffer> {
    this.ensureInitialized();

    const inputName = `input.${inputFormat}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg.writeFile(inputName, new Uint8Array(input));

    const command = buildTranscodeCommand(inputFormat, outputFormat);
    await this.ffmpeg.exec(['-i', inputName, ...command, outputName]);

    const data = await this.ffmpeg.readFile(outputName);

    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return (data instanceof Uint8Array ? data.buffer : data) as ArrayBuffer;
  }

  async extractThumbnail(source: ArrayBuffer, time: number): Promise<Blob> {
    this.ensureInitialized();

    const inputName = 'input.mp4';
    const outputName = 'thumbnail.jpg';

    await this.ffmpeg.writeFile(inputName, new Uint8Array(source));

    await this.ffmpeg.exec([
      '-ss', time.toString(),
      '-i', inputName,
      '-frames:v', '1',
      '-q:v', '2',
      outputName,
    ]);

    const data = await this.ffmpeg.readFile(outputName);

    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Create Blob from the data - handle both Uint8Array and ArrayBuffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blobParts: BlobPart[] = [new Uint8Array(data as any)] as BlobPart[];
    return new Blob(blobParts, { type: 'image/jpeg' });
  }

  async getMediaInfo(source: ArrayBuffer): Promise<MediaInfo> {
    this.ensureInitialized();

    const inputName = 'input.mp4';
    await this.ffmpeg.writeFile(inputName, new Uint8Array(source));

    let infoString = '';
    this.ffmpeg.on('log', ({ message }) => {
      infoString += message + '\n';
    });

    await this.ffmpeg.exec(['-i', inputName]);

    await this.ffmpeg.deleteFile(inputName);

    // Parse FFmpeg output (simplified)
    return {
      duration: this.parseDuration(infoString),
      width: this.parseWidth(infoString),
      height: this.parseHeight(infoString),
      frameRate: this.parseFrameRate(infoString),
      codec: this.parseCodec(infoString),
      hasAudio: infoString.includes('Audio:'),
      hasVideo: infoString.includes('Video:'),
    };
  }

  async extractFramesAtTimes(source: ArrayBuffer, times: number[]): Promise<VideoFrame[]> {
    this.ensureInitialized();

    const inputName = 'input.mp4';
    const outputPrefix = 'frame_';

    await this.ffmpeg.writeFile(inputName, new Uint8Array(source));

    const frames: VideoFrame[] = [];

    for (let i = 0; i < times.length; i++) {
      const outputName = `${outputPrefix}${i}.rgba`;
      
      await this.ffmpeg.exec([
        '-ss', times[i].toString(),
        '-i', inputName,
        '-frames:v', '1',
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        outputName,
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      const rawData = data as unknown;
      const pixelData = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as ArrayBuffer);

      const frame = new VideoFrame(pixelData, {
        format: 'RGBA',
        codedWidth: 1920,
        codedHeight: 1080,
        timestamp: times[i] * 1000000,
      });

      frames.push(frame);
      await this.ffmpeg.deleteFile(outputName);
    }

    await this.ffmpeg.deleteFile(inputName);

    return frames;
  }

  private buildDecodeCommand(format: string): string[] {
    const commands: Record<string, string[]> = {
      mp4: [],
      webm: [],
      mkv: [],
      avi: [],
      mov: [],
    };
    return commands[format] || [];
  }

  private parseDuration(info: string): number {
    const match = info.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const centiseconds = parseInt(match[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }
    return 0;
  }

  private parseWidth(info: string): number {
    const match = info.match(/(\d{2,4})x\d{2,4}/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseHeight(info: string): number {
    const match = info.match(/\d{2,4}x(\d{2,4})/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseFrameRate(info: string): number {
    const match = info.match(/(\d+(?:\.\d+)?) fps/);
    return match ? parseFloat(match[1]) : 30;
  }

  private parseCodec(info: string): string {
    const match = info.match(/Video: (\w+)/);
    return match ? match[1] : 'unknown';
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('FFmpegBackend not initialized. Call initialize() first.');
    }
  }
}

function buildEncodeCommand(config: EncodeConfig): string[] {
  const args: string[] = [];

  switch (config.codec) {
    case 'h264':
    case 'avc1':
      args.push('-c:v', 'libx264');
      args.push('-preset', 'fast');
      args.push('-crf', '23');
      break;
    case 'h265':
    case 'hevc':
      args.push('-c:v', 'libx265');
      args.push('-preset', 'fast');
      args.push('-crf', '28');
      break;
    case 'vp8':
      args.push('-c:v', 'libvpx');
      args.push('-crf', '10');
      args.push('-b:v', `${config.bitRate}`);
      break;
    case 'vp9':
      args.push('-c:v', 'libvpx-vp9');
      args.push('-crf', '30');
      args.push('-b:v', '0');
      break;
    default:
      args.push('-c:v', 'libx264');
  }

  if (config.keyFrameInterval) {
    args.push('-g', config.keyFrameInterval.toString());
  }

  args.push('-pix_fmt', 'yuv420p');

  return args;
}

function buildTranscodeCommand(from: string, to: string): string[] {
  const args: string[] = [];

  // Output format specific settings
  switch (to) {
    case 'mp4':
      args.push('-c:v', 'libx264');
      args.push('-c:a', 'aac');
      args.push('-movflags', '+faststart');
      break;
    case 'webm':
      args.push('-c:v', 'libvpx-vp9');
      args.push('-c:a', 'libopus');
      break;
    case 'mkv':
      args.push('-c:v', 'libx264');
      args.push('-c:a', 'aac');
      break;
    default:
      args.push('-c', 'copy');
  }

  return args;
}
