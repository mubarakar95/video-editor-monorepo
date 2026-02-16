import { create } from "zustand";
import type { Timeline, Track, Clip } from "@video-editor/timeline-schema";
import {
  TimelineHistory,
  SelectionManager,
  ClipboardManager,
} from "@/lib/timeline/history";

interface TimelineState {
  timeline: Timeline | null;
  selectedClipIds: string[];
  selectedTrackIds: string[];
  currentTime: number;
  zoom: number;
  isPlaying: boolean;
  isSnapping: boolean;
  snapThreshold: number;
  scrollX: number;
  isDragging: boolean;
  isTrimming: boolean;
  activeTrimSide: "start" | "end" | null;
  history: TimelineHistory;
  selection: SelectionManager;
  clipboard: ClipboardManager;
}

interface TimelineActions {
  setTimeline: (timeline: Timeline) => void;
  updateTimeline: (updates: Partial<Timeline>) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  moveClip: (
    fromTrackId: string,
    toTrackId: string,
    clipId: string,
    newStartTime: number,
  ) => void;
  trimClip: (
    trackId: string,
    clipId: string,
    side: "start" | "end",
    newTime: number,
  ) => void;
  splitClip: (trackId: string, clipId: string, splitTime: number) => void;
  deleteClip: (trackId: string, clipId: string) => void;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  selectClip: (clipId: string | null, addToSelection?: boolean) => void;
  selectClips: (clipIds: string[], replace?: boolean) => void;
  selectTrack: (trackId: string | null, addToSelection?: boolean) => void;
  deselectAll: () => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleSnapping: () => void;
  setSnapThreshold: (threshold: number) => void;
  setScrollX: (scrollX: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsTrimming: (isTrimming: boolean, side?: "start" | "end" | null) => void;
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  copySelectedClips: () => void;
  cutSelectedClips: () => void;
  pasteClips: () => void;
  duplicateSelectedClips: () => void;
  deleteSelectedClips: () => void;
}

type TimelineStore = TimelineState & TimelineActions;

const initialState: TimelineState = {
  timeline: null,
  selectedClipIds: [],
  selectedTrackIds: [],
  currentTime: 0,
  zoom: 1,
  isPlaying: false,
  isSnapping: true,
  snapThreshold: 0.05,
  scrollX: 0,
  isDragging: false,
  isTrimming: false,
  activeTrimSide: null,
  history: new TimelineHistory(),
  selection: new SelectionManager(),
  clipboard: new ClipboardManager(),
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  ...initialState,

  setTimeline: (timeline) => {
    const state = get();
    state.history.pushState(state.timeline, "Load project");
    set({ timeline });
  },

  updateTimeline: (updates) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Update timeline");
      return {
        timeline: {
          ...state.timeline,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  updateClip: (trackId, clipId, updates) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Update clip");
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === clipId
                      ? {
                          ...clip,
                          ...updates,
                          updatedAt: new Date().toISOString(),
                        }
                      : clip,
                  ),
                }
              : track,
          ),
        },
      };
    }),

  moveClip: (fromTrackId, toTrackId, clipId, newStartTime) => {
    const state = get();
    if (!state.timeline) return;
    state.history.pushState(state.timeline, "Move clip");

    let movedClip: Clip | undefined;
    const tracks = state.timeline.tracks.map((track) => {
      if (track.id === fromTrackId) {
        const filteredClips: Clip[] = [];
        for (const clip of track.clips) {
          if (clip.id === clipId) {
            movedClip = clip;
          } else {
            filteredClips.push(clip);
          }
        }
        return { ...track, clips: filteredClips };
      }
      return track;
    });

    if (movedClip) {
      const rate = movedClip.timelineRange.start.rate;
      const updatedClip: Clip = {
        ...movedClip,
        timelineRange: {
          ...movedClip.timelineRange,
          start: { value: newStartTime * rate, rate },
        },
        updatedAt: new Date().toISOString(),
      };

      const updatedTracks = tracks.map((track) => {
        if (track.id === toTrackId) {
          return { ...track, clips: [...track.clips, updatedClip] };
        }
        return track;
      });

      set({
        timeline: {
          ...state.timeline,
          tracks: updatedTracks,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  },

  trimClip: (trackId, clipId, side, newTime) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, `Trim clip ${side}`);

      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) => {
                    if (clip.id !== clipId) return clip;

                    const rate = clip.timelineRange.start.rate;
                    const currentStart = clip.timelineRange.start.value / rate;
                    const currentDuration =
                      clip.timelineRange.duration.value / rate;

                    if (side === "start") {
                      const newDuration =
                        currentStart + currentDuration - newTime;
                      return {
                        ...clip,
                        timelineRange: {
                          start: { value: newTime * rate, rate },
                          duration: { value: newDuration * rate, rate },
                        },
                        sourceRange: {
                          ...clip.sourceRange,
                          start: {
                            value:
                              clip.sourceRange.start.value +
                              (newTime - currentStart) *
                                clip.sourceRange.start.rate,
                            rate: clip.sourceRange.start.rate,
                          },
                        },
                        updatedAt: new Date().toISOString(),
                      };
                    } else {
                      const newDuration = newTime - currentStart;
                      return {
                        ...clip,
                        timelineRange: {
                          ...clip.timelineRange,
                          duration: { value: newDuration * rate, rate },
                        },
                        updatedAt: new Date().toISOString(),
                      };
                    }
                  }),
                }
              : track,
          ),
        },
      };
    }),

  splitClip: (trackId, clipId, splitTime) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Split clip");

      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) => {
            if (track.id !== trackId) return track;

            const clipIndex = track.clips.findIndex((c) => c.id === clipId);
            if (clipIndex === -1) return track;

            const clip = track.clips[clipIndex];
            const rate = clip.timelineRange.start.rate;
            const startTime = clip.timelineRange.start.value / rate;
            const duration = clip.timelineRange.duration.value / rate;
            const relativeSplit = splitTime - startTime;

            if (relativeSplit <= 0 || relativeSplit >= duration) return track;

            const clip1: Clip = {
              ...clip,
              timelineRange: {
                start: clip.timelineRange.start,
                duration: { value: relativeSplit * rate, rate },
              },
              updatedAt: new Date().toISOString(),
            };

            const clip2: Clip = {
              ...clip,
              id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timelineRange: {
                start: { value: splitTime * rate, rate },
                duration: { value: (duration - relativeSplit) * rate, rate },
              },
              sourceRange: {
                start: {
                  value:
                    clip.sourceRange.start.value +
                    relativeSplit * clip.sourceRange.start.rate,
                  rate: clip.sourceRange.start.rate,
                },
                duration: {
                  value:
                    (duration - relativeSplit) * clip.sourceRange.duration.rate,
                  rate: clip.sourceRange.duration.rate,
                },
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const newClips = [...track.clips];
            newClips.splice(clipIndex, 1, clip1, clip2);

            return { ...track, clips: newClips };
          }),
        },
      };
    }),

  deleteClip: (trackId, clipId) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Delete clip");
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  clips: track.clips.filter((clip) => clip.id !== clipId),
                }
              : track,
          ),
        },
        selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
      };
    }),

  addTrack: (track) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Add track");
      return {
        timeline: {
          ...state.timeline,
          tracks: [...state.timeline.tracks, track],
        },
      };
    }),

  removeTrack: (trackId) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Remove track");
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.filter((track) => track.id !== trackId),
        },
        selectedTrackIds: state.selectedTrackIds.filter((id) => id !== trackId),
      };
    }),

  updateTrack: (trackId, updates) =>
    set((state) => {
      if (!state.timeline) return state;
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId ? { ...track, ...updates } : track,
          ),
        },
      };
    }),

  selectClip: (clipId, addToSelection = false) =>
    set((state) => {
      if (!clipId) {
        return { selectedClipIds: [] };
      }

      if (addToSelection) {
        const isSelected = state.selectedClipIds.includes(clipId);
        return {
          selectedClipIds: isSelected
            ? state.selectedClipIds.filter((id) => id !== clipId)
            : [...state.selectedClipIds, clipId],
        };
      }

      return { selectedClipIds: [clipId] };
    }),

  selectClips: (clipIds, replace = true) =>
    set(() => ({
      selectedClipIds: replace ? clipIds : clipIds,
    })),

  selectTrack: (trackId, addToSelection = false) =>
    set((state) => {
      if (!trackId) {
        return { selectedTrackIds: [] };
      }

      if (addToSelection) {
        const isSelected = state.selectedTrackIds.includes(trackId);
        return {
          selectedTrackIds: isSelected
            ? state.selectedTrackIds.filter((id) => id !== trackId)
            : [...state.selectedTrackIds, trackId],
        };
      }

      return { selectedTrackIds: [trackId] };
    }),

  deselectAll: () =>
    set({
      selectedClipIds: [],
      selectedTrackIds: [],
    }),

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 10)) }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  toggleSnapping: () => set((state) => ({ isSnapping: !state.isSnapping })),

  setSnapThreshold: (threshold) => set({ snapThreshold: threshold }),

  setScrollX: (scrollX) => set({ scrollX }),

  setIsDragging: (isDragging) => set({ isDragging }),

  setIsTrimming: (isTrimming, side = null) =>
    set({ isTrimming, activeTrimSide: isTrimming ? side : null }),

  addClip: (trackId, clip) =>
    set((state) => {
      if (!state.timeline) return state;
      state.history.pushState(state.timeline, "Add clip");
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? { ...track, clips: [...track.clips, clip] }
              : track,
          ),
        },
      };
    }),

  removeClip: (trackId, clipId) =>
    set((state) => {
      if (!state.timeline) return state;
      return {
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  clips: track.clips.filter((clip) => clip.id !== clipId),
                }
              : track,
          ),
        },
      };
    }),

  undo: () => {
    const state = get();
    const previousTimeline = state.history.undo(state.timeline);
    if (previousTimeline) {
      set({ timeline: previousTimeline });
    }
  },

  redo: () => {
    const state = get();
    const nextTimeline = state.history.redo(state.timeline);
    if (nextTimeline) {
      set({ timeline: nextTimeline });
    }
  },

  canUndo: () => get().history.canUndo(),

  canRedo: () => get().history.canRedo(),

  copySelectedClips: () => {
    const state = get();
    state.clipboard.copy(
      state.timeline,
      state.selectedClipIds,
      state.currentTime,
    );
  },

  cutSelectedClips: () => {
    const state = get();
    const data = state.clipboard.cut(
      state.timeline,
      state.selectedClipIds,
      state.currentTime,
    );
    if (data) {
      state.history.pushState(state.timeline, "Cut clips");
      for (const item of data.clips) {
        get().deleteClip(item.trackId, item.clip.id);
      }
    }
  },

  pasteClips: () => {
    const state = get();
    const result = state.clipboard.paste(state.timeline, state.currentTime);
    if (result) {
      state.history.pushState(state.timeline, "Paste clips");
      for (const item of result) {
        get().addClip(item.trackId, item.clip);
      }
      set({
        selectedClipIds: result.map((r) => r.clip.id),
      });
    }
  },

  duplicateSelectedClips: () => {
    const state = get();
    if (!state.timeline || state.selectedClipIds.length === 0) return;

    state.history.pushState(state.timeline, "Duplicate clips");
    const newClipIds: string[] = [];

    for (const track of state.timeline.tracks) {
      for (const clip of track.clips) {
        if (state.selectedClipIds.includes(clip.id)) {
          const newClip: Clip = {
            ...clip,
            id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timelineRange: {
              ...clip.timelineRange,
              start: {
                value:
                  clip.timelineRange.start.value +
                  clip.timelineRange.duration.value,
                rate: clip.timelineRange.start.rate,
              },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          get().addClip(track.id, newClip);
          newClipIds.push(newClip.id);
        }
      }
    }

    set({ selectedClipIds: newClipIds });
  },

  deleteSelectedClips: () => {
    const state = get();
    if (!state.timeline || state.selectedClipIds.length === 0) return;

    state.history.pushState(state.timeline, "Delete clips");

    const updatedTracks = state.timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter(
        (clip) => !state.selectedClipIds.includes(clip.id),
      ),
    }));

    set({
      timeline: {
        ...state.timeline,
        tracks: updatedTracks,
        updatedAt: new Date().toISOString(),
      },
      selectedClipIds: [],
    });
  },
}));
