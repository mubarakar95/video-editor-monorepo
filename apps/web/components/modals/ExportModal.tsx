'use client'

import { useState } from 'react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [resolution, setResolution] = useState('1080p')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExporting(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const formats = [
    { id: 'mp4', name: 'MP4 (H.264)' },
    { id: 'webm', name: 'WebM (VP9)' },
    { id: 'mov', name: 'MOV (ProRes)' },
    { id: 'gif', name: 'GIF' },
  ]

  const qualities = [
    { id: 'low', name: 'Low (720p)' },
    { id: 'medium', name: 'Medium (1080p)' },
    { id: 'high', name: 'High (1080p)' },
    { id: 'ultra', name: 'Ultra (4K)' },
  ]

  const resolutions = [
    { id: '720p', name: '1280 x 720' },
    { id: '1080p', name: '1920 x 1080' },
    { id: '1440p', name: '2560 x 1440' },
    { id: '4k', name: '3840 x 2160' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Export Project</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white"
            disabled={isExporting}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-dark-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isExporting}
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-dark-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isExporting}
            >
              {qualities.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-dark-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isExporting}
            >
              {resolutions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {isExporting && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-300">Exporting...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-dark-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dark-300 hover:text-white"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
