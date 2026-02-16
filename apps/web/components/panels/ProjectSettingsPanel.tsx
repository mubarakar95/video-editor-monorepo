"use client";

import { useEditorStore } from "@/stores/editor";

const RESOLUTION_PRESETS = [
  { name: "4K UHD", width: 3840, height: 2160 },
  { name: "1080p HD", width: 1920, height: 1080 },
  { name: "720p HD", width: 1280, height: 720 },
  { name: "480p", width: 854, height: 480 },
  { name: "360p", width: 640, height: 360 },
];

const FRAME_RATES = [24, 25, 30, 50, 60];

const ASPECT_RATIOS = ["16/9", "9/16", "4/3", "1/1", "21/9"];

export default function ProjectSettingsPanel() {
  const { projectName, settings, setProjectName, updateSettings } =
    useEditorStore();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300">Project Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Resolution Presets */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Resolution Preset
          </label>
          <div className="grid grid-cols-2 gap-1">
            {RESOLUTION_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  updateSettings({ width: preset.width, height: preset.height })
                }
                className={`px-2 py-1.5 text-xs rounded transition-colors ${
                  settings.width === preset.width &&
                  settings.height === preset.height
                    ? "bg-blue-600 text-white"
                    : "bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Resolution */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Custom Resolution
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={settings.width}
              onChange={(e) =>
                updateSettings({ width: Number(e.target.value) })
              }
              className="flex-1 bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
            />
            <span className="text-dark-400">×</span>
            <input
              type="number"
              value={settings.height}
              onChange={(e) =>
                updateSettings({ height: Number(e.target.value) })
              }
              className="flex-1 bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Aspect Ratio
          </label>
          <select
            value={settings.aspectRatio}
            onChange={(e) => updateSettings({ aspectRatio: e.target.value })}
            className="w-full bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">Frame Rate</label>
          <div className="flex gap-1">
            {FRAME_RATES.map((fps) => (
              <button
                key={fps}
                onClick={() => updateSettings({ frameRate: fps })}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  settings.frameRate === fps
                    ? "bg-blue-600 text-white"
                    : "bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white"
                }`}
              >
                {fps}
              </button>
            ))}
          </div>
        </div>

        {/* Bitrate */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Bitrate: {settings.bitrate} kbps
          </label>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={settings.bitrate}
            onChange={(e) =>
              updateSettings({ bitrate: Number(e.target.value) })
            }
            className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            <span>1 Mbps</span>
            <span>50 Mbps</span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-dark-800 rounded p-3 mt-4">
          <h3 className="text-xs font-medium text-dark-300 mb-2">
            Project Summary
          </h3>
          <div className="space-y-1 text-xs text-dark-400">
            <p>
              Resolution: {settings.width} × {settings.height}
            </p>
            <p>Frame Rate: {settings.frameRate} fps</p>
            <p>Aspect Ratio: {settings.aspectRatio}</p>
            <p>Bitrate: {settings.bitrate} kbps</p>
          </div>
        </div>
      </div>
    </div>
  );
}
