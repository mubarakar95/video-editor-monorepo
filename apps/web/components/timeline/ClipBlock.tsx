'use client'

import { useTimelineStore } from '@/stores'
import type { Clip } from '@video-editor/timeline-schema'

interface ClipBlockProps {
  clip: Clip
  pixelsPerSecond: number
  isSelected: boolean
  frameRate: number
}

export default function ClipBlock({ clip, pixelsPerSecond, isSelected, frameRate }: ClipBlockProps) {
  const { selectClip } = useTimelineStore()
  
  const startTime = clip.timelineRange.start.value / clip.timelineRange.start.rate
  const duration = clip.timelineRange.duration.value / clip.timelineRange.duration.rate
  
  const left = startTime * pixelsPerSecond
  const width = duration * pixelsPerSecond
  
  // Use state for visual styling
  const color = clip.state === 'active' ? 'bg-blue-600' : 
                clip.state === 'muted' ? 'bg-gray-600' : 
                clip.state === 'disabled' ? 'bg-red-600' : 'bg-orange-600'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectClip(clip.id)
  }

  const handleTrimStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Trim start:', clip.id)
  }

  const handleTrimEnd = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Trim end:', clip.id)
  }

  return (
    <div
      className={`absolute top-1 bottom-1 ${color} rounded cursor-pointer group ${
        isSelected ? 'ring-2 ring-white ring-opacity-50' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
      }}
      onClick={handleClick}
    >
      <div className="absolute inset-0 px-2 flex items-center overflow-hidden">
        <span className="text-xs text-white truncate">{clip.name}</span>
      </div>
      
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30"
        onMouseDown={handleTrimStart}
      />
      
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30"
        onMouseDown={handleTrimEnd}
      />
    </div>
  )
}
