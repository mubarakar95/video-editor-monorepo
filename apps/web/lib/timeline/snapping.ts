import type { Clip, Track } from "@video-editor/timeline-schema";

export interface SnapPoint {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "marker";
  clipId?: string;
  trackId?: string;
}

export interface SnapResult {
  snappedTime: number;
  snapPoint: SnapPoint | null;
  offset: number;
}

export interface SnapGuide {
  time: number;
  type: "vertical";
  source: SnapPoint;
}

const SNAP_THRESHOLD_MS = 50;
const SNAP_THRESHOLD_SECONDS = SNAP_THRESHOLD_MS / 1000;

export function generateSnapPoints(
  tracks: Track[],
  playheadTime: number,
  excludeClipIds: string[] = [],
): SnapPoint[] {
  const points: SnapPoint[] = [];

  if (playheadTime >= 0) {
    points.push({
      time: playheadTime,
      type: "playhead",
    });
  }

  for (const track of tracks) {
    for (const clip of track.clips) {
      if (excludeClipIds.includes(clip.id)) continue;

      const startTime =
        clip.timelineRange.start.value / clip.timelineRange.start.rate;
      const duration =
        clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
      const endTime = startTime + duration;

      points.push({
        time: startTime,
        type: "clip-start",
        clipId: clip.id,
        trackId: track.id,
      });

      points.push({
        time: endTime,
        type: "clip-end",
        clipId: clip.id,
        trackId: track.id,
      });

      if (clip.markers) {
        for (const marker of clip.markers) {
          const markerTime = marker.time.value / marker.time.rate;
          points.push({
            time: startTime + markerTime,
            type: "marker",
            clipId: clip.id,
            trackId: track.id,
          });
        }
      }
    }
  }

  return points;
}

export function findSnapPoint(
  time: number,
  snapPoints: SnapPoint[],
  threshold: number = SNAP_THRESHOLD_SECONDS,
): SnapResult {
  let closestPoint: SnapPoint | null = null;
  let closestDistance = Infinity;

  for (const point of snapPoints) {
    const distance = Math.abs(time - point.time);
    if (distance < closestDistance && distance <= threshold) {
      closestDistance = distance;
      closestPoint = point;
    }
  }

  if (closestPoint) {
    return {
      snappedTime: closestPoint.time,
      snapPoint: closestPoint,
      offset: time - closestPoint.time,
    };
  }

  return {
    snappedTime: time,
    snapPoint: null,
    offset: 0,
  };
}

export function snapClipMove(
  clipStartTime: number,
  clipEndTime: number,
  snapPoints: SnapPoint[],
  threshold: number = SNAP_THRESHOLD_SECONDS,
): { startTime: number; guides: SnapGuide[] } {
  const startSnap = findSnapPoint(clipStartTime, snapPoints, threshold);
  const endSnap = findSnapPoint(clipEndTime, snapPoints, threshold);

  const guides: SnapGuide[] = [];
  let snappedStartTime = clipStartTime;

  if (
    startSnap.snapPoint &&
    (!endSnap.snapPoint || startSnap.offset <= endSnap.offset)
  ) {
    snappedStartTime = startSnap.snappedTime;
    guides.push({
      time: snappedStartTime,
      type: "vertical",
      source: startSnap.snapPoint,
    });
  } else if (endSnap.snapPoint) {
    const duration = clipEndTime - clipStartTime;
    snappedStartTime = endSnap.snappedTime - duration;
    guides.push({
      time: endSnap.snappedTime,
      type: "vertical",
      source: endSnap.snapPoint,
    });
  }

  return { startTime: snappedStartTime, guides };
}

export function snapClipTrim(
  trimTime: number,
  snapPoints: SnapPoint[],
  threshold: number = SNAP_THRESHOLD_SECONDS,
): { time: number; guide: SnapGuide | null } {
  const result = findSnapPoint(trimTime, snapPoints, threshold);

  if (result.snapPoint) {
    return {
      time: result.snappedTime,
      guide: {
        time: result.snappedTime,
        type: "vertical",
        source: result.snapPoint,
      },
    };
  }

  return { time: trimTime, guide: null };
}

export function timeToPixel(time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond;
}

export function pixelToTime(pixel: number, pixelsPerSecond: number): number {
  return pixel / pixelsPerSecond;
}

export function formatTimecode(
  seconds: number,
  frameRate: number = 30,
): string {
  const totalFrames = Math.floor(seconds * frameRate);
  const hours = Math.floor(totalFrames / (3600 * frameRate));
  const minutes = Math.floor(
    (totalFrames % (3600 * frameRate)) / (60 * frameRate),
  );
  const secs = Math.floor((totalFrames % (60 * frameRate)) / frameRate);
  const frames = totalFrames % frameRate;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}

export function formatShortTimecode(
  seconds: number,
  frameRate: number = 30,
): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * frameRate);

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}

export function getClipEndTime(clip: Clip): number {
  const startTime =
    clip.timelineRange.start.value / clip.timelineRange.start.rate;
  const duration =
    clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
  return startTime + duration;
}

export function getClipStartTime(clip: Clip): number {
  return clip.timelineRange.start.value / clip.timelineRange.start.rate;
}

export function getClipDuration(clip: Clip): number {
  return clip.timelineRange.duration.value / clip.timelineRange.duration.rate;
}

export function clipsOverlap(clip1: Clip, clip2: Clip): boolean {
  const start1 = getClipStartTime(clip1);
  const end1 = getClipEndTime(clip1);
  const start2 = getClipStartTime(clip2);
  const end2 = getClipEndTime(clip2);

  return start1 < end2 && start2 < end1;
}

export function findClipAtTime(track: Track, time: number): Clip | null {
  for (const clip of track.clips) {
    const start = getClipStartTime(clip);
    const end = getClipEndTime(clip);
    if (time >= start && time < end) {
      return clip;
    }
  }
  return null;
}

export function findGapAtTime(
  track: Track,
  time: number,
): { start: number; end: number } | null {
  const sortedClips = [...track.clips].sort(
    (a, b) => getClipStartTime(a) - getClipStartTime(b),
  );

  let prevEnd = 0;
  for (const clip of sortedClips) {
    const start = getClipStartTime(clip);
    if (time >= prevEnd && time < start) {
      return { start: prevEnd, end: start };
    }
    prevEnd = getClipEndTime(clip);
  }

  if (time >= prevEnd) {
    return { start: prevEnd, end: Infinity };
  }

  return null;
}
