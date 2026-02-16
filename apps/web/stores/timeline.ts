import { create } from 'zustand'
import type { Timeline, Track, Clip } from '@video-editor/timeline-schema'

interface TimelineState {
  timeline: Timeline | null
  selectedClipId: string | null
  selectedTrackId: string | null
  currentTime: number
  zoom: number
  isPlaying: boolean
}

interface TimelineActions {
  setTimeline: (timeline: Timeline) => void
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
  selectClip: (clipId: string | null) => void
  selectTrack: (trackId: string | null) => void
  setCurrentTime: (time: number) => void
  setZoom: (zoom: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  addClip: (trackId: string, clip: Clip) => void
  removeClip: (trackId: string, clipId: string) => void
}

type TimelineStore = TimelineState & TimelineActions

const initialState: TimelineState = {
  timeline: null,
  selectedClipId: null,
  selectedTrackId: null,
  currentTime: 0,
  zoom: 1,
  isPlaying: false
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  ...initialState,

  setTimeline: (timeline) => set({ timeline }),

  updateClip: (trackId, clipId, updates) =>
    set((state) => {
      if (!state.timeline) return state
      
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === clipId ? { ...clip, ...updates } : clip
                  )
                }
              : track
          )
        }
      }
    }),

  addTrack: (track) =>
    set((state) => {
      if (!state.timeline) return state
      
      return {
        timeline: {
          ...state.timeline,
          tracks: [...state.timeline.tracks, track]
        }
      }
    }),

  removeTrack: (trackId) =>
    set((state) => {
      if (!state.timeline) return state
      
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.filter((track) => track.id !== trackId)
        }
      }
    }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 10)) }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  addClip: (trackId, clip) =>
    set((state) => {
      if (!state.timeline) return state
      
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? { ...track, clips: [...track.clips, clip] }
              : track
          )
        }
      }
    }),

  removeClip: (trackId, clipId) =>
    set((state) => {
      if (!state.timeline) return state
      
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
              : track
          )
        }
      }
    })
}))
