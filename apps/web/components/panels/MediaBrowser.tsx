'use client'

import { useState } from 'react'

interface MediaFile {
  id: string
  name: string
  type: 'video' | 'audio' | 'image'
  duration?: number
  thumbnail?: string
  size: number
}

const mockFiles: MediaFile[] = [
  { id: '1', name: 'intro.mp4', type: 'video', duration: 15.5, size: 25400000 },
  { id: '2', name: 'main-content.mp4', type: 'video', duration: 120, size: 150000000 },
  { id: '3', name: 'background.mp3', type: 'audio', duration: 180, size: 4500000 },
  { id: '4', name: 'logo.png', type: 'image', size: 150000 },
  { id: '5', name: 'outro.mp4', type: 'video', duration: 8, size: 12000000 },
]

export default function MediaBrowser() {
  const [files, setFiles] = useState<MediaFile[]>(mockFiles)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all')

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || file.type === filter
    return matchesSearch && matchesFilter
  })

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'video/*,audio/*,image/*'
    input.onchange = (e) => {
      const fileList = (e.target as HTMLInputElement).files
      if (!fileList) return

      const newFiles: MediaFile[] = Array.from(fileList).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
        size: file.size,
        duration: 0 // In a real app, we'd parse metadata here
      }))

      setFiles(prev => [...prev, ...newFiles])
    }
    input.click()
  }

  const handleDragStart = (e: React.DragEvent, file: MediaFile) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file))
    e.dataTransfer.effectAllowed = 'copy'
  }
// ... existing helper functions ...
  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'audio':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      case 'image':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-blue-400'
      case 'audio': return 'text-green-400'
      case 'image': return 'text-purple-400'
      default: return 'text-dark-400'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-dark-300">Media</h2>
          <button
            onClick={handleImport}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Import
          </button>
        </div>
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-dark-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        
        <div className="flex gap-1 mt-2">
          {(['all', 'video', 'audio', 'image'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                filter === f
                  ? 'bg-dark-600 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg className="w-8 h-8 text-dark-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs text-dark-500">No media files</p>
            <p className="text-xs text-dark-600">Drag and drop to import</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                className="flex items-center gap-2 p-2 rounded hover:bg-dark-700 cursor-grab active:cursor-grabbing group"
              >
                <div className={`w-8 h-8 bg-dark-700 rounded flex items-center justify-center ${getTypeColor(file.type)}`}>
                  {getTypeIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{file.name}</p>
                  <p className="text-xs text-dark-500">
                    {file.duration && `${formatDuration(file.duration)} • `}
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
