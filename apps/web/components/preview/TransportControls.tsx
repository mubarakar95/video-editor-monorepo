'use client'

import { useState } from 'react'

interface TransportControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  volume: number
  onVolumeChange: (volume: number) => void
}

export default function TransportControls({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  volume,
  onVolumeChange,
}: TransportControlsProps) {
  const [isLooping, setIsLooping] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const handlePrevFrame = () => {
    onSeek(Math.max(0, currentTime - 1/30))
  }

  const handleNextFrame = () => {
    onSeek(Math.min(duration, currentTime + 1/30))
  }

  const handleSeekStart = () => {
    onSeek(0)
  }

  const handleSeekEnd = () => {
    onSeek(duration)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value))
  }

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value))
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          onClick={handleSeekStart}
          className="p-1.5 text-dark-400 hover:text-white rounded transition-colors"
          title="Go to start"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        
        <button
          onClick={handlePrevFrame}
          className="p-1.5 text-dark-400 hover:text-white rounded transition-colors"
          title="Previous frame"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        
        <button
          onClick={onPlayPause}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={handleNextFrame}
          className="p-1.5 text-dark-400 hover:text-white rounded transition-colors"
          title="Next frame"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
        
        <button
          onClick={handleSeekEnd}
          className="p-1.5 text-dark-400 hover:text-white rounded transition-colors"
          title="Go to end"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-dark-400 font-mono">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1/30}
          value={currentTime}
          onChange={handleSliderChange}
          className="flex-1 h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-dark-400 font-mono">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`p-1.5 rounded transition-colors ${
            isLooping ? 'text-blue-400' : 'text-dark-400 hover:text-white'
          }`}
          title="Loop"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <button className="p-1 text-dark-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeSlider}
            className="w-16 h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
