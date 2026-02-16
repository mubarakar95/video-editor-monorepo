'use client'

import { useState } from 'react'

interface Effect {
  id: string
  name: string
  category: string
  thumbnail?: string
}

const mockEffects: Effect[] = [
  { id: '1', name: 'Fade In', category: 'transitions' },
  { id: '2', name: 'Fade Out', category: 'transitions' },
  { id: '3', name: 'Dissolve', category: 'transitions' },
  { id: '4', name: 'Wipe Left', category: 'transitions' },
  { id: '5', name: 'Wipe Right', category: 'transitions' },
  { id: '6', name: 'Blur', category: 'filters' },
  { id: '7', name: 'Sharpen', category: 'filters' },
  { id: '8', name: 'Contrast', category: 'filters' },
  { id: '9', name: 'Brightness', category: 'filters' },
  { id: '10', name: 'Saturation', category: 'filters' },
  { id: '11', name: 'Sepia', category: 'color' },
  { id: '12', name: 'Grayscale', category: 'color' },
  { id: '13', name: 'Invert', category: 'color' },
  { id: '14', name: 'Vintage', category: 'color' },
]

const categories = [
  { id: 'all', name: 'All' },
  { id: 'transitions', name: 'Transitions' },
  { id: 'filters', name: 'Filters' },
  { id: 'color', name: 'Color' },
]

export default function EffectsLibrary() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filteredEffects = mockEffects.filter(effect => {
    const matchesCategory = activeCategory === 'all' || effect.category === activeCategory
    const matchesSearch = effect.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDragStart = (e: React.DragEvent, effect: Effect) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'effect', ...effect }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300 mb-2">Effects</h2>
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search effects..."
          className="w-full bg-dark-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-dark-600 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredEffects.map((effect) => (
            <div
              key={effect.id}
              draggable
              onDragStart={(e) => handleDragStart(e, effect)}
              className="bg-dark-700 rounded p-2 cursor-grab hover:bg-dark-600 transition-colors"
            >
              <div className="aspect-video bg-dark-800 rounded mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <p className="text-xs text-white truncate">{effect.name}</p>
              <p className="text-xs text-dark-500 capitalize">{effect.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
