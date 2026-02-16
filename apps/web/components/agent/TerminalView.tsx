'use client'

import { useState, useRef, useEffect } from 'react'

interface CommandHistory {
  command: string
  output: string
  timestamp: number
}

export default function TerminalView() {
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      command: 'help',
      output: `Available commands:
  help          Show this help message
  status        Show project status
  render        Render current timeline
  export        Export project
  clear         Clear terminal`,
      timestamp: Date.now() - 5000
    }
  ])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight)
  }, [history])

  const processCommand = (cmd: string): string => {
    const parts = cmd.trim().split(' ')
    const command = parts[0].toLowerCase()
    
    switch (command) {
      case 'help':
        return `Available commands:
  help          Show this help message
  status        Show project status
  render        Render current timeline
  export        Export project
  clear         Clear terminal`
      
      case 'status':
        return `Project Status:
  Timeline: Active
  Tracks: 3
  Duration: 00:02:30
  Last saved: Just now`
      
      case 'render':
        return 'Rendering timeline... [This is a demo]'
      
      case 'export':
        return 'Exporting project... [This is a demo]'
      
      case 'clear':
        setHistory([])
        return ''
      
      default:
        return `Command not found: ${command}. Type 'help' for available commands.`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const output = processCommand(input)
    
    if (input.trim().toLowerCase() !== 'clear') {
      setHistory(prev => [...prev, {
        command: input,
        output,
        timestamp: Date.now()
      }])
    }
    
    setCommandHistory(prev => [...prev, input])
    setInput('')
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div 
      className="flex flex-col h-full bg-dark-900 font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-dark-500 text-xs mb-4">
          Video Editor Terminal v1.0.0
          Type 'help' for available commands.
        </div>

        {history.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-dark-500 text-xs">{formatTimestamp(item.timestamp)}</span>
              <span className="text-green-400">$</span>
              <span className="text-white">{item.command}</span>
            </div>
            {item.output && (
              <div className="text-dark-300 whitespace-pre-wrap pl-4">
                {item.output}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-dark-700">
        <span className="text-green-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white focus:outline-none"
          placeholder="Enter command..."
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
