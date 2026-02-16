import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ApiKeys {
  openai: string
  anthropic: string
}

export interface Preferences {
  theme: 'dark' | 'light'
  defaultProvider: 'local' | 'openai' | 'anthropic' | 'auto'
  autoSave: boolean
  autoSaveInterval: number
  timelineZoom: number
  showPreview: boolean
}

interface SettingsState {
  apiKeys: ApiKeys
  preferences: Preferences
}

interface SettingsActions {
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  resetSettings: () => void
  clearApiKeys: () => void
}

type SettingsStore = SettingsState & SettingsActions

const initialApiKeys: ApiKeys = {
  openai: '',
  anthropic: ''
}

const initialPreferences: Preferences = {
  theme: 'dark',
  defaultProvider: 'auto',
  autoSave: true,
  autoSaveInterval: 30000,
  timelineZoom: 1,
  showPreview: true
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      apiKeys: initialApiKeys,
      preferences: initialPreferences,

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key }
        })),

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value }
        })),

      resetSettings: () =>
        set({
          apiKeys: initialApiKeys,
          preferences: initialPreferences
        }),

      clearApiKeys: () =>
        set({ apiKeys: initialApiKeys })
    }),
    {
      name: 'video-editor-settings'
    }
  )
)
