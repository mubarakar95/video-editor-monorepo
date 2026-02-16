import { initializeWebGPU, getDevice } from './device';
import { createContext, configureContext, getCurrentTexture } from './context';
import { createClipPipeline, createClipBindGroup, ClipParams } from './pipelines/clip-pipeline';
import { createPlayheadPipeline, createPlayheadBindGroup } from './pipelines/playhead-pipeline';
import { createGridPipeline, createGridBindGroup, GridParams } from './pipelines/grid-pipeline';
import { createVertexBuffer, createUniformBuffer, updateBuffer } from './buffers';
import type { TimelineRenderState, ClipRenderData } from './types';

export class TimelineRenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';

  private clipPipeline: GPURenderPipeline | null = null;
  private playheadPipeline: GPURenderPipeline | null = null;
  private gridPipeline: GPURenderPipeline | null = null;

  private clipVertexBuffer: GPUBuffer | null = null;
  private gridUniformBuffer: GPUBuffer | null = null;
  private playheadUniformBuffer: GPUBuffer | null = null;

  private viewport = { x: 0, y: 0, width: 0, height: 0 };
  private zoom = 1.0;
  private scrollOffset = { x: 0, y: 0 };

  private clipUniformBuffers: Map<string, GPUBuffer> = new Map();
  private clipBindGroups: Map<string, GPUBindGroup> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.viewport.width = canvas.width;
    this.viewport.height = canvas.height;
  }

  async initialize(): Promise<boolean> {
    const device = await initializeWebGPU();
    if (!device) {
      return false;
    }

    this.device = device;

    const context = createContext(this.canvas);
    if (!context) {
      return false;
    }

    this.context = context;

    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    this.format = preferredFormat;

    configureContext(this.context, this.device, this.format);

    this.clipPipeline = createClipPipeline(this.device, this.format);
    this.playheadPipeline = createPlayheadPipeline(this.device, this.format);
    this.gridPipeline = createGridPipeline(this.device, this.format);

    this.createStaticBuffers();

    return true;
  }

  private createStaticBuffers(): void {
    if (!this.device) return;

    const clipVertices = new Float32Array([
      0, 0, 0, 0,
      1, 0, 1, 0,
      0, 1, 0, 1,
      1, 0, 1, 0,
      1, 1, 1, 1,
      0, 1, 0, 1,
    ]);
    this.clipVertexBuffer = createVertexBuffer(this.device, clipVertices);

    this.gridUniformBuffer = createUniformBuffer(this.device, 32);
    this.playheadUniformBuffer = createUniformBuffer(this.device, 16);
  }

  render(state: TimelineRenderState): void {
    if (!this.device || !this.context || !this.clipPipeline || !this.playheadPipeline || !this.gridPipeline) {
      return;
    }

    const texture = getCurrentTexture(this.context);
    const view = texture.createView();

    const commandEncoder = this.device.createCommandEncoder();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.1, g: 0.1, b: 0.12, a: 1.0 },
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
        },
      ],
    });

    this.renderGrid(renderPass, state);
    this.renderClips(renderPass, state);
    this.renderPlayhead(renderPass, state);

    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  private renderGrid(renderPass: GPURenderPassEncoder, state: TimelineRenderState): void {
    if (!this.device || !this.gridPipeline || !this.gridUniformBuffer) return;

    const gridParams: GridParams = {
      resolution: [this.viewport.width, this.viewport.height],
      scrollOffset: [this.scrollOffset.x, this.scrollOffset.y],
      zoom: this.zoom,
      trackHeight: state.trackHeight,
      gridSpacing: state.pixelsPerSecond,
      numTracks: state.numTracks,
    };

    const { bindGroup } = createGridBindGroup(this.device, this.gridPipeline, gridParams);

    renderPass.setPipeline(this.gridPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6);
  }

  private renderClips(renderPass: GPURenderPassEncoder, state: TimelineRenderState): void {
    if (!this.device || !this.clipPipeline || !this.clipVertexBuffer) return;

    renderPass.setPipeline(this.clipPipeline);
    renderPass.setVertexBuffer(0, this.clipVertexBuffer);

    for (const clip of state.clips) {
      this.renderClip(renderPass, clip, state);
    }
  }

  private renderClip(
    renderPass: GPURenderPassEncoder,
    clip: ClipRenderData,
    state: TimelineRenderState
  ): void {
    if (!this.device || !this.clipPipeline) return;

    const x = clip.startTime * state.pixelsPerSecond * this.zoom - this.scrollOffset.x;
    const y = clip.trackIndex * state.trackHeight - this.scrollOffset.y;
    const width = clip.duration * state.pixelsPerSecond * this.zoom;
    const height = state.trackHeight - 2;

    const scale = width / 1;
    const scaleY = height / 1;

    const transform = new Float32Array([
      scale * 2 / this.viewport.width, 0, 0, 0,
      0, -scaleY * 2 / this.viewport.height, 0, 0,
      0, 0, 1, 0,
      (x * 2 - this.viewport.width) / this.viewport.width + scale / this.viewport.width,
      (this.viewport.height - y * 2) / this.viewport.height - scaleY / this.viewport.height,
      0, 1,
    ]);

    const color = new Float32Array(clip.color);

    const clipParams: ClipParams = {
      transform,
      color,
      width,
      height,
      cornerRadius: 4,
    };

    const { bindGroup } = createClipBindGroup(this.device, this.clipPipeline, clipParams);

    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6);
  }

  private renderPlayhead(renderPass: GPURenderPassEncoder, state: TimelineRenderState): void {
    if (!this.device || !this.playheadPipeline) return;

    const playheadX = state.playheadPosition * state.pixelsPerSecond * this.zoom - this.scrollOffset.x;

    const { bindGroup } = createPlayheadBindGroup(
      this.device,
      this.playheadPipeline,
      playheadX,
      this.viewport.height,
      this.viewport.width
    );

    renderPass.setPipeline(this.playheadPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6);
  }

  setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = { x, y, width, height };

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      if (this.device && this.context) {
        configureContext(this.context, this.device, this.format);
      }
    }
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(10, zoom));
  }

  setScrollOffset(x: number, y: number): void {
    this.scrollOffset = { x, y };
  }

  dispose(): void {
    this.clipUniformBuffers.forEach((buffer) => buffer.destroy());
    this.clipUniformBuffers.clear();
    this.clipBindGroups.clear();

    this.clipVertexBuffer?.destroy();
    this.gridUniformBuffer?.destroy();
    this.playheadUniformBuffer?.destroy();

    this.clipVertexBuffer = null;
    this.gridUniformBuffer = null;
    this.playheadUniformBuffer = null;
    this.clipPipeline = null;
    this.playheadPipeline = null;
    this.gridPipeline = null;
    this.device = null;
    this.context = null;
  }
}
