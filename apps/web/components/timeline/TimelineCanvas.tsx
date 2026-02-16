"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTimelineStore } from "@/stores";
import { useTimelineKeyboard } from "@/components/hooks/useTimelineKeyboard";
import TimeRuler from "./TimeRuler";
import Playhead from "./Playhead";
import DraggableClipBlock from "./DraggableClipBlock";
import TimelineSelectionOverlay from "./TimelineSelectionOverlay";
import TimelineContextMenu from "./TimelineContextMenu";
import type { Track, Clip } from "@video-editor/timeline-schema";
import type { SnapGuide } from "@/lib/timeline/snapping";

const TRACK_HEIGHT = 40;
const RULER_HEIGHT = 24;
const HEADER_WIDTH = 128;

export default function TimelineCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    timeline,
    zoom,
    setZoom,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    isSnapping,
    toggleSnapping,
    scrollX,
    setScrollX,
    addClip,
    setTimeline,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useTimelineStore();

  const [containerWidth, setContainerWidth] = useState(0);
  const [activeSnapGuides, setActiveSnapGuides] = useState<SnapGuide[]>([]);

  useTimelineKeyboard();

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const frameRate = timeline?.metadata?.frameRate || 30;
    const frameTime = 1 / frameRate;

    const interval = setInterval(() => {
      setCurrentTime(currentTime + frameTime);
    }, frameTime * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, setCurrentTime, timeline?.metadata?.frameRate]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    },
    [zoom, setZoom],
  );

  const handleZoomIn = useCallback(() => setZoom(zoom + 0.2), [zoom, setZoom]);
  const handleZoomOut = useCallback(() => setZoom(zoom - 0.2), [zoom, setZoom]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineAreaRef.current) return;
      const rect = timelineAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollX;
      const time = x / pixelsPerSecond;
      setCurrentTime(Math.max(0, time));
    },
    [scrollX, setCurrentTime],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollX(e.currentTarget.scrollLeft);
    },
    [setScrollX],
  );

  const pixelsPerSecond = 50 * zoom;
  const frameRate = timeline?.metadata?.frameRate || 30;
  const totalDuration = timeline
    ? Math.max(
        60,
        ...timeline.tracks.flatMap((t) =>
          t.clips.map(
            (c) =>
              c.timelineRange.start.value / c.timelineRange.start.rate +
              c.timelineRange.duration.value / c.timelineRange.duration.rate,
          ),
        ),
      )
    : 60;
  const timelineWidth = totalDuration * pixelsPerSecond;

  const getTrackColor = (kind: string) => {
    switch (kind) {
      case "video":
        return "bg-blue-600";
      case "audio":
        return "bg-green-600";
      case "subtitle":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full flex flex-col bg-dark-900"
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;

        try {
          const file = JSON.parse(data);
          let currentTimeline = timeline;

          if (!currentTimeline) {
            const newTimeline = {
              id: "project-1",
              name: "New Project",
              metadata: {
                width: 1920,
                height: 1080,
                frameRate: 30,
                duration: 0,
              },
              tracks: [
                {
                  id: "track-1",
                  name: "Video 1",
                  kind: "video",
                  index: 0,
                  clips: [],
                  enabled: true,
                  locked: false,
                  solo: false,
                  muted: false,
                },
                {
                  id: "track-2",
                  name: "Audio 1",
                  kind: "audio",
                  index: 1,
                  clips: [],
                  enabled: true,
                  locked: false,
                  solo: false,
                  muted: false,
                },
              ],
              transitions: [],
              markers: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setTimeline(newTimeline as any);
            currentTimeline = newTimeline as any;
          }

          if (currentTimeline) {
            const track =
              currentTimeline.tracks.find((t: Track) => t.kind === file.type) ||
              currentTimeline.tracks[0];
            const frameRate = currentTimeline.metadata.frameRate || 30;

            const clip: Clip = {
              id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              sourceId: file.id,
              sourceRange: {
                start: { value: 0, rate: frameRate },
                duration: {
                  value: (file.duration || 5) * frameRate,
                  rate: frameRate,
                },
              },
              timelineRange: {
                start: { value: 0, rate: frameRate },
                duration: {
                  value: (file.duration || 5) * frameRate,
                  rate: frameRate,
                },
              },
              state: "active",
              effects: [],
              markers: [],
              properties: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            addClip(track.id, clip);
          }
        } catch (err) {
          console.error("Failed to parse dropped item", err);
        }
      }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700 bg-dark-850">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">Timeline</span>
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={toggleSnapping}
            className={`px-2 py-1 text-xs rounded ${
              isSnapping
                ? "bg-blue-600 text-white"
                : "bg-dark-700 text-dark-300"
            }`}
            title="Toggle Snapping (Ctrl+S)"
          >
            Snap
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 text-dark-400 hover:text-white rounded hover:bg-dark-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <span className="text-xs text-dark-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-dark-400 hover:text-white rounded hover:bg-dark-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs text-dark-400 hover:text-white rounded hover:bg-dark-700"
          >
            Fit
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className="flex-shrink-0 border-r border-dark-700 bg-dark-850"
          style={{ width: `${HEADER_WIDTH}px` }}
        >
          <div className="h-6 border-b border-dark-700" />
          {timeline?.tracks.map((track) => (
            <div
              key={track.id}
              className={`flex items-center px-2 border-b border-dark-700 ${
                track.locked ? "opacity-50" : ""
              }`}
              style={{ height: `${TRACK_HEIGHT}px` }}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${getTrackColor(track.kind)}`}
              />
              <span className="text-xs text-dark-300 truncate flex-1">
                {track.name}
              </span>
              {track.locked && (
                <svg
                  className="w-3 h-3 text-dark-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          onScroll={handleScroll}
        >
          <div
            data-timeline-area
            ref={timelineAreaRef}
            style={{ width: `${Math.max(timelineWidth, containerWidth)}px` }}
            className="relative"
          >
            <TimeRuler
              pixelsPerSecond={pixelsPerSecond}
              duration={totalDuration}
            />

            {timeline?.tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                className={`relative border-b border-dark-700 ${
                  track.locked ? "bg-dark-900 opacity-75" : "bg-dark-850"
                }`}
                style={{ height: `${TRACK_HEIGHT}px` }}
                onClick={handleTimelineClick}
              >
                {track.clips.map((clip) => (
                  <DraggableClipBlock
                    key={clip.id}
                    clip={clip}
                    track={track}
                    pixelsPerSecond={pixelsPerSecond}
                    frameRate={frameRate}
                    isSelected={useTimelineStore
                      .getState()
                      .selectedClipIds.includes(clip.id)}
                  />
                ))}
              </div>
            ))}

            <Playhead
              currentTime={currentTime}
              pixelsPerSecond={pixelsPerSecond}
            />
          </div>
        </div>
      </div>

      <TimelineContextMenu />

      <TimelineSelectionOverlay
        pixelsPerSecond={pixelsPerSecond}
        trackHeight={TRACK_HEIGHT}
        headerHeight={HEADER_WIDTH}
        rulerHeight={RULER_HEIGHT}
        containerRef={timelineAreaRef}
      />
    </div>
  );
}
