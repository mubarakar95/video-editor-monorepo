"use client";

import { useEditorStore } from "@/stores/editor";
import type { TransitionType, Transition } from "@/types/effects";

interface TransitionDefinition {
  type: TransitionType;
  name: string;
  icon: string;
}

const TRANSITIONS: TransitionDefinition[] = [
  { type: "fade", name: "Fade", icon: "◐" },
  { type: "dissolve", name: "Dissolve", icon: "◑" },
  { type: "wipe-left", name: "Wipe Left", icon: "◀" },
  { type: "wipe-right", name: "Wipe Right", icon: "▶" },
  { type: "wipe-up", name: "Wipe Up", icon: "△" },
  { type: "wipe-down", name: "Wipe Down", icon: "▽" },
  { type: "zoom-in", name: "Zoom In", icon: "⊕" },
  { type: "zoom-out", name: "Zoom Out", icon: "⊖" },
  { type: "slide-left", name: "Slide Left", icon: "⇤" },
  { type: "slide-right", name: "Slide Right", icon: "⇥" },
];

const generateId = () =>
  `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function TransitionsPanel() {
  const {
    selectedEffectId,
    effects,
    transitions,
    addTransition,
    removeTransition,
    updateTransition,
  } = useEditorStore();

  // Find adjacent clips for transition
  const getAdjacentClips = () => {
    if (!selectedEffectId) return null;

    const selectedEffect = effects.find((e) => e.id === selectedEffectId);
    if (!selectedEffect) return null;

    // Find clips that end where this one starts (incoming)
    const incomingClip = effects.find(
      (e) =>
        e.trackId === selectedEffect.trackId &&
        Math.abs(e.end - selectedEffect.start) < 0.1,
    );

    // Find clips that start where this one ends (outgoing)
    const outgoingClip = effects.find(
      (e) =>
        e.trackId === selectedEffect.trackId &&
        Math.abs(e.start - selectedEffect.end) < 0.1,
    );

    return { incomingClip, outgoingClip, currentClip: selectedEffect };
  };

  const adjacentClips = getAdjacentClips();

  const existingTransitions = transitions.filter(
    (t) =>
      t.fromEffectId === selectedEffectId || t.toEffectId === selectedEffectId,
  );

  const handleAddTransition = (type: TransitionType, toEffectId: string) => {
    if (!selectedEffectId) return;

    const transition: Transition = {
      id: generateId(),
      fromEffectId: selectedEffectId,
      toEffectId,
      type,
      duration: 0.5, // Default 0.5 seconds
    };

    addTransition(transition);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300">Transitions</h2>
      </div>

      {!selectedEffectId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-dark-500 text-center">
            Select a clip to add transitions
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Existing Transitions */}
          {existingTransitions.length > 0 && (
            <div>
              <label className="block text-xs text-dark-400 mb-2">
                Applied Transitions
              </label>
              <div className="space-y-2">
                {existingTransitions.map((transition) => {
                  const definition = TRANSITIONS.find(
                    (t) => t.type === transition.type,
                  );
                  const fromEffect = effects.find(
                    (e) => e.id === transition.fromEffectId,
                  );
                  const toEffect = effects.find(
                    (e) => e.id === transition.toEffectId,
                  );

                  return (
                    <div
                      key={transition.id}
                      className="bg-dark-700 rounded p-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{definition?.icon}</span>
                        <div>
                          <p className="text-xs text-white">
                            {definition?.name}
                          </p>
                          <p className="text-xs text-dark-500">
                            {transition.duration.toFixed(1)}s
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTransition(transition.id)}
                        className="text-dark-400 hover:text-red-400"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Incoming Transition */}
          {adjacentClips?.incomingClip && (
            <div>
              <label className="block text-xs text-dark-400 mb-2">
                Incoming from "{adjacentClips.incomingClip.name}"
              </label>
              <div className="grid grid-cols-2 gap-1">
                {TRANSITIONS.map((transition) => (
                  <button
                    key={transition.type}
                    onClick={() =>
                      handleAddTransition(
                        transition.type,
                        adjacentClips.incomingClip!.id,
                      )
                    }
                    className="flex items-center gap-2 p-2 bg-dark-700 rounded hover:bg-dark-600 text-left"
                  >
                    <span className="text-lg">{transition.icon}</span>
                    <span className="text-xs text-dark-300">
                      {transition.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Transition */}
          {adjacentClips?.outgoingClip && (
            <div>
              <label className="block text-xs text-dark-400 mb-2">
                Outgoing to "{adjacentClips.outgoingClip.name}"
              </label>
              <div className="grid grid-cols-2 gap-1">
                {TRANSITIONS.map((transition) => (
                  <button
                    key={transition.type}
                    onClick={() =>
                      handleAddTransition(
                        transition.type,
                        adjacentClips.outgoingClip!.id,
                      )
                    }
                    className="flex items-center gap-2 p-2 bg-dark-700 rounded hover:bg-dark-600 text-left"
                  >
                    <span className="text-lg">{transition.icon}</span>
                    <span className="text-xs text-dark-300">
                      {transition.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No adjacent clips message */}
          {!adjacentClips?.incomingClip &&
            !adjacentClips?.outgoingClip &&
            existingTransitions.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-dark-500">
                  No adjacent clips for transitions.
                </p>
                <p className="text-xs text-dark-600 mt-1">
                  Place clips next to each other on the timeline to add
                  transitions.
                </p>
              </div>
            )}

          {/* Transition Duration */}
          {existingTransitions.length > 0 && (
            <div>
              <label className="block text-xs text-dark-400 mb-1">
                Duration
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={existingTransitions[0]?.duration ?? 0.5}
                onChange={(e) => {
                  existingTransitions.forEach((t) => {
                    updateTransition(t.id, {
                      duration: Number(e.target.value),
                    });
                  });
                }}
                className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-xs text-dark-500 text-center mt-1">
                {(existingTransitions[0]?.duration ?? 0.5).toFixed(1)}s
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
