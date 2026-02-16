import type { TimelineSchema, RationalTime } from '../types.js';

export function fromEDL(edl: string): TimelineSchema {
  throw new Error('EDL import not yet implemented. This is a stub implementation.');
}

export function toEDL(schema: TimelineSchema): string {
  const { timeline, sources } = schema;
  const frameRate = timeline.metadata.frameRate;
  
  const lines: string[] = [];
  lines.push(`TITLE: ${timeline.name}`);
  lines.push('');
  lines.push(`FCM: NON-DROP FRAME`);
  lines.push('');
  
  let eventNumber = 1;
  const videoTracks = timeline.tracks.filter((t) => t.kind === 'video');
  const audioTracks = timeline.tracks.filter((t) => t.kind === 'audio');
  
  for (const track of [...videoTracks, ...audioTracks]) {
    for (const clip of track.clips) {
      const source = sources.find((s) => s.id === clip.sourceId);
      const sourceName = source?.name ?? 'UNKNOWN';
      
      const recIn = clip.timelineRange.start;
      const recOut = {
        value: recIn.value + clip.timelineRange.duration.value,
        rate: recIn.rate,
      };
      const srcIn = clip.sourceRange.start;
      const srcOut = {
        value: srcIn.value + clip.sourceRange.duration.value,
        rate: srcIn.rate,
      };
      
      lines.push(
        `${pad(eventNumber, 3)}  ${sourceName.padEnd(8)} ${track.kind === 'audio' ? 'AA' : 'V'}     C        ${formatEDLTimecode(srcIn, frameRate)} ${formatEDLTimecode(srcOut, frameRate)} ${formatEDLTimecode(recIn, frameRate)} ${formatEDLTimecode(recOut, frameRate)}`
      );
      lines.push(`* FROM CLIP NAME: ${clip.name}`);
      lines.push('');
      
      eventNumber++;
    }
  }
  
  return lines.join('\n');
}

function formatEDLTimecode(time: RationalTime, rate: number): string {
  const adjustedRate = Math.round(rate);
  const totalFrames = Math.round((time.value / time.rate) * adjustedRate);
  
  const framesPerHour = adjustedRate * 3600;
  const framesPerMinute = adjustedRate * 60;
  
  const hours = Math.floor(totalFrames / framesPerHour);
  const remainingAfterHours = totalFrames % framesPerHour;
  const minutes = Math.floor(remainingAfterHours / framesPerMinute);
  const remainingAfterMinutes = remainingAfterHours % framesPerMinute;
  const seconds = Math.floor(remainingAfterMinutes / adjustedRate);
  const frames = remainingAfterMinutes % adjustedRate;
  
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}:${pad(frames, 2)}`;
}

function pad(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}
