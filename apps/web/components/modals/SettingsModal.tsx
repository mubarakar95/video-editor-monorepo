'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/stores'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKeys, setApiKey, preferences, setPreference, resetSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<'api' | 'appearance' | 'shortcuts'>('api')

  if (!isOpen) return null

  const handleSave = () => {
    onClose()
  }

  const shortcuts = [
    { key: 'Space', action: 'Play/Pause' },
    { key: 'S', action: 'Split clip' },
    { key: 'Delete', action: 'Delete selection' },
    { key: 'Ctrl+Z', action: 'Undo' },
    { key: 'Ctrl+Shift+Z', action: 'Redo' },
    { key: 'Ctrl+C', action: 'Copy' },
    { key: 'Ctrl+V', action: 'Paste' },
    { key: '←', action: 'Previous frame' },
    { key: '→', action: 'Next frame' },
    { key: 'Home', action: 'Go to start' },
    { key: 'End', action: 'Go to end' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          <div className="w-40 border-r border-dark-700 p-2">
            {(['api', 'appearance', 'shortcuts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 text-sm rounded ${
                  activeTab === tab
                    ? 'bg-dark-600 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4">
            {activeTab === 'api' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-dark-300">API Keys</h3>
                
                <div>
                  <label className="block text-sm text-dark-400 mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKey('openai', e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-dark-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Anthropic API Key</label>
                  <input
                    type="password"
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKey('anthropic', e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-dark-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-1">Default Provider</label>
                  <select
                    value={preferences.defaultProvider}
                    onChange={(e) => setPreference('defaultProvider', e.target.value as typeof preferences.defaultProvider)}
                    className="w-full bg-dark-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="local">Local</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>

                <p className="text-xs text-dark-500">
                  API keys are stored locally in your browser.
                </p>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-dark-300">Appearance</h3>
                
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreference('theme', e.target.value as 'dark' | 'light')}
                    className="w-full bg-dark-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-1">Default Timeline Zoom</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={preferences.timelineZoom}
                    onChange={(e) => setPreference('timelineZoom', parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-xs text-dark-500">{Math.round(preferences.timelineZoom * 100)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Show Preview Panel</span>
                  <button
                    onClick={() => setPreference('showPreview', !preferences.showPreview)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      preferences.showPreview ? 'bg-blue-600' : 'bg-dark-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.showPreview ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Auto Save</span>
                  <button
                    onClick={() => setPreference('autoSave', !preferences.autoSave)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      preferences.autoSave ? 'bg-blue-600' : 'bg-dark-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.autoSave ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-dark-300">Keyboard Shortcuts</h3>
                
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm text-dark-400">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-dark-700 text-dark-300 text-xs rounded font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-dark-700">
          <button
            onClick={() => resetSettings()}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-dark-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
