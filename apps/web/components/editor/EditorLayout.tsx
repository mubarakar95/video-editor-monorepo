'use client'

import { useState } from 'react'
import Header from './Header'
import MediaBrowser from '../panels/MediaBrowser'
import PreviewPanel from '../preview/PreviewPanel'
import TimelineCanvas from '../timeline/TimelineCanvas'
import AgentPanel from '../agent/AgentPanel'

export default function EditorLayout() {
  const [projectName] = useState('Untitled Project')

  return (
    <div className="flex flex-col h-screen bg-dark-900">
      <Header projectName={projectName} />
      
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-dark-700 bg-dark-800 flex flex-col">
          <MediaBrowser />
        </aside>
        
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <PreviewPanel />
            </div>
            
            <aside className="w-80 border-l border-dark-700 bg-dark-800 flex flex-col">
              <AgentPanel />
            </aside>
          </div>
          
          <div className="h-48 border-t border-dark-700 bg-dark-800">
            <TimelineCanvas />
          </div>
        </section>
      </main>
    </div>
  )
}
