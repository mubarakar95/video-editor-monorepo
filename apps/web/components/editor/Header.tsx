'use client'

import { useTimelineStore } from '@/stores'

interface HeaderProps {
  projectName: string
}

export default function Header({ projectName }: HeaderProps) {
  const { timeline } = useTimelineStore()

  const handleUndo = () => {
    console.log('Undo')
  }

  const handleRedo = () => {
    console.log('Redo')
  }

  const handleExport = () => {
    console.log('Export')
  }

  const handleSettings = () => {
    console.log('Settings')
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-dark-700 bg-dark-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{projectName}</h1>
        {timeline && (
          <span className="text-xs text-dark-400">
            {timeline.tracks.length} tracks
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={handleUndo}
            className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export
        </button>
        
        <button
          onClick={handleSettings}
          className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
