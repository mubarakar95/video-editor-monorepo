"use client";

import type { SnapGuide } from "@/lib/timeline/snapping";

interface SnapGuidesProps {
  guides: SnapGuide[];
  pixelsPerSecond: number;
  containerHeight: number;
}

export default function SnapGuides({
  guides,
  pixelsPerSecond,
  containerHeight,
}: SnapGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute top-0 bottom-0 pointer-events-none z-40">
      {guides.map((guide, index) => (
        <div
          key={`${guide.time}-${index}`}
          className="absolute top-0 w-0.5 bg-yellow-400"
          style={{
            left: `${guide.time * pixelsPerSecond}px`,
            height: `${containerHeight}px`,
          }}
        >
          {guide.source.type === "playhead" && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-yellow-400 text-black text-xs font-medium rounded whitespace-nowrap">
              Playhead
            </div>
          )}
          {guide.source.type === "clip-start" && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
          )}
          {guide.source.type === "clip-end" && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
