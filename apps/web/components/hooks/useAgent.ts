'use client'

import { useCallback, useRef } from 'react'
import { useAgentStore, useSettingsStore } from '@/stores'
import type { Message } from '@/stores/agent'

export function useAgent() {
  const {
    messages,
    isLoading,
    mode,
    error,
    addMessage,
    setLoading,
    setMode,
    setError,
    clearMessages,
  } = useAgentStore()
  
  const { apiKeys, preferences } = useSettingsStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    addMessage({
      role: 'user',
      content: content.trim()
    })

    setLoading(true)
    setError(null)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          mode,
          provider: preferences.defaultProvider,
          history: messages.slice(-10),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      addMessage({
        role: 'assistant',
        content: data.message || data.content || 'No response received',
        provider: data.provider,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      addMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}`,
      })
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [isLoading, mode, messages, preferences.defaultProvider, addMessage, setLoading, setError])

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
    }
  }, [setLoading])

  const switchMode = useCallback((newMode: typeof mode) => {
    setMode(newMode)
  }, [setMode])

  const clearHistory = useCallback(() => {
    clearMessages()
    setError(null)
  }, [clearMessages, setError])

  return {
    messages,
    isLoading,
    mode,
    error,
    
    sendMessage,
    cancelRequest,
    switchMode,
    clearHistory,
    
    hasApiKey: !!(apiKeys.openai || apiKeys.anthropic),
    defaultProvider: preferences.defaultProvider,
  }
}
