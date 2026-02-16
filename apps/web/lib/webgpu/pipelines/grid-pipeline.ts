import timelineShader from '../shaders/timeline.wgsl?raw';

export interface GridParams {
  resolution: [number, number];
  scrollOffset: [number, number];
  zoom: number;
  trackHeight: number;
  gridSpacing: number;
  numTracks: number;
}

export function createGridPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): GPURenderPipeline {
  const shaderModule = device.createShaderModule({
    code: timelineShader,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform' as const,
          hasDynamicOffset: false,
        },
      },
    ] as GPUBindGroupLayoutEntry[],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  return device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [
        {
          format,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });
}

export function createGridBindGroup(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  params: GridParams
): { bindGroup: GPUBindGroup; uniformBuffer: GPUBuffer } {
  const uniformBuffer = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformData = new Float32Array([
    params.resolution[0],
    params.resolution[1],
    params.scrollOffset[0],
    params.scrollOffset[1],
    params.zoom,
    params.trackHeight,
    params.gridSpacing,
    params.numTracks,
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData as unknown as BufferSource);

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  return { bindGroup, uniformBuffer };
}
