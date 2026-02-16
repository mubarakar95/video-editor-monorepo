"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTimelineStore } from "@/stores";
import {
  pixelToTime,
  getClipStartTime,
  getClipEndTime,
} from "@/lib/timeline/snapping";

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface TimelineSelectionOverlayProps {
  pixelsPerSecond: number;
  trackHeight: number;
  headerHeight: number;
  rulerHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function TimelineSelectionOverlay({
  pixelsPerSecond,
  trackHeight,
  headerHeight,
  rulerHeight,
  containerRef,
}: TimelineSelectionOverlayProps) {
  const { timeline, selectClips, deselectAll } = useTimelineStore();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null,
  );
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      selectionStartRef.current = { x, y };
      setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
      setIsSelecting(true);
      deselectAll();
    },
    [deselectAll],
  );

  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !selectionStartRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      setSelectionRect((prev) => {
        if (!prev) return null;
        return { ...prev, endX: x, endY: y };
      });
    };

    const handleMouseUp = () => {
      if (selectionRect && timeline) {
        const minX = Math.min(selectionRect.startX, selectionRect.endX);
        const maxX = Math.max(selectionRect.startX, selectionRect.endX);
        const minY = Math.min(selectionRect.startY, selectionRect.endY);
        const maxY = Math.max(selectionRect.startY, selectionRect.endY);

        const startTime = pixelToTime(minX, pixelsPerSecond);
        const endTime = pixelToTime(maxX, pixelsPerSecond);

        const trackStartIndex = Math.floor((minY - rulerHeight) / trackHeight);
        const trackEndIndex = Math.floor((maxY - rulerHeight) / trackHeight);

        const selectedClipIds: string[] = [];

        const tracks = timeline.tracks;
        for (
          let i = Math.max(0, trackStartIndex);
          i <= Math.min(tracks.length - 1, trackEndIndex);
          i++
        ) {
          const track = tracks[i];
          for (const clip of track.clips) {
            const clipStart = getClipStartTime(clip);
            const clipEnd = getClipEndTime(clip);

            if (clipEnd >= startTime && clipStart <= endTime) {
              selectedClipIds.push(clip.id);
            }
          }
        }

        if (selectedClipIds.length > 0) {
          selectClips(selectedClipIds);
        }
      }

      setIsSelecting(false);
      setSelectionRect(null);
      selectionStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isSelecting,
    selectionRect,
    timeline,
    pixelsPerSecond,
    trackHeight,
    rulerHeight,
    selectClips,
    containerRef,
  ]);

  if (!isSelecting || !selectionRect) return null;

  const left = Math.min(selectionRect.startX, selectionRect.endX);
  const top = Math.min(selectionRect.startY, selectionRect.endY);
  const width = Math.abs(selectionRect.endX - selectionRect.startX);
  const height = Math.abs(selectionRect.endY - selectionRect.startY);

  return (
    <div
      className="absolute pointer-events-none z-30 border border-blue-400 bg-blue-400 bg-opacity-20"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}
