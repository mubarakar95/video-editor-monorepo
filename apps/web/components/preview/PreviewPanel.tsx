'use client'

import { useRef, useState, useEffect } from 'react'
import { useTimelineStore } from '@/stores'
import TransportControls from './TransportControls'

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeline, currentTime, isPlaying, setIsPlaying, setCurrentTime } = useTimelineStore()
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate duration from tracks
  const timelineDuration = timeline ? 
    Math.max(...timeline.tracks.map(track => 
      track.clips.reduce((max, clip) => 
        Math.max(max, clip.timelineRange.start.value + clip.timelineRange.duration.value), 0
      )
    )) / (timeline.metadata?.frameRate || 30) : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, width, height)

    if (timeline) {
      ctx.fillStyle = '#1a1a2e'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Preview', width / 2, height / 2)
    } else {
      ctx.fillStyle = '#3a3a4e'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No project loaded', width / 2, height / 2 - 10)
      ctx.font = '12px sans-serif'
      ctx.fillText('Import media to begin', width / 2, height / 2 + 10)
    }
  }, [timeline, currentTime])

  const handleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-dark-950">
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleFullscreen}
            className="p-2 bg-dark-800 bg-opacity-70 rounded text-dark-300 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t border-dark-700 bg-dark-800 px-4 py-2">
        <TransportControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={timelineDuration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      </div>
    </div>
  )
}
