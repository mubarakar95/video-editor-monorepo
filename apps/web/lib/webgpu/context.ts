export function createContext(canvas: HTMLCanvasElement): GPUCanvasContext | null {
  const context = canvas.getContext('webgpu');
  if (!context) {
    console.error('Failed to get WebGPU context from canvas');
    return null;
  }
  return context as GPUCanvasContext;
}

export function configureContext(
  context: GPUCanvasContext,
  device: GPUDevice,
  format: GPUTextureFormat = 'bgra8unorm'
): void {
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });
}

export function getCurrentTexture(context: GPUCanvasContext): GPUTexture {
  return context.getCurrentTexture();
}
