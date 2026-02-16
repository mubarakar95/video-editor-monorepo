import clipShader from '../shaders/clip.wgsl?raw';

export interface ClipParams {
  transform: Float32Array;
  color: Float32Array;
  width: number;
  height: number;
  cornerRadius: number;
}

export function createClipPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): GPURenderPipeline {
  const shaderModule = device.createShaderModule({
    code: clipShader,
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
      buffers: [
        {
          arrayStride: 16,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2' as const,
            },
            {
              shaderLocation: 1,
              offset: 8,
              format: 'float32x2' as const,
            },
          ],
        },
      ],
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
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });
}

export function createClipBindGroup(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  params: ClipParams
): { bindGroup: GPUBindGroup; uniformBuffer: GPUBuffer } {
  const uniformBufferSize = 64 + 16 + 8 + 8;
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformData = new Float32Array(24);
  uniformData.set(params.transform, 0);
  uniformData.set(params.color, 16);
  uniformData[20] = params.width;
  uniformData[21] = params.height;
  uniformData[22] = params.cornerRadius;
  uniformData[23] = 0;

  device.queue.writeBuffer(uniformBuffer, 0, uniformData);

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
