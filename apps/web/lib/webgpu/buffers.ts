export function createVertexBuffer(device: GPUDevice, data: Float32Array): GPUBuffer {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });

  device.queue.writeBuffer(buffer, 0, data as unknown as BufferSource);

  return buffer;
}

export function createUniformBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

export function updateBuffer(
  device: GPUDevice,
  buffer: GPUBuffer,
  data: BufferSource,
  offset: number = 0
): void {
  device.queue.writeBuffer(buffer, offset, data as unknown as BufferSource);
}

export function createIndexBuffer(device: GPUDevice, data: Uint16Array): GPUBuffer {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });

  device.queue.writeBuffer(buffer, 0, data as unknown as BufferSource);

  return buffer;
}
