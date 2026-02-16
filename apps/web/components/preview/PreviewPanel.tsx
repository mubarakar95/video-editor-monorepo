'use client'

import { useRef, useState, useEffect } from 'react'
import { useTimelineStore } from '@/stores'
import TransportControls from './TransportControls'

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { timeline, currentTime, isPlaying, setIsPlaying, setCurrentTime } = useTimelineStore()
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<number>()

  // Mock media resolver - in a real app this would come from a MediaStore
  const getMediaUrl = (id: string) => {
    // For testing, return a sample video for any ID
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }

  // Calculate duration from tracks
  const timelineDuration = timeline ? 
    Math.max(...timeline.tracks.map(track => 
      track.clips.reduce((max, clip) => 
        Math.max(max, clip.timelineRange.start.value + clip.timelineRange.duration.value), 0
      )
    )) / (timeline.metadata?.frameRate || 30) : 0

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const video = videoRef.current
      
      if (!canvas || !ctx || !timeline) return

      // Clear canvas
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Find active clip
      let activeClip = null
      let activeTrack = null

      for (const track of timeline.tracks) {
        if ((track as any).type !== 'video') continue // Only render video tracks
        
        const clip = track.clips.find(c => {
           const start = c.timelineRange.start.value / (c.timelineRange.start.rate || 30)
           const duration = c.timelineRange.duration.value / (c.timelineRange.duration.rate || 30)
           return currentTime >= start && currentTime < start + duration
        })
        
        if (clip) {
          activeClip = clip as any
          activeTrack = track
          break // Simple single-track rendering for now
        }
      }

      if (activeClip && video) {
        // Sync video
        const clipStart = activeClip.timelineRange.start.value / (activeClip.timelineRange.start.rate || 30)
        // Check if mediaRange exists, otherwise assume 0 offset
        const mediaStart = activeClip.mediaRange ? activeClip.mediaRange.start.value / (activeClip.mediaRange.start.rate || 30) : 0
        const videoTime = currentTime - clipStart + mediaStart
        
        // Only update source if changed to avoid reloading
        const mediaUrl = getMediaUrl(activeClip.src)
        if (video.src !== mediaUrl) {
          video.src = mediaUrl
        }

        // Sync time (approximate for loop)
        if (Math.abs(video.currentTime - videoTime) > 0.3) {
           video.currentTime = videoTime
        }

        if (isPlaying && video.paused) {
           video.play().catch(() => {})
        } else if (!isPlaying && !video.paused) {
           video.pause()
        }

        // Draw Frame
        // Calculate aspect ratios to fit containment
        const drawWidth = canvas.width
        const drawHeight = canvas.height // Simplified fill
        ctx.drawImage(video, 0, 0, drawWidth, drawHeight)
        
      } else {
         // No active clip
         if (video && !video.paused) video.pause()
         
         ctx.fillStyle = '#1a1a2e'
         ctx.font = '14px sans-serif'
         ctx.textAlign = 'center'
         ctx.fillText('Preview', canvas.width / 2, canvas.height / 2)
      }
      
      requestRef.current = requestAnimationFrame(render)
    }

    requestRef.current = requestAnimationFrame(render)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [timeline, currentTime, isPlaying])

  // Handle Playback Clock
  useEffect(() => {
     if (!isPlaying) return

     let lastTime = performance.now()
     const animate = (time: number) => {
        const delta = (time - lastTime) / 1000
        lastTime = time
        
        if (currentTime < timelineDuration) {
           setCurrentTime(currentTime + delta)
           requestRef.current = requestAnimationFrame(animate)
        } else {
           setIsPlaying(false)
        }
     }
     
     requestRef.current = requestAnimationFrame(animate)
     return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current)
     }
  }, [isPlaying, currentTime, timelineDuration, setCurrentTime, setIsPlaying])


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
    if (videoRef.current) videoRef.current.volume = newVolume
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-dark-950">
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={800} // Default resolution
          height={450} 
        />
        {/* Hidden video element for source */}
        <video 
           ref={videoRef} 
           className="hidden" 
           crossOrigin="anonymous" 
           playsInline 
           muted={volume === 0} 
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
