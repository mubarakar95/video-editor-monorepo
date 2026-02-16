import type { EncodeConfig } from '../types.js';

export function buildDecodeCommand(format: string): string[] {
  const baseArgs: string[] = [];

  switch (format.toLowerCase()) {
    case 'mp4':
    case 'mov':
      baseArgs.push('-f', 'mp4');
      break;
    case 'webm':
      baseArgs.push('-f', 'webm');
      break;
    case 'mkv':
      baseArgs.push('-f', 'matroska');
      break;
    case 'avi':
      baseArgs.push('-f', 'avi');
      break;
    case 'ts':
      baseArgs.push('-f', 'mpegts');
      break;
    default:
      // Let FFmpeg auto-detect
      break;
  }

  return baseArgs;
}

export function buildEncodeCommand(config: EncodeConfig): string[] {
  const args: string[] = [];

  // Codec selection
  switch (config.codec.toLowerCase()) {
    case 'h264':
    case 'avc1':
    case 'avc':
      args.push('-c:v', 'libx264');
      args.push('-preset', 'fast');
      args.push('-tune', 'fastdecode');
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
      args.push('-deadline', 'realtime');
      args.push('-cpu-used', '4');
      break;

    case 'vp9':
      args.push('-c:v', 'libvpx-vp9');
      args.push('-deadline', 'realtime');
      args.push('-cpu-used', '4');
      args.push('-row-mt', '1');
      break;

    case 'av1':
      args.push('-c:v', 'libaom-av1');
      args.push('-cpu-used', '4');
      break;

    default:
      args.push('-c:v', 'libx264');
  }

  // Bitrate control
  if (config.bitRate > 0) {
    args.push('-b:v', `${config.bitRate}`);
    args.push('-maxrate', `${Math.floor(config.bitRate * 1.5)}`);
    args.push('-bufsize', `${config.bitRate * 2}`);
  }

  // Resolution
  args.push('-s', `${config.width}x${config.height}`);

  // Frame rate
  args.push('-r', config.frameRate.toString());

  // Keyframe interval
  if (config.keyFrameInterval && config.keyFrameInterval > 0) {
    args.push('-g', config.keyFrameInterval.toString());
    args.push('-keyint_min', config.keyFrameInterval.toString());
  }

  // Pixel format for compatibility
  args.push('-pix_fmt', 'yuv420p');

  // Output format
  if (config.format) {
    switch (config.format.toLowerCase()) {
      case 'mp4':
        args.push('-f', 'mp4');
        args.push('-movflags', '+faststart');
        break;
      case 'webm':
        args.push('-f', 'webm');
        break;
      case 'mkv':
        args.push('-f', 'matroska');
        break;
    }
  }

  return args;
}

export function buildTranscodeCommand(from: string, to: string): string[] {
  const args: string[] = [];

  // Input format hints
  switch (from.toLowerCase()) {
    case 'mp4':
    case 'mov':
      args.push('-f', 'mp4');
      break;
    case 'webm':
      args.push('-f', 'webm');
      break;
    case 'mkv':
      args.push('-f', 'matroska');
      break;
  }

  // Remove input format from output args
  const inputFormatIndex = args.length;

  // Output format configuration
  switch (to.toLowerCase()) {
    case 'mp4':
      args.push('-c:v', 'libx264');
      args.push('-c:a', 'aac');
      args.push('-b:a', '128k');
      args.push('-movflags', '+faststart');
      args.push('-f', 'mp4');
      break;

    case 'webm':
      args.push('-c:v', 'libvpx-vp9');
      args.push('-c:a', 'libopus');
      args.push('-b:a', '128k');
      args.push('-f', 'webm');
      break;

    case 'mkv':
      args.push('-c:v', 'libx264');
      args.push('-c:a', 'aac');
      args.push('-b:a', '128k');
      args.push('-f', 'matroska');
      break;

    case 'gif':
      args.push('-c:v', 'gif');
      args.push('-f', 'gif');
      break;

    case 'mp3':
      args.push('-c:a', 'libmp3lame');
      args.push('-b:a', '192k');
      args.push('-f', 'mp3');
      break;

    default:
      // Stream copy if formats match or unknown
      args.push('-c', 'copy');
  }

  // Add quality settings
  args.push('-y'); // Overwrite output

  return args;
}

export function buildThumbnailCommand(time: number, width: number = 320): string[] {
  return [
    '-ss', time.toString(),
    '-frames:v', '1',
    '-vf', `scale=${width}:-1`,
    '-q:v', '2',
  ];
}

export function buildExtractFramesCommand(
  outputPrefix: string,
  frameRate: number = 1,
  format: string = 'image2'
): string[] {
  return [
    '-vf', `fps=${frameRate}`,
    '-f', format,
    `${outputPrefix}_%04d.png`,
  ];
}

export function buildTrimCommand(startTime: number, duration: number): string[] {
  return [
    '-ss', startTime.toString(),
    '-t', duration.toString(),
    '-c', 'copy',
  ];
}

export function buildConcatCommand(inputFiles: string[], outputFormat: string): string[] {
  const args: string[] = [];
  
  // Create concat file content
  const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
  
  args.push('-f', 'concat');
  args.push('-safe', '0');
  args.push('-i', 'concat_list.txt');

  switch (outputFormat.toLowerCase()) {
    case 'mp4':
      args.push('-c', 'copy');
      args.push('-movflags', '+faststart');
      break;
    default:
      args.push('-c', 'copy');
  }

  return args;
}
