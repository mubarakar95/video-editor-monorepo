import type { Timeline, Track, Clip } from "@video-editor/timeline-schema";

interface HistoryState {
  timeline: Timeline | null;
  description: string;
  timestamp: number;
}

interface HistoryConfig {
  maxHistory: number;
}

export class TimelineHistory {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private maxHistory: number;

  constructor(config: HistoryConfig = { maxHistory: 50 }) {
    this.maxHistory = config.maxHistory;
  }

  pushState(timeline: Timeline | null, description: string): void {
    if (timeline) {
      this.undoStack.push({
        timeline: this.deepClone(timeline),
        description,
        timestamp: Date.now(),
      });

      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }

      this.redoStack = [];
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(currentTimeline: Timeline | null): Timeline | null {
    if (!this.canUndo()) return currentTimeline;

    if (currentTimeline) {
      this.redoStack.push({
        timeline: this.deepClone(currentTimeline),
        description: "Current state",
        timestamp: Date.now(),
      });
    }

    this.undoStack.pop();
    const previousState = this.undoStack[this.undoStack.length - 1];

    return previousState ? this.deepClone(previousState.timeline) : null;
  }

  redo(currentTimeline: Timeline | null): Timeline | null {
    if (!this.canRedo()) return currentTimeline;

    const nextState = this.redoStack.pop();

    if (nextState && currentTimeline) {
      this.undoStack.push({
        timeline: this.deepClone(currentTimeline),
        description: nextState.description,
        timestamp: Date.now(),
      });
    }

    return nextState ? this.deepClone(nextState.timeline) : null;
  }

  getUndoDescription(): string | null {
    if (this.undoStack.length < 2) return null;
    return this.undoStack[this.undoStack.length - 2]?.description || null;
  }

  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1]?.description || null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

export interface SelectionState {
  clipIds: string[];
  trackIds: string[];
  lastSelectedClipId: string | null;
  lastSelectedTrackId: string | null;
}

export class SelectionManager {
  private selection: SelectionState = {
    clipIds: [],
    trackIds: [],
    lastSelectedClipId: null,
    lastSelectedTrackId: null,
  };

  selectClip(clipId: string, addToSelection: boolean = false): void {
    if (addToSelection) {
      if (this.selection.clipIds.includes(clipId)) {
        this.selection.clipIds = this.selection.clipIds.filter(
          (id) => id !== clipId,
        );
      } else {
        this.selection.clipIds.push(clipId);
      }
    } else {
      this.selection.clipIds = [clipId];
    }
    this.selection.lastSelectedClipId = clipId;
  }

  selectClips(clipIds: string[], replace: boolean = true): void {
    if (replace) {
      this.selection.clipIds = [...clipIds];
    } else {
      const newIds = clipIds.filter(
        (id) => !this.selection.clipIds.includes(id),
      );
      this.selection.clipIds = [...this.selection.clipIds, ...newIds];
    }
    if (clipIds.length > 0) {
      this.selection.lastSelectedClipId = clipIds[clipIds.length - 1];
    }
  }

  selectTrack(trackId: string, addToSelection: boolean = false): void {
    if (addToSelection) {
      if (this.selection.trackIds.includes(trackId)) {
        this.selection.trackIds = this.selection.trackIds.filter(
          (id) => id !== trackId,
        );
      } else {
        this.selection.trackIds.push(trackId);
      }
    } else {
      this.selection.trackIds = [trackId];
    }
    this.selection.lastSelectedTrackId = trackId;
  }

  clearClipSelection(): void {
    this.selection.clipIds = [];
    this.selection.lastSelectedClipId = null;
  }

  clearTrackSelection(): void {
    this.selection.trackIds = [];
    this.selection.lastSelectedTrackId = null;
  }

  clearAll(): void {
    this.selection.clipIds = [];
    this.selection.trackIds = [];
    this.selection.lastSelectedClipId = null;
    this.selection.lastSelectedTrackId = null;
  }

  getSelectedClipIds(): string[] {
    return [...this.selection.clipIds];
  }

  getSelectedTrackIds(): string[] {
    return [...this.selection.trackIds];
  }

  getLastSelectedClipId(): string | null {
    return this.selection.lastSelectedClipId;
  }

  getLastSelectedTrackId(): string | null {
    return this.selection.lastSelectedTrackId;
  }

  isClipSelected(clipId: string): boolean {
    return this.selection.clipIds.includes(clipId);
  }

  isTrackSelected(trackId: string): boolean {
    return this.selection.trackIds.includes(trackId);
  }

  getSelection(): SelectionState {
    return { ...this.selection };
  }

  selectAllClips(timeline: Timeline | null): void {
    if (!timeline) return;
    const allClipIds: string[] = [];
    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        allClipIds.push(clip.id);
      }
    }
    this.selection.clipIds = allClipIds;
    if (allClipIds.length > 0) {
      this.selection.lastSelectedClipId = allClipIds[allClipIds.length - 1];
    }
  }
}

export interface ClipboardData {
  clips: Array<{ clip: Clip; trackId: string; trackKind: string }>;
  sourceTimelineId: string;
  cutTime: number;
}

export class ClipboardManager {
  private clipboard: ClipboardData | null = null;

  copy(
    timeline: Timeline | null,
    clipIds: string[],
    currentTime: number,
  ): void {
    if (!timeline || clipIds.length === 0) return;

    const clips: ClipboardData["clips"] = [];

    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        if (clipIds.includes(clip.id)) {
          clips.push({
            clip: JSON.parse(JSON.stringify(clip)),
            trackId: track.id,
            trackKind: track.kind,
          });
        }
      }
    }

    this.clipboard = {
      clips,
      sourceTimelineId: timeline.id,
      cutTime: currentTime,
    };
  }

  cut(
    timeline: Timeline | null,
    clipIds: string[],
    currentTime: number,
  ): ClipboardData | null {
    this.copy(timeline, clipIds, currentTime);
    return this.clipboard;
  }

  paste(
    timeline: Timeline | null,
    currentTime: number,
  ): Array<{ clip: Clip; trackId: string }> | null {
    if (!timeline || !this.clipboard) return null;

    const offset = currentTime - this.clipboard.cutTime;
    const result: Array<{ clip: Clip; trackId: string }> = [];

    for (const item of this.clipboard.clips) {
      const track = timeline.tracks.find(
        (t) => t.kind === item.trackKind && !t.locked,
      );

      if (track) {
        const newClip: Clip = JSON.parse(JSON.stringify(item.clip));
        newClip.id = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const originalStart =
          newClip.timelineRange.start.value / newClip.timelineRange.start.rate;
        const newStart = Math.max(0, originalStart + offset);
        const rate = newClip.timelineRange.start.rate;

        newClip.timelineRange.start = { value: newStart * rate, rate };
        newClip.createdAt = new Date().toISOString();
        newClip.updatedAt = new Date().toISOString();

        result.push({ clip: newClip, trackId: track.id });
      }
    }

    return result.length > 0 ? result : null;
  }

  hasClipboard(): boolean {
    return this.clipboard !== null && this.clipboard.clips.length > 0;
  }

  getClipboard(): ClipboardData | null {
    return this.clipboard ? { ...this.clipboard } : null;
  }

  clear(): void {
    this.clipboard = null;
  }
}

export const timelineHistory = new TimelineHistory();
export const selectionManager = new SelectionManager();
export const clipboardManager = new ClipboardManager();
