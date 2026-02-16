'use client'

interface PlayheadProps {
  currentTime: number
  pixelsPerSecond: number
}

export default function Playhead({ currentTime, pixelsPerSecond }: PlayheadProps) {
  const left = currentTime * pixelsPerSecond

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-10"
      style={{ left: `${left}px` }}
    >
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
          {formatTime(currentTime)}
        </div>
      </div>
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
    </div>
  )
}
