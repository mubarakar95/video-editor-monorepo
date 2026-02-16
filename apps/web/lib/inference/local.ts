import { pipeline, Pipeline, env } from '@xenova/transformers'
import type { InferenceProvider, InferenceRequest, InferenceResponse, InferenceMessage } from './types'

export class LocalInference implements InferenceProvider {
  private generator: any = null
  private initialized = false
  private modelLoading = false

  async initialize(): Promise<void> {
    if (this.initialized || this.modelLoading) return

    this.modelLoading = true
    
    try {
      env.allowLocalModels = false
      env.useBrowserCache = true
      
      this.generator = await pipeline(
        'text-generation',
        'Xenova/tiny-random-GPT2',
        { progress_callback: (progress: unknown) => {
          console.log('Model loading progress:', progress)
        }}
      )
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize local inference:', error)
      throw error
    } finally {
      this.modelLoading = false
    }
  }

  canHandle(request: InferenceRequest): boolean {
    if (!this.initialized || !this.generator) return false
    
    const complexity = this.estimateComplexity(request)
    const isSimpleTask = ['classification', 'analysis'].includes(request.task || '')
    
    return complexity <= 3 && (isSimpleTask || (request.messages?.length || 0) <= 2)
  }

  async complete(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.generator) {
      await this.initialize()
    }

    if (!this.generator) {
      throw new Error('Local inference not initialized')
    }

    const startTime = Date.now()
    const prompt = this.formatPrompt(request.messages)
    
    const result = await this.generator(prompt, {
      max_new_tokens: request.maxTokens || 100,
      temperature: request.temperature || 0.7,
      do_sample: true
    })

    const generatedText = Array.isArray(result) ? result[0].generated_text : result.generated_text
    // const response = generatedText.replace(prompt, '').trim() // This line is no longer needed as per new return structure

    return {
      id: `local-${Date.now()}`,
      model: 'Xenova/tiny-random-GPT2',
      created: Date.now(),
      finishReason: 'stop',
      usage: {
        promptTokens: 0, // Not easily available from Xenova pipeline without manual calculation
        completionTokens: 0,
        totalTokens: 0
      },
      message: {
        role: 'assistant',
        content: generatedText.replace(prompt, '').trim(), // Use generatedText here
      },
      provider: 'local',
      latency: Date.now() - startTime
    }
  }

  formatPrompt(messages: InferenceMessage[]): string {
    return messages
      .map(m => `<|${m.role}|>${m.content}<|end|>`)
      .join('\n') + '\n<|assistant|'
  }

  private estimateComplexity(request: InferenceRequest): number {
    let score = 1
    
    const totalLength = request.messages.reduce((sum, m) => sum + m.content.length, 0)
    if (totalLength > 500) score += 2
    else if (totalLength > 200) score += 1
    
    if (request.messages.length > 4) score += 2
    else if (request.messages.length > 2) score += 1
    
    if (request.task === 'generation') score += 3
    if (request.task === 'editing') score += 2
    
    return Math.min(score, 10)
  }
}

export const localInference = new LocalInference()
