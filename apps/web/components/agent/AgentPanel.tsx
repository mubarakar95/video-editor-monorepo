'use client'

import { useState } from 'react'
import { useAgentStore } from '@/stores'
import ChatView from './ChatView'
import TerminalView from './TerminalView'

type AgentTab = 'chat' | 'terminal'

export default function AgentPanel() {
  const [activeTab, setActiveTab] = useState<AgentTab>('chat')
  const { isLoading, mode } = useAgentStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              activeTab === 'chat'
                ? 'bg-dark-600 text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              activeTab === 'terminal'
                ? 'bg-dark-600 text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            Terminal
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-dark-400">Processing...</span>
            </div>
          )}
          <span className="text-xs text-dark-500 capitalize">{mode}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatView /> : <TerminalView />}
      </div>
    </div>
  )
}
