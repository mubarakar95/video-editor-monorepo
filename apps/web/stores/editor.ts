import { create } from "zustand";
import type {
  AnyEffect,
  TextEffect,
  VideoEffect,
  ImageEffect,
  AudioEffect,
  Filter,
  Transition,
  Animation,
  EditorTrack,
  ProjectSettings,
} from "@/types/effects";

interface EditorState {
  // Project
  projectName: string;
  settings: ProjectSettings;

  // Tracks
  tracks: EditorTrack[];

  // Effects (clips)
  effects: AnyEffect[];

  // Filters
  filters: Filter[];

  // Transitions
  transitions: Transition[];

  // Animations
  animations: Animation[];

  // Playback
  currentTime: number;
  isPlaying: boolean;
  duration: number;

  // Selection
  selectedEffectId: string | null;
  selectedTrackId: string | null;

  // Zoom
  zoom: number;

  // Export
  isExporting: boolean;
  exportProgress: number;
}

interface EditorActions {
  // Project
  setProjectName: (name: string) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;

  // Tracks
  addTrack: (kind: "video" | "audio" | "text") => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<EditorTrack>) => void;
  toggleTrackMuted: (id: string) => void;
  toggleTrackLocked: (id: string) => void;
  toggleTrackVisible: (id: string) => void;
  toggleTrackSolo: (id: string) => void;

  // Effects
  addTextEffect: (effect: TextEffect) => void;
  addVideoEffect: (effect: VideoEffect) => void;
  addImageEffect: (effect: ImageEffect) => void;
  addAudioEffect: (effect: AudioEffect) => void;
  removeEffect: (id: string) => void;
  updateEffect: (id: string, updates: Partial<AnyEffect>) => void;
  moveEffect: (id: string, trackId: string, startTime: number) => void;
  trimEffect: (id: string, side: "start" | "end", time: number) => void;
  splitEffect: (id: string, time: number) => void;

  // Filters
  addFilter: (filter: Filter) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, value: number) => void;
  getFiltersForEffect: (effectId: string) => Filter[];

  // Transitions
  addTransition: (transition: Transition) => void;
  removeTransition: (id: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;

  // Animations
  addAnimation: (animation: Animation) => void;
  removeAnimation: (id: string) => void;
  getAnimationsForEffect: (effectId: string) => Animation[];

  // Playback
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;

  // Selection
  selectEffect: (id: string | null) => void;
  selectTrack: (id: string | null) => void;

  // Zoom
  setZoom: (zoom: number) => void;

  // Export
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;

  // Utility
  getEffect: (id: string) => AnyEffect | undefined;
  getTrackEffects: (trackId: string) => AnyEffect[];
  recalculateDuration: () => void;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultSettings: ProjectSettings = {
  name: "Untitled Project",
  width: 1920,
  height: 1080,
  frameRate: 30,
  aspectRatio: "16/9",
  bitrate: 8000,
};

const defaultTracks: EditorTrack[] = [
  {
    id: generateId(),
    name: "Video 1",
    kind: "video",
    index: 0,
    muted: false,
    locked: false,
    visible: true,
    solo: false,
  },
  {
    id: generateId(),
    name: "Audio 1",
    kind: "audio",
    index: 1,
    muted: false,
    locked: false,
    visible: true,
    solo: false,
  },
  {
    id: generateId(),
    name: "Text 1",
    kind: "text",
    index: 2,
    muted: false,
    locked: false,
    visible: true,
    solo: false,
  },
];

export const useEditorStore = create<EditorState & EditorActions>(
  (set, get) => ({
    // Initial state
    projectName: "Untitled Project",
    settings: defaultSettings,
    tracks: defaultTracks,
    effects: [],
    filters: [],
    transitions: [],
    animations: [],
    currentTime: 0,
    isPlaying: false,
    duration: 0,
    selectedEffectId: null,
    selectedTrackId: null,
    zoom: 1,
    isExporting: false,
    exportProgress: 0,

    // Project actions
    setProjectName: (name) => set({ projectName: name }),
    updateSettings: (updates) =>
      set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

    // Track actions
    addTrack: (kind) =>
      set((state) => {
        const newIndex = state.tracks.length;
        const count = state.tracks.filter((t) => t.kind === kind).length + 1;
        return {
          tracks: [
            ...state.tracks,
            {
              id: generateId(),
              name: `${kind.charAt(0).toUpperCase() + kind.slice(1)} ${count}`,
              kind,
              index: newIndex,
              muted: false,
              locked: false,
              visible: true,
              solo: false,
            },
          ],
        };
      }),
    removeTrack: (id) =>
      set((state) => ({
        tracks: state.tracks.filter((t) => t.id !== id),
        effects: state.effects.filter((e) => e.trackId !== id),
      })),
    updateTrack: (id, updates) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        ),
      })),
    toggleTrackMuted: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, muted: !t.muted } : t,
        ),
      })),
    toggleTrackLocked: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, locked: !t.locked } : t,
        ),
      })),
    toggleTrackVisible: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, visible: !t.visible } : t,
        ),
      })),
    toggleTrackSolo: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, solo: !t.solo } : t,
        ),
      })),

    // Effect actions
    addTextEffect: (effect) =>
      set((state) => ({ effects: [...state.effects, effect] })),
    addVideoEffect: (effect) =>
      set((state) => ({ effects: [...state.effects, effect] })),
    addImageEffect: (effect) =>
      set((state) => ({ effects: [...state.effects, effect] })),
    addAudioEffect: (effect) =>
      set((state) => ({ effects: [...state.effects, effect] })),
    removeEffect: (id) =>
      set((state) => ({
        effects: state.effects.filter((e) => e.id !== id),
        filters: state.filters.filter((f) => f.targetEffectId !== id),
        animations: state.animations.filter((a) => a.targetEffectId !== id),
        transitions: state.transitions.filter(
          (t) => t.fromEffectId !== id && t.toEffectId !== id,
        ),
        selectedEffectId:
          state.selectedEffectId === id ? null : state.selectedEffectId,
      })),
    updateEffect: (id, updates) =>
      set((state) => ({
        effects: state.effects.map((e) =>
          e.id === id ? ({ ...e, ...updates } as AnyEffect) : e,
        ),
      })),
    moveEffect: (id, trackId, startTime) =>
      set((state) => ({
        effects: state.effects.map((e) =>
          e.id === id
            ? ({
                ...e,
                trackId,
                start: startTime,
                end: startTime + e.duration,
              } as AnyEffect)
            : e,
        ),
      })),
    trimEffect: (id, side, time) =>
      set((state) => {
        const effect = state.effects.find((e) => e.id === id);
        if (!effect) return state;

        if (side === "start") {
          const newDuration = effect.end - time;
          return {
            effects: state.effects.map((e) =>
              e.id === id
                ? ({ ...e, start: time, duration: newDuration } as AnyEffect)
                : e,
            ),
          };
        } else {
          const newDuration = time - effect.start;
          return {
            effects: state.effects.map((e) =>
              e.id === id
                ? ({ ...e, end: time, duration: newDuration } as AnyEffect)
                : e,
            ),
          };
        }
      }),
    splitEffect: (id, time) =>
      set((state) => {
        const effect = state.effects.find((e) => e.id === id);
        if (!effect || time <= effect.start || time >= effect.end) return state;

        const firstDuration = time - effect.start;
        const secondDuration = effect.end - time;

        const firstPart = { ...effect, duration: firstDuration, end: time };
        const secondPart = {
          ...effect,
          id: generateId(),
          start: time,
          duration: secondDuration,
          end: effect.end,
        };

        return {
          effects: [
            ...state.effects.filter((e) => e.id !== id),
            firstPart,
            secondPart,
          ] as AnyEffect[],
        };
      }),

    // Filter actions
    addFilter: (filter) =>
      set((state) => ({ filters: [...state.filters, filter] })),
    removeFilter: (id) =>
      set((state) => ({ filters: state.filters.filter((f) => f.id !== id) })),
    updateFilter: (id, value) =>
      set((state) => ({
        filters: state.filters.map((f) => (f.id === id ? { ...f, value } : f)),
      })),
    getFiltersForEffect: (effectId) =>
      get().filters.filter((f) => f.targetEffectId === effectId),

    // Transition actions
    addTransition: (transition) =>
      set((state) => ({ transitions: [...state.transitions, transition] })),
    removeTransition: (id) =>
      set((state) => ({
        transitions: state.transitions.filter((t) => t.id !== id),
      })),
    updateTransition: (id, updates) =>
      set((state) => ({
        transitions: state.transitions.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        ),
      })),

    // Animation actions
    addAnimation: (animation) =>
      set((state) => ({ animations: [...state.animations, animation] })),
    removeAnimation: (id) =>
      set((state) => ({
        animations: state.animations.filter((a) => a.id !== id),
      })),
    getAnimationsForEffect: (effectId) =>
      get().animations.filter((a) => a.targetEffectId === effectId),

    // Playback actions
    setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setDuration: (duration) => set({ duration }),

    // Selection actions
    selectEffect: (id) => set({ selectedEffectId: id }),
    selectTrack: (id) => set({ selectedTrackId: id }),

    // Zoom
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 10)) }),

    // Export
    setIsExporting: (exporting) => set({ isExporting: exporting }),
    setExportProgress: (progress) => set({ exportProgress: progress }),

    // Utility
    getEffect: (id) => get().effects.find((e) => e.id === id),
    getTrackEffects: (trackId) =>
      get().effects.filter((e) => e.trackId === trackId),
    recalculateDuration: () => {
      const effects = get().effects;
      const maxEnd = effects.reduce((max, e) => Math.max(max, e.end), 0);
      set({ duration: maxEnd });
    },
  }),
);
