export interface ClipRenderData {
  id: string;
  trackIndex: number;
  startTime: number;
  duration: number;
  color: [number, number, number, number];
  name: string;
}

export interface ViewportState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TimelineRenderState {
  clips: ClipRenderData[];
  playheadPosition: number;
  zoom: number;
  scrollOffset: { x: number; y: number };
  trackHeight: number;
  numTracks: number;
  totalDuration: number;
  pixelsPerSecond: number;
}

export interface TransformMatrix {
  data: Float32Array;
}

export interface RenderContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  width: number;
  height: number;
}
