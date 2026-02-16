let device: GPUDevice | null = null;
let adapter: GPUAdapter | null = null;

export function checkWebGPUSupport(): boolean {
  return 'gpu' in navigator;
}

export async function initializeWebGPU(): Promise<GPUDevice | null> {
  if (!checkWebGPUSupport()) {
    console.error('WebGPU is not supported in this browser');
    return null;
  }

  try {
    adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      console.error('Failed to get GPU adapter');
      return null;
    }

    device = await adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {
        maxBufferSize: adapter.limits.maxBufferSize,
        maxVertexBuffers: adapter.limits.maxVertexBuffers,
        maxBindGroups: adapter.limits.maxBindGroups,
      },
    });

    device.lost.then((info) => {
      console.error('WebGPU device lost:', info.message);
      device = null;
    });

    return device;
  } catch (error) {
    console.error('Failed to initialize WebGPU:', error);
    return null;
  }
}

export function getDevice(): GPUDevice | null {
  return device;
}

export function getAdapter(): GPUAdapter | null {
  return adapter;
}
