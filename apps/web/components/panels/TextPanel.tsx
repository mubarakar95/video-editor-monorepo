"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor";
import { useTimelineStore } from "@/stores";
import type { TextEffect } from "@/types/effects";

const FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Comic Sans MS",
];

export default function TextPanel() {
  const { addTextEffect, settings, tracks } = useEditorStore();
  const { currentTime } = useTimelineStore();
  const [text, setText] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [duration, setDuration] = useState(5);

  const generateId = () =>
    `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddText = () => {
    const textTrack = tracks.find((t) => t.kind === "text");
    if (!textTrack) return;

    const effect: TextEffect = {
      id: generateId(),
      type: "text",
      name: text.substring(0, 20) || "Text",
      trackId: textTrack.id,
      start: currentTime,
      duration,
      end: currentTime + duration,
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle: "normal",
      fill: [fillColor],
      stroke: strokeColor,
      strokeThickness: strokeWidth,
      align: "center",
      letterSpacing: 0,
      lineHeight: 1.2,
      dropShadow: false,
      dropShadowColor: "#000000",
      dropShadowBlur: 0,
      dropShadowDistance: 0,
      dropShadowAngle: 0,
      rect: {
        x: (settings.width - 400) / 2,
        y: (settings.height - fontSize) / 2,
        width: 400,
        height: fontSize * 1.5,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        pivotX: 0,
        pivotY: 0,
      },
    };

    addTextEffect(effect);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300">Text</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Text Content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full bg-dark-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Size: {fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="200"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">Weight</label>
          <div className="flex gap-1">
            <button
              onClick={() => setFontWeight("normal")}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                fontWeight === "normal"
                  ? "bg-blue-600 text-white"
                  : "bg-dark-700 text-dark-300"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setFontWeight("bold")}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                fontWeight === "bold"
                  ? "bg-blue-600 text-white"
                  : "bg-dark-700 text-dark-300"
              }`}
            >
              Bold
            </button>
          </div>
        </div>

        {/* Fill Color */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">Fill Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="flex-1 bg-dark-700 text-white text-xs rounded px-2 py-1"
            />
          </div>
        </div>

        {/* Stroke */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">Stroke</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <input
              type="range"
              min="0"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="flex-1 h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-dark-400 w-6">{strokeWidth}</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs text-dark-400 mb-1">
            Duration: {duration}s
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Preview */}
        <div className="bg-dark-800 rounded p-4">
          <div className="text-center">
            <span
              style={{
                fontFamily,
                fontSize: `${Math.min(fontSize, 32)}px`,
                fontWeight,
                color: fillColor,
                WebkitTextStroke:
                  strokeWidth > 0
                    ? `${strokeWidth}px ${strokeColor}`
                    : undefined,
              }}
            >
              {text || "Preview"}
            </span>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddText}
          className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Add Text to Timeline
        </button>
      </div>
    </div>
  );
}
