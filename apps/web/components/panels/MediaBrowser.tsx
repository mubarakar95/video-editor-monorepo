"use client";

import { useState, useMemo } from "react";
import { useMediaStore } from "@/stores";
import type { MediaAsset } from "@/stores/media";

export default function MediaBrowser() {
  const { assets, addAsset } = useMediaStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "image">(
    "all",
  );
  const [importing, setImporting] = useState(false);

  const assetList = useMemo(() => Array.from(assets.values()), [assets]);

  const filteredFiles = assetList.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "all" || file.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "video/*,audio/*,image/*";

    input.onchange = async (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList) return;

      setImporting(true);

      for (const file of Array.from(fileList)) {
        const id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const url = URL.createObjectURL(file);

        // Determine media type
        const type: "video" | "audio" | "image" = file.type.startsWith("video")
          ? "video"
          : file.type.startsWith("audio")
            ? "audio"
            : "image";

        // Get duration for video/audio
        let duration = 0;
        let width: number | undefined;
        let height: number | undefined;

        if (type === "video" || type === "audio") {
          try {
            duration = await getMediaDuration(url);
            if (type === "video") {
              const dimensions = await getVideoDimensions(url);
              width = dimensions.width;
              height = dimensions.height;
            }
          } catch (err) {
            console.warn("Failed to get media metadata:", err);
          }
        }

        const asset: MediaAsset = {
          id,
          name: file.name,
          type,
          url,
          duration,
          size: file.size,
          width,
          height,
        };

        addAsset(asset);
      }

      setImporting(false);
    };

    input.click();
  };

  const handleDragStart = (e: React.DragEvent, file: MediaAsset) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: file.id,
        name: file.name,
        type: file.type,
        duration: file.duration,
        url: file.url,
        width: file.width,
        height: file.height,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case "audio":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        );
      case "image":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "text-blue-400";
      case "audio":
        return "text-green-400";
      case "image":
        return "text-purple-400";
      default:
        return "text-dark-400";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-dark-300">Media</h2>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? (
              <>
                <svg
                  className="w-3 h-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Import
              </>
            )}
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-dark-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex gap-1 mt-2">
          {(["all", "video", "audio", "image"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                filter === f
                  ? "bg-dark-600 text-white"
                  : "text-dark-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg
              className="w-8 h-8 text-dark-600 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-xs text-dark-500">No media files</p>
            <p className="text-xs text-dark-600">Drag and drop to import</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                className="flex items-center gap-2 p-2 rounded hover:bg-dark-700 cursor-grab active:cursor-grabbing group"
              >
                <div
                  className={`w-8 h-8 bg-dark-700 rounded flex items-center justify-center ${getTypeColor(file.type)}`}
                >
                  {getTypeIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{file.name}</p>
                  <p className="text-xs text-dark-500">
                    {file.duration > 0 && `${formatDuration(file.duration)} • `}
                    {formatSize(file.size)}
                    {file.width &&
                      file.height &&
                      ` • ${file.width}x${file.height}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for getting media metadata
function getMediaDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const media = document.createElement("video");
    media.preload = "metadata";
    media.crossOrigin = "anonymous";
    media.onloadedmetadata = () => {
      resolve(media.duration);
    };
    media.onerror = () => {
      reject(new Error("Failed to load media"));
    };
    media.src = url;
  });
}

function getVideoDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };
    video.src = url;
  });
}
