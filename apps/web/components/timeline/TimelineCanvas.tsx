'use client'

import { useRef, useEffect, useState } from 'react'
import { useTimelineStore } from '@/stores'
import TimeRuler from './TimeRuler'
import TrackLane from './TrackLane'
import Playhead from './Playhead'

export default function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { timeline, zoom, setZoom, currentTime, setCurrentTime, isPlaying } = useTimelineStore()
  const [canvasWidth, setCanvasWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const height = 180
    
    canvas.width = canvasWidth * dpr
    canvas.height = height * dpr
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${height}px`
    
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvasWidth, height)
  }, [canvasWidth])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }
  }

  const handleZoomIn = () => setZoom(zoom + 0.2)
  const handleZoomOut = () => setZoom(zoom - 0.2)

  const pixelsPerSecond = 50 * zoom
  const frameRate = timeline?.metadata?.frameRate || 30
  const totalDuration = timeline ? 60 : 0
  const timelineWidth = totalDuration * pixelsPerSecond

  return (
    <div 
      ref={containerRef}
      className="relative h-full flex flex-col"
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const data = e.dataTransfer.getData('application/json')
        if (!data) return
        
        try {
          const file = JSON.parse(data)
          let currentTimeline = timeline
          
          if (!currentTimeline) {
            const newTimeline = {
              id: 'project-1',
              name: 'New Project',
              metadata: {
                width: 1920,
                height: 1080,
                frameRate: 30,
                duration: 0
              },
              tracks: [
                { id: 'track-1', name: 'Video 1', type: 'video', clips: [] },
                { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [] }
              ]
            }
            useTimelineStore.getState().setTimeline(newTimeline as any) // Type check bypass for quick fix
            currentTimeline = newTimeline as any
          }

          if (currentTimeline) { // Should be true now
             const track = currentTimeline.tracks.find((t: any) => t.type === file.type) || currentTimeline.tracks[0]
             const frameRate = currentTimeline.metadata.frameRate || 30
             
             useTimelineStore.getState().addClip(track.id, {
               id: Math.random().toString(36).substr(2, 9),
               name: file.name,
               type: file.type,
               timelineRange: {
                 start: { value: 0, unit: 'frames' },
                 duration: { value: (file.duration || 5) * frameRate, unit: 'frames' }
               },
               mediaRange: {
                 start: { value: 0, unit: 'frames' },
                 duration: { value: (file.duration || 5) * frameRate, unit: 'frames' }
               },
               src: file.id // Using ID as src reference for now
             } as any)
          }

        } catch (err) {
          console.error('Failed to parse dropped item', err)
        }
      }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">Timeline</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 text-dark-400 hover:text-white rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-dark-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-dark-400 hover:text-white rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-32 flex-shrink-0 border-r border-dark-700 bg-dark-850">
          <div className="h-6 border-b border-dark-700" />
          {timeline?.tracks.map((track, index) => (
            <div
              key={track.id}
              className="h-10 border-b border-dark-700 flex items-center px-2"
            >
              <span className="text-xs text-dark-300 truncate">{track.name}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto relative">
          <div style={{ width: Math.max(timelineWidth, canvasWidth) }}>
            <TimeRuler pixelsPerSecond={pixelsPerSecond} duration={totalDuration} />
            
            {timeline?.tracks.map((track) => (
              <TrackLane
                key={track.id}
                track={track}
                pixelsPerSecond={pixelsPerSecond}
                frameRate={frameRate}
              />
            ))}

            <Playhead 
              currentTime={currentTime} 
              pixelsPerSecond={pixelsPerSecond}
            />
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
