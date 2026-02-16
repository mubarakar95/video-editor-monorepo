"use client";

import { useEffect, useCallback } from "react";
import { useTimelineStore } from "@/stores";

export function useTimelineKeyboard() {
  const {
    timeline,
    selectedClipIds,
    isPlaying,
    currentTime,
    zoom,
    canUndo,
    canRedo,
    undo,
    redo,
    setIsPlaying,
    setCurrentTime,
    setZoom,
    deleteSelectedClips,
    copySelectedClips,
    cutSelectedClips,
    pasteClips,
    duplicateSelectedClips,
    selectClip,
    splitClip,
    toggleSnapping,
  } = useTimelineStore();

  const getFrameRate = useCallback(() => {
    return timeline?.metadata?.frameRate || 30;
  }, [timeline?.metadata?.frameRate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if (isInputFocused) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;

          case "y":
            e.preventDefault();
            if (canRedo()) redo();
            break;

          case "c":
            e.preventDefault();
            copySelectedClips();
            break;

          case "x":
            e.preventDefault();
            cutSelectedClips();
            break;

          case "v":
            e.preventDefault();
            pasteClips();
            break;

          case "d":
            e.preventDefault();
            duplicateSelectedClips();
            break;

          case "a":
            e.preventDefault();
            if (timeline) {
              const allClipIds = timeline.tracks.flatMap((t) =>
                t.clips.map((c) => c.id),
              );
              selectClip(allClipIds.length > 0 ? allClipIds[0] : null);
              for (const id of allClipIds.slice(1)) {
                selectClip(id, true);
              }
            }
            break;

          case "s":
            e.preventDefault();
            toggleSnapping();
            break;
        }
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case "Delete":
        case "Backspace":
          e.preventDefault();
          deleteSelectedClips();
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            setCurrentTime(currentTime - 1);
          } else {
            setCurrentTime(currentTime - 1 / getFrameRate());
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            setCurrentTime(currentTime + 1);
          } else {
            setCurrentTime(currentTime + 1 / getFrameRate());
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          setZoom(Math.min(zoom + 0.1, 10));
          break;

        case "ArrowDown":
          e.preventDefault();
          setZoom(Math.max(zoom - 0.1, 0.1));
          break;

        case "Home":
          e.preventDefault();
          setCurrentTime(0);
          break;

        case "End":
          e.preventDefault();
          if (timeline) {
            let maxTime = 0;
            for (const track of timeline.tracks) {
              for (const clip of track.clips) {
                const endTime =
                  clip.timelineRange.start.value /
                    clip.timelineRange.start.rate +
                  clip.timelineRange.duration.value /
                    clip.timelineRange.duration.rate;
                maxTime = Math.max(maxTime, endTime);
              }
            }
            setCurrentTime(maxTime);
          }
          break;

        case "s":
        case "S":
          if (selectedClipIds.length === 1 && timeline) {
            e.preventDefault();
            for (const track of timeline.tracks) {
              const clip = track.clips.find((c) => c.id === selectedClipIds[0]);
              if (clip) {
                splitClip(track.id, clip.id, currentTime);
                break;
              }
            }
          }
          break;

        case "j":
        case "J":
          e.preventDefault();
          setCurrentTime(currentTime - 1 / getFrameRate());
          break;

        case "k":
        case "K":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case "l":
        case "L":
          e.preventDefault();
          setCurrentTime(currentTime + 1 / getFrameRate());
          break;

        case "+":
        case "=":
          e.preventDefault();
          setZoom(Math.min(zoom + 0.2, 10));
          break;

        case "-":
        case "_":
          e.preventDefault();
          setZoom(Math.max(zoom - 0.2, 0.1));
          break;

        case "Escape":
          e.preventDefault();
          selectClip(null);
          break;
      }
    },
    [
      isPlaying,
      currentTime,
      zoom,
      canUndo,
      canRedo,
      timeline,
      selectedClipIds,
      undo,
      redo,
      setIsPlaying,
      setCurrentTime,
      setZoom,
      deleteSelectedClips,
      copySelectedClips,
      cutSelectedClips,
      pasteClips,
      duplicateSelectedClips,
      selectClip,
      splitClip,
      toggleSnapping,
      getFrameRate,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
