"use client";

import { useCallback } from "react";
import { useTimelineStore } from "@/stores";
import type { Track, Clip } from "@video-editor/timeline-schema";

export function useTimeline() {
  const {
    timeline,
    selectedClipIds,
    selectedTrackIds,
    currentTime,
    zoom,
    isPlaying,
    isSnapping,
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
    undo,
    redo,
    canUndo,
    canRedo,
    toggleSnapping,
    copySelectedClips,
    cutSelectedClips,
    pasteClips,
    duplicateSelectedClips,
    deleteSelectedClips,
  } = useTimelineStore();

  const createTrack = useCallback(
    (name: string, kind: "video" | "audio" = "video") => {
      const track: Track = {
        id: `track-${Date.now()}`,
        name,
        kind,
        index: timeline?.tracks.length || 0,
        clips: [],
        enabled: true,
        locked: false,
        solo: false,
        muted: false,
      };
      addTrack(track);
      return track;
    },
    [addTrack, timeline?.tracks.length],
  );

  const createClip = useCallback(
    (
      trackId: string,
      clipData: Partial<Clip> & { name: string; sourceId: string },
    ) => {
      const now = new Date().toISOString();
      const frameRate = timeline?.metadata?.frameRate || 30;

      const clip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: clipData.name,
        sourceId: clipData.sourceId,
        sourceRange: clipData.sourceRange || {
          start: { value: 0, rate: frameRate },
          duration: { value: 150, rate: frameRate },
        },
        timelineRange: clipData.timelineRange || {
          start: { value: 0, rate: frameRate },
          duration: { value: 150, rate: frameRate },
        },
        state: clipData.state || "active",
        effects: clipData.effects || [],
        markers: clipData.markers || [],
        properties: clipData.properties || {},
        createdAt: now,
        updatedAt: now,
      };
      addClip(trackId, clip);
      return clip;
    },
    [addClip, timeline?.metadata?.frameRate],
  );

  const deleteSelectedClip = useCallback(() => {
    deleteSelectedClips();
  }, [deleteSelectedClips]);

  const deleteSelectedTrack = useCallback(() => {
    if (selectedTrackIds.length === 0) return;
    for (const trackId of selectedTrackIds) {
      removeTrack(trackId);
    }
    selectTrack(null);
  }, [selectedTrackIds, removeTrack, selectTrack]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const seekTo = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, time));
    },
    [setCurrentTime],
  );

  const zoomIn = useCallback(() => {
    setZoom(zoom + 0.2);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom - 0.2);
  }, [zoom, setZoom]);

  const getSelectedClip = useCallback(() => {
    if (!timeline || selectedClipIds.length === 0) return null;
    const clipId = selectedClipIds[0];
    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return { clip, track };
    }
    return null;
  }, [timeline, selectedClipIds]);

  const getSelectedClips = useCallback(() => {
    if (!timeline || selectedClipIds.length === 0) return [];
    const result: Array<{ clip: Clip; track: Track }> = [];
    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        if (selectedClipIds.includes(clip.id)) {
          result.push({ clip, track });
        }
      }
    }
    return result;
  }, [timeline, selectedClipIds]);

  const getSelectedTrack = useCallback(() => {
    if (!timeline || selectedTrackIds.length === 0) return null;
    return timeline.tracks.find((t) => t.id === selectedTrackIds[0]) || null;
  }, [timeline, selectedTrackIds]);

  const getFrameRate = useCallback(() => {
    return timeline?.metadata?.frameRate || 30;
  }, [timeline?.metadata?.frameRate]);

  return {
    timeline,
    selectedClipIds,
    selectedTrackIds,
    currentTime,
    zoom,
    isPlaying,
    isSnapping,

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
    getSelectedClips,
    getSelectedTrack,
    getFrameRate,

    undo,
    redo,
    canUndo,
    canRedo,

    toggleSnapping,
    copySelectedClips,
    cutSelectedClips,
    pasteClips,
    duplicateSelectedClips,
    deleteSelectedClips,
  };
}
