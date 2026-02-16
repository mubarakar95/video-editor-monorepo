"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTimelineStore } from "@/stores";
import type { Clip, Track } from "@video-editor/timeline-schema";

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface TimelineContextMenuProps {
  onOpenProperties?: (clip: Clip) => void;
  onOpenEffects?: (clip: Clip) => void;
}

export default function TimelineContextMenu({
  onOpenProperties,
  onOpenEffects,
}: TimelineContextMenuProps) {
  const {
    timeline,
    selectedClipIds,
    deleteSelectedClips,
    copySelectedClips,
    cutSelectedClips,
    pasteClips,
    duplicateSelectedClips,
    updateClip,
    selectClip,
  } = useTimelineStore();

  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [contextClip, setContextClip] = useState<{
    clip: Clip;
    track: Track;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clipBlock = target.closest("[data-clip-id]");

      if (clipBlock) {
        e.preventDefault();
        const clipId = clipBlock.getAttribute("data-clip-id");

        if (clipId && timeline) {
          for (const track of timeline.tracks) {
            const clip = track.clips.find((c) => c.id === clipId);
            if (clip) {
              setContextClip({ clip, track });
              setPosition({ x: e.clientX, y: e.clientY });

              if (!selectedClipIds.includes(clipId)) {
                selectClip(clipId);
              }
              break;
            }
          }
        }
      } else if (target.closest("[data-timeline-area]")) {
        e.preventDefault();
        setContextClip(null);
        setPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [timeline, selectedClipIds, selectClip],
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setPosition(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleContextMenu, handleClickOutside]);

  const handleDelete = useCallback(() => {
    deleteSelectedClips();
    setPosition(null);
  }, [deleteSelectedClips]);

  const handleCopy = useCallback(() => {
    copySelectedClips();
    setPosition(null);
  }, [copySelectedClips]);

  const handleCut = useCallback(() => {
    cutSelectedClips();
    setPosition(null);
  }, [cutSelectedClips]);

  const handlePaste = useCallback(() => {
    pasteClips();
    setPosition(null);
  }, [pasteClips]);

  const handleDuplicate = useCallback(() => {
    duplicateSelectedClips();
    setPosition(null);
  }, [duplicateSelectedClips]);

  const handleMute = useCallback(() => {
    if (contextClip) {
      updateClip(contextClip.track.id, contextClip.clip.id, {
        state: contextClip.clip.state === "muted" ? "active" : "muted",
      });
    }
    setPosition(null);
  }, [contextClip, updateClip]);

  const handleProperties = useCallback(() => {
    if (contextClip && onOpenProperties) {
      onOpenProperties(contextClip.clip);
    }
    setPosition(null);
  }, [contextClip, onOpenProperties]);

  const handleEffects = useCallback(() => {
    if (contextClip && onOpenEffects) {
      onOpenEffects(contextClip.clip);
    }
    setPosition(null);
  }, [contextClip, onOpenEffects]);

  if (!position) return null;

  const menuItems = contextClip
    ? [
        { label: "Cut", shortcut: "Ctrl+X", onClick: handleCut },
        { label: "Copy", shortcut: "Ctrl+C", onClick: handleCopy },
        { label: "Duplicate", shortcut: "Ctrl+D", onClick: handleDuplicate },
        { type: "separator" },
        {
          label: "Delete",
          shortcut: "Del",
          onClick: handleDelete,
          danger: true,
        },
        { type: "separator" },
        {
          label: contextClip.clip.state === "muted" ? "Unmute" : "Mute",
          onClick: handleMute,
        },
        { type: "separator" },
        { label: "Properties", onClick: handleProperties },
        { label: "Effects", onClick: handleEffects },
      ]
    : [
        { label: "Paste", shortcut: "Ctrl+V", onClick: handlePaste },
        { type: "separator" },
        {
          label: "Select All",
          shortcut: "Ctrl+A",
          onClick: () => setPosition(null),
        },
      ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 py-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === "separator") {
          return <div key={index} className="my-1 border-t border-dark-600" />;
        }

        return (
          <button
            key={index}
            className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-dark-700 ${
              item.danger ? "text-red-400 hover:text-red-300" : "text-white"
            }`}
            onClick={item.onClick}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-dark-400 text-xs ml-4">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
