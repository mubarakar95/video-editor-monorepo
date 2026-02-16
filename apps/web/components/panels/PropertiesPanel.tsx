'use client'

import { useTimelineStore } from '@/stores'
import type { Clip } from '@video-editor/timeline-schema'

export default function PropertiesPanel() {
  const { timeline, selectedClipId } = useTimelineStore()

  const selectedClip = timeline?.tracks
    .flatMap(track => track.clips)
    .find(clip => clip.id === selectedClipId)

  if (!selectedClip) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-dark-700">
          <h2 className="text-sm font-medium text-dark-300">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-dark-500">No clip selected</p>
        </div>
      </div>
    )
  }

  const formatTime = (frames: number, rate: number) => {
    const totalSeconds = frames / rate
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    const remainingFrames = Math.floor((totalSeconds % 1) * rate)
    return `${mins}:${secs.toString().padStart(2, '0')}:${remainingFrames.toString().padStart(2, '0')}`
  }

  const startTime = selectedClip.timelineRange.start.value / selectedClip.timelineRange.start.rate
  const duration = selectedClip.timelineRange.duration.value / selectedClip.timelineRange.duration.rate

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-dark-400 mb-2">Clip Info</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-dark-500">Name</span>
              <span className="text-white">{selectedClip.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-dark-500">State</span>
              <span className="text-white capitalize">{selectedClip.state}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-dark-500">Start</span>
              <span className="text-white font-mono">{formatTime(selectedClip.timelineRange.start.value, selectedClip.timelineRange.start.rate)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-dark-500">Duration</span>
              <span className="text-white font-mono">{formatTime(selectedClip.timelineRange.duration.value, selectedClip.timelineRange.duration.rate)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-dark-400 mb-2">Timing</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-dark-500 mb-1">Start Time</label>
              <input
                type="number"
                step="0.1"
                value={startTime}
                className="w-full bg-dark-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-dark-500 mb-1">Duration</label>
              <input
                type="number"
                step="0.1"
                value={duration}
                className="w-full bg-dark-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                readOnly
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-dark-400 mb-2">Effects</h3>
          <div className="bg-dark-700 rounded p-3">
            {selectedClip.effects && selectedClip.effects.length > 0 ? (
              <div className="space-y-2">
                {selectedClip.effects.map((effect, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-white">{effect.name}</span>
                    <button className="text-dark-400 hover:text-red-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-500 text-center">No effects applied</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-dark-400 mb-2">Metadata</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-dark-500">ID</span>
              <span className="text-dark-400 font-mono text-[10px]">{selectedClip.id}</span>
            </div>
            {selectedClip.sourceId && (
              <div className="flex justify-between text-xs">
                <span className="text-dark-500">Source</span>
                <span className="text-dark-400 font-mono text-[10px]">{selectedClip.sourceId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
