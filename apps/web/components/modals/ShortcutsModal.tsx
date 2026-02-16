"use client";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "Playback",
    shortcuts: [
      { key: "Space", action: "Play/Pause" },
      { key: "J", action: "Reverse playback" },
      { key: "K", action: "Pause" },
      { key: "L", action: "Forward playback" },
      { key: "Home", action: "Go to start" },
      { key: "End", action: "Go to end" },
      { key: "←", action: "Previous frame" },
      { key: "→", action: "Next frame" },
    ],
  },
  {
    category: "Editing",
    shortcuts: [
      { key: "Ctrl+Z", action: "Undo" },
      { key: "Ctrl+Shift+Z", action: "Redo" },
      { key: "Ctrl+C", action: "Copy clip" },
      { key: "Ctrl+X", action: "Cut clip" },
      { key: "Ctrl+V", action: "Paste clip" },
      { key: "Delete", action: "Delete selected" },
      { key: "S", action: "Split clip at playhead" },
      { key: "T", action: "Add text" },
    ],
  },
  {
    category: "Timeline",
    shortcuts: [
      { key: "Ctrl+S", action: "Toggle snapping" },
      { key: "+", action: "Zoom in" },
      { key: "-", action: "Zoom out" },
      { key: "Ctrl+A", action: "Select all" },
      { key: "Escape", action: "Deselect all" },
    ],
  },
  {
    category: "Tools",
    shortcuts: [
      { key: "V", action: "Selection tool" },
      { key: "C", action: "Cut tool" },
      { key: "H", action: "Hand tool (pan)" },
      { key: "Z", action: "Zoom tool" },
    ],
  },
];

export default function ShortcutsModal({
  isOpen,
  onClose,
}: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">
            Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUTS.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-dark-400">
                        {shortcut.action}
                      </span>
                      <kbd className="px-2 py-0.5 bg-dark-700 text-dark-300 text-xs rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
