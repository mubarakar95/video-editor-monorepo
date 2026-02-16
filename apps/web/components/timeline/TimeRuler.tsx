'use client'

interface TimeRulerProps {
  pixelsPerSecond: number
  duration: number
}

export default function TimeRuler({ pixelsPerSecond, duration }: TimeRulerProps) {
  const getMajorInterval = () => {
    if (pixelsPerSecond >= 100) return 1
    if (pixelsPerSecond >= 50) return 2
    if (pixelsPerSecond >= 25) return 5
    if (pixelsPerSecond >= 10) return 10
    return 30
  }

  const getMinorInterval = () => {
    const major = getMajorInterval()
    if (major <= 1) return 0.25
    if (major <= 5) return 1
    return 5
  }

  const majorInterval = getMajorInterval()
  const minorInterval = getMinorInterval()
  const width = duration * pixelsPerSecond

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const majorMarks = []
  const minorMarks = []

  for (let t = 0; t <= duration; t += minorInterval) {
    const x = t * pixelsPerSecond
    const isMajor = t % majorInterval === 0
    
    if (isMajor) {
      majorMarks.push({ x, time: t })
    } else {
      minorMarks.push({ x })
    }
  }

  return (
    <div 
      className="relative h-6 border-b border-dark-700 bg-dark-850"
      style={{ width: `${width}px` }}
    >
      {minorMarks.map((mark, i) => (
        <div
          key={`minor-${i}`}
          className="absolute bottom-0 w-px h-2 bg-dark-600"
          style={{ left: `${mark.x}px` }}
        />
      ))}
      
      {majorMarks.map((mark, i) => (
        <div
          key={`major-${i}`}
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${mark.x}px` }}
        >
          <span className="text-xs text-dark-400 transform -translate-x-1/2">
            {formatTime(mark.time)}
          </span>
          <div className="w-px h-3 bg-dark-500" />
        </div>
      ))}
    </div>
  )
}
