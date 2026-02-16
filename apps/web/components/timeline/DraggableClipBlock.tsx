"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useTimelineStore } from "@/stores";
import {
  getClipStartTime,
  getClipEndTime,
  getClipDuration,
  pixelToTime,
  generateSnapPoints,
  snapClipMove,
  snapClipTrim,
  type SnapGuide,
} from "@/lib/timeline/snapping";
import type { Clip, Track } from "@video-editor/timeline-schema";

interface DraggableClipBlockProps {
  clip: Clip;
  track: Track;
  pixelsPerSecond: number;
  frameRate: number;
  isSelected: boolean;
  onDoubleClick?: (clip: Clip) => void;
}

export default function DraggableClipBlock({
  clip,
  track,
  pixelsPerSecond,
  frameRate,
  isSelected,
  onDoubleClick,
}: DraggableClipBlockProps) {
  const {
    timeline,
    selectClip,
    updateClip,
    moveClip,
    trimClip,
    isSnapping,
    currentTime,
    setIsDragging,
    setIsTrimming,
    activeTrimSide,
    scrollX,
  } = useTimelineStore();

  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [isTrimmingClip, setIsTrimmingClip] = useState(false);
  const [trimSide, setTrimSide] = useState<"start" | "end" | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStartTime, setOriginalStartTime] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);

  const blockRef = useRef<HTMLDivElement>(null);

  const startTime = getClipStartTime(clip);
  const duration = getClipDuration(clip);
  const endTime = getClipEndTime(clip);

  const left = startTime * pixelsPerSecond;
  const width = duration * pixelsPerSecond;

  const getClipColor = () => {
    if (track.kind === "audio") {
      return clip.state === "active" ? "bg-green-600" : "bg-green-800";
    }
    if (track.kind === "subtitle") {
      return clip.state === "active" ? "bg-purple-600" : "bg-purple-800";
    }
    return clip.state === "active" ? "bg-blue-600" : "bg-blue-800";
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectClip(clip.id, e.shiftKey);
    },
    [clip.id, selectClip],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(clip);
    },
    [clip, onDoubleClick],
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (track.locked) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDraggingClip(true);
      setIsDragging(true);
      setDragStartX(e.clientX);
      setOriginalStartTime(startTime);
      setSnapGuides([]);
    },
    [track.locked, setIsDragging, startTime],
  );

  const handleTrimStart = useCallback(
    (e: React.MouseEvent, side: "start" | "end") => {
      if (track.locked) return;

      e.preventDefault();
      e.stopPropagation();

      setIsTrimmingClip(true);
      setIsTrimming(true, side);
      setTrimSide(side);
      setDragStartX(e.clientX);
      setOriginalStartTime(startTime);
      setOriginalDuration(duration);
      setSnapGuides([]);
    },
    [track.locked, setIsTrimming, startTime, duration],
  );

  useEffect(() => {
    if (!isDraggingClip && !isTrimmingClip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelToTime(deltaX, pixelsPerSecond);

      if (isDraggingClip) {
        let newStartTime = Math.max(0, originalStartTime + deltaTime);
        const newEndTime = newStartTime + duration;

        if (isSnapping && timeline) {
          const snapPoints = generateSnapPoints(timeline.tracks, currentTime, [
            clip.id,
          ]);
          const result = snapClipMove(newStartTime, newEndTime, snapPoints);
          newStartTime = result.startTime;
          setSnapGuides(result.guides);
        } else {
          setSnapGuides([]);
        }

        if (newStartTime !== startTime) {
          moveClip(track.id, track.id, clip.id, newStartTime);
        }
      }

      if (isTrimmingClip && trimSide) {
        let newTime: number;

        if (trimSide === "start") {
          newTime = originalStartTime + deltaTime;
        } else {
          newTime = originalStartTime + originalDuration + deltaTime;
        }

        if (isSnapping && timeline) {
          const snapPoints = generateSnapPoints(timeline.tracks, currentTime, [
            clip.id,
          ]);
          const result = snapClipTrim(newTime, snapPoints);
          newTime = result.time;
          setSnapGuides(result.guide ? [result.guide] : []);
        } else {
          setSnapGuides([]);
        }

        trimClip(track.id, clip.id, trimSide, newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingClip(false);
      setIsTrimmingClip(false);
      setIsDragging(false);
      setIsTrimming(false, null);
      setSnapGuides([]);
      setTrimSide(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingClip,
    isTrimmingClip,
    dragStartX,
    pixelsPerSecond,
    originalStartTime,
    originalDuration,
    isSnapping,
    timeline,
    currentTime,
    clip.id,
    startTime,
    duration,
    track.id,
    moveClip,
    trimClip,
    setIsDragging,
    setIsTrimming,
    trimSide,
  ]);

  return (
    <>
      <div
        ref={blockRef}
        className={`absolute top-1 bottom-1 ${getClipColor()} rounded cursor-pointer group select-none ${
          isSelected ? "ring-2 ring-white ring-opacity-80" : ""
        } ${isDraggingClip ? "opacity-75" : ""} ${
          track.locked ? "cursor-not-allowed opacity-50" : ""
        }`}
        style={{
          left: `${left}px`,
          width: `${Math.max(width, 20)}px`,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleDragStart}
      >
        <div className="absolute inset-0 px-2 flex items-center overflow-hidden">
          <span className="text-xs text-white truncate font-medium">
            {clip.name}
          </span>
        </div>

        {!track.locked && (
          <>
            <div
              className={`absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group-hover:bg-white group-hover:bg-opacity-20 transition-colors rounded-l ${
                isTrimmingClip && trimSide === "start"
                  ? "bg-yellow-400 bg-opacity-50"
                  : ""
              }`}
              onMouseDown={(e) => handleTrimStart(e, "start")}
            />

            <div
              className={`absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize group-hover:bg-white group-hover:bg-opacity-20 transition-colors rounded-r ${
                isTrimmingClip && trimSide === "end"
                  ? "bg-yellow-400 bg-opacity-50"
                  : ""
              }`}
              onMouseDown={(e) => handleTrimStart(e, "end")}
            />
          </>
        )}

        {isSelected && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-white bg-opacity-50" />
        )}
      </div>

      {snapGuides.length > 0 && (
        <div className="absolute top-0 bottom-0 pointer-events-none z-20">
          {snapGuides.map((guide, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
              style={{
                left: `${guide.time * pixelsPerSecond}px`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
