import { create } from 'zustand'

export type AgentMode = 'chat' | 'command' | 'edit'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  provider?: 'local' | 'openai' | 'anthropic'
}

interface AgentState {
  messages: Message[]
  isLoading: boolean
  mode: AgentMode
  error: string | null
}

interface AgentActions {
  sendMessage: (content: string) => Promise<void>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (isLoading: boolean) => void
  setMode: (mode: AgentMode) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  removeMessage: (id: string) => void
}

type AgentStore = AgentState & AgentActions

const initialState: AgentState = {
  messages: [],
  isLoading: false,
  mode: 'chat',
  error: null
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  ...initialState,

  sendMessage: async (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    }

    set((state) => ({
      messages: [...state.messages, message],
      isLoading: true,
      error: null
    }))

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...get().messages, message] 
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      
      set((state) => ({
        messages: [...state.messages, {
          id: data.id,
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
          provider: data.provider
        }],
        isLoading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addMessage: (message) =>
    set((state) => ({
      // ... existing implementation if needed or kept for manual adds
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }
      ]
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setMode: (mode) => set({ mode }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [] }),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id)
    }))
}))
