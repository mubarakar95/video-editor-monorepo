'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUDevice = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUCanvasContext = any
type GPUTextureFormat = string
type GPUTextureUsageFlags = number
type GPUBufferUsageFlags = number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUCommandBuffer = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUBuffer = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUTexture = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUImageCopyTexture = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUImageDataLayout = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GPUExtent3D = any

interface WebGPUState {
  device: GPUDevice | null
  context: GPUCanvasContext | null
  format: GPUTextureFormat | null
  isSupported: boolean
  error: string | null
}

export function useWebGPU(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [state, setState] = useState<WebGPUState>({
    device: null,
    context: null,
    format: null,
    isSupported: false,
    error: null,
  })
  
  const deviceRef = useRef<GPUDevice | null>(null)

  const initWebGPU = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu
    if (!gpu) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'WebGPU is not supported in this browser',
      }))
      return null
    }

    try {
      const adapter = await gpu.requestAdapter({
        powerPreference: 'high-performance',
      })

      if (!adapter) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          error: 'No suitable GPU adapter found',
        }))
        return null
      }

      const device = await adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {
          maxBufferSize: adapter.limits.maxBufferSize,
          maxTextureDimension1D: adapter.limits.maxTextureDimension1D,
          maxTextureDimension2D: adapter.limits.maxTextureDimension2D,
          maxTextureDimension3D: adapter.limits.maxTextureDimension3D,
        },
      })

      device.lost.then((info: { message: string }) => {
        console.error('WebGPU device lost:', info.message)
        setState(prev => ({
          ...prev,
          device: null,
          error: `Device lost: ${info.message}`,
        }))
      })

      deviceRef.current = device

      if (canvasRef.current) {
        const context = canvasRef.current.getContext('webgpu') as GPUCanvasContext
        
        if (context) {
          const format = gpu.getPreferredCanvasFormat()
          
          context.configure({
            device,
            format,
            alphaMode: 'premultiplied',
          })

          setState({
            device,
            context,
            format,
            isSupported: true,
            error: null,
          })

          return { device, context, format }
        }
      }

      setState({
        device,
        context: null,
        format: null,
        isSupported: true,
        error: null,
      })

      return { device, context: null, format: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebGPU'
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: errorMessage,
      }))
      return null
    }
  }, [canvasRef])

  const createTexture = useCallback((
    width: number,
    height: number,
    format: GPUTextureFormat = 'rgba8unorm',
    usage: GPUTextureUsageFlags = 0x04 | 0x02 // TEXTURE_BINDING | COPY_DST
  ) => {
    if (!state.device) return null

    return state.device.createTexture({
      size: { width, height },
      format,
      usage,
    })
  }, [state.device])

  const createBuffer = useCallback((
    size: number,
    usage: GPUBufferUsageFlags,
    mappedAtCreation = false
  ) => {
    if (!state.device) return null

    return state.device.createBuffer({
      size,
      usage,
      mappedAtCreation,
    })
  }, [state.device])

  const createCommandEncoder = useCallback(() => {
    if (!state.device) return null
    return state.device.createCommandEncoder()
  }, [state.device])

  const submitCommands = useCallback((commandBuffers: GPUCommandBuffer[]) => {
    if (!state.device) return
    state.device.queue.submit(commandBuffers)
  }, [state.device])

  const writeBuffer = useCallback((
    buffer: GPUBuffer,
    offset: number,
    data: BufferSource,
    dataOffset?: number,
    size?: number
  ) => {
    if (!state.device) return
    state.device.queue.writeBuffer(buffer, offset, data, dataOffset, size)
  }, [state.device])

  const writeTexture = useCallback((
    destination: GPUImageCopyTexture,
    data: BufferSource,
    dataLayout: GPUImageDataLayout,
    size: GPUExtent3D
  ) => {
    if (!state.device) return
    state.device.queue.writeTexture(destination, data, dataLayout, size)
  }, [state.device])

  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy()
      }
    }
  }, [])

  return {
    ...state,
    initWebGPU,
    createTexture,
    createBuffer,
    createCommandEncoder,
    submitCommands,
    writeBuffer,
    writeTexture,
  }
}
