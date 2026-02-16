import { create } from "zustand";

export interface MediaAsset {
  id: string;
  name: string;
  type: "video" | "audio" | "image";
  url: string; // Object URL or remote URL
  duration: number;
  thumbnail?: string;
  size: number;
  width?: number;
  height?: number;
}

interface MediaState {
  assets: Map<string, MediaAsset>;
  addAsset: (asset: MediaAsset) => void;
  removeAsset: (id: string) => void;
  getAsset: (id: string) => MediaAsset | undefined;
  clearAssets: () => void;
}

// Sample demo videos with CORS-friendly URLs
// Using Cloudflare's streaming test videos which have proper CORS headers
const sampleAssets: MediaAsset[] = [
  {
    id: "sample-1",
    name: "Sample Video 1",
    type: "video",
    url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4",
    duration: 60.0,
    size: 52428800,
    width: 1920,
    height: 1080,
  },
  {
    id: "sample-2",
    name: "Sample Video 2",
    type: "video",
    url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
    duration: 60.0,
    size: 26214400,
    width: 1024,
    height: 576,
  },
  {
    id: "sample-3",
    name: "Sample Video 3",
    type: "video",
    url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4",
    duration: 60.0,
    size: 36700160,
    width: 1280,
    height: 720,
  },
];

export const useMediaStore = create<MediaState>((set, get) => ({
  assets: new Map(sampleAssets.map((asset) => [asset.id, asset])),

  addAsset: (asset) =>
    set((state) => {
      const newAssets = new Map(state.assets);
      newAssets.set(asset.id, asset);
      return { assets: newAssets };
    }),

  removeAsset: (id) =>
    set((state) => {
      const newAssets = new Map(state.assets);
      const asset = newAssets.get(id);
      // Revoke object URL if it's a blob URL
      if (asset?.url.startsWith("blob:")) {
        URL.revokeObjectURL(asset.url);
      }
      newAssets.delete(id);
      return { assets: newAssets };
    }),

  getAsset: (id) => get().assets.get(id),

  clearAssets: () =>
    set((state) => {
      // Revoke all blob URLs
      state.assets.forEach((asset) => {
        if (asset.url.startsWith("blob:")) {
          URL.revokeObjectURL(asset.url);
        }
      });
      // Keep sample assets
      return {
        assets: new Map(sampleAssets.map((asset) => [asset.id, asset])),
      };
    }),
}));
