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

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,

  addMessage: (message) =>
    set((state) => ({
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
