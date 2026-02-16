'use client'

import { useCallback } from 'react'
import { useTimelineStore } from '@/stores'
import type { Track, Clip } from '@video-editor/timeline-schema'

export function useTimeline() {
  const {
    timeline,
    selectedClipId,
    selectedTrackId,
    currentTime,
    zoom,
    isPlaying,
    setTimeline,
    addTrack,
    removeTrack,
    selectClip,
    selectTrack,
    setCurrentTime,
    setZoom,
    setIsPlaying,
    addClip,
    removeClip,
    updateClip,
  } = useTimelineStore()

  const createTrack = useCallback((name: string, kind: 'video' | 'audio' = 'video') => {
    const track: Track = {
      id: `track-${Date.now()}`,
      name,
      kind,
      index: 0,
      clips: [],
      enabled: true,
      locked: false,
      solo: false,
      muted: false,
    }
    addTrack(track)
    return track
  }, [addTrack])

  const createClip = useCallback((
    trackId: string,
    clipData: Partial<Clip> & { name: string; sourceId: string }
  ) => {
    const now = new Date().toISOString()
    const clip: Clip = {
      id: `clip-${Date.now()}`,
      name: clipData.name,
      sourceId: clipData.sourceId,
      sourceRange: clipData.sourceRange || { start: { value: 0, rate: 30 }, duration: { value: 150, rate: 30 } },
      timelineRange: clipData.timelineRange || { start: { value: 0, rate: 30 }, duration: { value: 150, rate: 30 } },
      state: clipData.state || 'active',
      effects: clipData.effects || [],
      markers: clipData.markers || [],
      properties: clipData.properties || {},
      createdAt: now,
      updatedAt: now,
    }
    addClip(trackId, clip)
    return clip
  }, [addClip])

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId || !selectedTrackId) return
    removeClip(selectedTrackId, selectedClipId)
    selectClip(null)
  }, [selectedClipId, selectedTrackId, removeClip, selectClip])

  const deleteSelectedTrack = useCallback(() => {
    if (!selectedTrackId) return
    removeTrack(selectedTrackId)
    selectTrack(null)
  }, [selectedTrackId, removeTrack, selectTrack])

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, time))
  }, [setCurrentTime])

  const zoomIn = useCallback(() => {
    setZoom(zoom + 0.2)
  }, [zoom, setZoom])

  const zoomOut = useCallback(() => {
    setZoom(zoom - 0.2)
  }, [zoom, setZoom])

  const getSelectedClip = useCallback(() => {
    if (!timeline || !selectedClipId) return null
    for (const track of timeline.tracks) {
      const clip = track.clips.find(c => c.id === selectedClipId)
      if (clip) return { clip, track }
    }
    return null
  }, [timeline, selectedClipId])

  const getSelectedTrack = useCallback(() => {
    if (!timeline || !selectedTrackId) return null
    return timeline.tracks.find(t => t.id === selectedTrackId) || null
  }, [timeline, selectedTrackId])

  return {
    timeline,
    selectedClipId,
    selectedTrackId,
    currentTime,
    zoom,
    isPlaying,
    
    setTimeline,
    createTrack,
    deleteSelectedTrack,
    selectClip,
    selectTrack,
    
    createClip,
    deleteSelectedClip,
    updateClip,
    
    togglePlay,
    setIsPlaying,
    seekTo,
    setCurrentTime,
    
    zoomIn,
    zoomOut,
    setZoom,
    
    getSelectedClip,
    getSelectedTrack,
  }
}
