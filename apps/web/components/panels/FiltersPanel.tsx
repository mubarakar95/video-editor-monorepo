"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor";
import type { FilterType, Filter } from "@/types/effects";

interface FilterDefinition {
  type: FilterType;
  name: string;
  min: number;
  max: number;
  default: number;
  unit: string;
}

const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    type: "brightness",
    name: "Brightness",
    min: 0,
    max: 200,
    default: 100,
    unit: "%",
  },
  {
    type: "contrast",
    name: "Contrast",
    min: 0,
    max: 200,
    default: 100,
    unit: "%",
  },
  {
    type: "saturation",
    name: "Saturation",
    min: 0,
    max: 200,
    default: 100,
    unit: "%",
  },
  { type: "hue", name: "Hue Rotate", min: 0, max: 360, default: 0, unit: "°" },
  { type: "blur", name: "Blur", min: 0, max: 20, default: 0, unit: "px" },
  { type: "sepia", name: "Sepia", min: 0, max: 100, default: 0, unit: "%" },
  {
    type: "grayscale",
    name: "Grayscale",
    min: 0,
    max: 100,
    default: 0,
    unit: "%",
  },
  { type: "invert", name: "Invert", min: 0, max: 100, default: 0, unit: "%" },
];

const PRESETS = [
  {
    name: "Vintage",
    filters: [
      { type: "sepia" as FilterType, value: 40 },
      { type: "contrast" as FilterType, value: 90 },
    ],
  },
  {
    name: "Warm",
    filters: [
      { type: "saturation" as FilterType, value: 120 },
      { type: "hue" as FilterType, value: 10 },
    ],
  },
  {
    name: "Cool",
    filters: [
      { type: "saturation" as FilterType, value: 110 },
      { type: "hue" as FilterType, value: 200 },
    ],
  },
  { name: "B&W", filters: [{ type: "grayscale" as FilterType, value: 100 }] },
  {
    name: "High Contrast",
    filters: [{ type: "contrast" as FilterType, value: 150 }],
  },
];

const generateId = () =>
  `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function FiltersPanel() {
  const {
    selectedEffectId,
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    getFiltersForEffect,
  } = useEditorStore();
  const [selectedFilterType, setSelectedFilterType] =
    useState<FilterType>("brightness");

  const selectedFilters = selectedEffectId
    ? getFiltersForEffect(selectedEffectId)
    : [];
  const selectedEffectFilters = filters.filter(
    (f) => f.targetEffectId === selectedEffectId,
  );

  const handleAddFilter = (type: FilterType, value?: number) => {
    if (!selectedEffectId) return;

    const definition = FILTER_DEFINITIONS.find((f) => f.type === type);
    if (!definition) return;

    // Check if filter already exists
    const existing = selectedEffectFilters.find((f) => f.type === type);
    if (existing) return;

    const filter: Filter = {
      id: generateId(),
      targetEffectId: selectedEffectId,
      type,
      value: value ?? definition.default,
    };
    addFilter(filter);
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    if (!selectedEffectId) return;

    preset.filters.forEach(({ type, value }) => {
      handleAddFilter(type, value);
    });
  };

  const getFilterValue = (type: FilterType): number => {
    const filter = selectedEffectFilters.find((f) => f.type === type);
    return (
      filter?.value ??
      FILTER_DEFINITIONS.find((d) => d.type === type)?.default ??
      0
    );
  };

  const hasFilter = (type: FilterType): boolean => {
    return selectedEffectFilters.some((f) => f.type === type);
  };

  // Generate CSS filter string for preview
  const getFilterStyle = (): string => {
    if (!selectedEffectId) return "";

    const parts: string[] = [];
    selectedEffectFilters.forEach((filter) => {
      switch (filter.type) {
        case "brightness":
          parts.push(`brightness(${filter.value}%)`);
          break;
        case "contrast":
          parts.push(`contrast(${filter.value}%)`);
          break;
        case "saturation":
          parts.push(`saturate(${filter.value}%)`);
          break;
        case "hue":
          parts.push(`hue-rotate(${filter.value}deg)`);
          break;
        case "blur":
          parts.push(`blur(${filter.value}px)`);
          break;
        case "sepia":
          parts.push(`sepia(${filter.value}%)`);
          break;
        case "grayscale":
          parts.push(`grayscale(${filter.value}%)`);
          break;
        case "invert":
          parts.push(`invert(${filter.value}%)`);
          break;
      }
    });
    return parts.join(" ");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-sm font-medium text-dark-300">Filters</h2>
      </div>

      {!selectedEffectId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-dark-500 text-center">
            Select a video or image clip to apply filters
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Presets */}
          <div>
            <label className="block text-xs text-dark-400 mb-2">Presets</label>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded hover:bg-dark-600 hover:text-white"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            {FILTER_DEFINITIONS.map((definition) => {
              const isActive = hasFilter(definition.type);
              const value = getFilterValue(definition.type);

              return (
                <div key={definition.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-dark-400">
                      {definition.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-500">
                        {value}
                        {definition.unit}
                      </span>
                      {isActive && (
                        <button
                          onClick={() => {
                            const filter = selectedEffectFilters.find(
                              (f) => f.type === definition.type,
                            );
                            if (filter) removeFilter(filter.id);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg
                            className="w-3 h-3"
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
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={definition.min}
                    max={definition.max}
                    value={value}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      if (!isActive) {
                        handleAddFilter(definition.type, newValue);
                      } else {
                        const filter = selectedEffectFilters.find(
                          (f) => f.type === definition.type,
                        );
                        if (filter) updateFilter(filter.id, newValue);
                      }
                    }}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
                      isActive
                        ? "accent-blue-500 bg-dark-600"
                        : "bg-dark-700 opacity-50"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div className="mt-4">
            <label className="block text-xs text-dark-400 mb-2">
              Filter Preview
            </label>
            <div
              className="w-full h-24 bg-dark-800 rounded flex items-center justify-center overflow-hidden"
              style={{ filter: getFilterStyle() }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded" />
            </div>
          </div>

          {/* Reset */}
          {selectedEffectFilters.length > 0 && (
            <button
              onClick={() => {
                selectedEffectFilters.forEach((f) => removeFilter(f.id));
              }}
              className="w-full py-2 bg-dark-700 text-dark-300 text-sm rounded hover:bg-dark-600 hover:text-white transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
