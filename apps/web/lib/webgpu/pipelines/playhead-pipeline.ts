import playheadShader from '../shaders/playhead.wgsl?raw';

export function createPlayheadPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): GPURenderPipeline {
  const shaderModule = device.createShaderModule({
    code: playheadShader,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
          blend: {
            color: {
              srcFactor: 'src-alpha' as const,
              dstFactor: 'one-minus-src-alpha' as const,
              operation: 'add' as const,
            },
            alpha: {
              srcFactor: 'one' as const,
              dstFactor: 'one-minus-src-alpha' as const,
              operation: 'add' as const,
            },
          },
        },
      ] as GPUColorTargetState[],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });
}

export function createPlayheadBindGroup(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  position: number,
  height: number,
  screenWidth: number
): { bindGroup: GPUBindGroup; uniformBuffer: GPUBuffer } {
  const uniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformData = new Float32Array([position, height, screenWidth, 0]);
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
