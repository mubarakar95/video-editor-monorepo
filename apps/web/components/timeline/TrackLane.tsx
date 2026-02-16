"use client";

import { useTimelineStore } from "@/stores";
import ClipBlock from "./ClipBlock";
import type { Track, Clip } from "@video-editor/timeline-schema";

interface TrackLaneProps {
  track: Track;
  pixelsPerSecond: number;
  frameRate: number;
}

export default function TrackLane({
  track,
  pixelsPerSecond,
  frameRate,
}: TrackLaneProps) {
  const { selectedTrackIds, selectedClipIds, selectTrack } = useTimelineStore();
  const isSelected = selectedTrackIds.includes(track.id);

  const handleTrackClick = () => {
    selectTrack(track.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const mediaData = e.dataTransfer.getData("application/json");
    if (mediaData) {
      console.log("Dropped media:", mediaData, "on track:", track.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`h-10 border-b border-dark-700 relative ${
        isSelected ? "bg-dark-750" : "bg-dark-850"
      }`}
      onClick={handleTrackClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {track.clips.map((clip) => (
        <ClipBlock
          key={clip.id}
          clip={clip}
          pixelsPerSecond={pixelsPerSecond}
          isSelected={selectedClipIds.includes(clip.id)}
          frameRate={frameRate}
        />
      ))}
    </div>
  );
}
