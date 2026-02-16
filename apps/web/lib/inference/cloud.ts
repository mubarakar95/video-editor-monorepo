import type { InferenceRequest, InferenceResponse, ApiKeys } from './types'

type Provider = 'openai' | 'anthropic'

interface ProviderConfig {
  apiKey: string
  model: string
  baseUrl: string
}

export class CloudInference {
  private configs: Map<Provider, ProviderConfig> = new Map()
  private initialized = false

  async configure(keys: ApiKeys): Promise<void> {
    if (keys.openai) {
      this.configs.set('openai', {
        apiKey: keys.openai,
        model: 'gpt-4-turbo-preview',
        baseUrl: 'https://api.openai.com/v1'
      })
    }

    if (keys.anthropic) {
      this.configs.set('anthropic', {
        apiKey: keys.anthropic,
        model: 'claude-3-sonnet-20240229',
        baseUrl: 'https://api.anthropic.com/v1'
      })
    }

    this.initialized = this.configs.size > 0
  }

  async complete(request: InferenceRequest, provider: Provider = 'openai'): Promise<InferenceResponse> {
    const config = this.configs.get(provider)
    
    if (!config) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return this.callProvider(provider, request)
  }

  async callProvider(provider: Provider, request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = Date.now()
    
    if (provider === 'openai') {
      return this.callOpenAI(request, startTime)
    } else if (provider === 'anthropic') {
      return this.callAnthropic(request, startTime)
    }

    throw new Error(`Unknown provider: ${provider}`)
  }

  private async callOpenAI(request: InferenceRequest, startTime: number): Promise<InferenceResponse> {
    const config = this.configs.get('openai')!
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(this.formatOpenAIRequest('openai', request))
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    
    return {
      id: data.id,
      model: data.model,
      created: data.created,
      finishReason: data.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      message: {
        role: 'assistant',
        content: data.choices[0].message.content,
        toolCalls: data.choices[0].message.tool_calls
      },
      provider: 'openai',
      latency: Date.now() - startTime
    }
  }

  private async callAnthropic(request: InferenceRequest, startTime: number): Promise<InferenceResponse> {
    const config = this.configs.get('anthropic')!
    
    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(this.formatAnthropicRequest('anthropic', request))
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    
    return {
      id: data.id,
      model: data.model,
      created: Date.now(), // Anthropic doesn't send created timestamp in quick response
      finishReason: data.stop_reason,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      message: {
        role: 'assistant',
        content: data.content[0].text,
        // Anthropic tool calls are different, ignoring for now or should implement parsing
      },
      provider: 'anthropic',
      latency: Date.now() - startTime
    }
  }

  formatOpenAIRequest(_provider: Provider, request: InferenceRequest): Record<string, unknown> {
    const config = this.configs.get('openai')!
    
    return {
      model: config.model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature || 0.7
    }
  }

  formatAnthropicRequest(_provider: Provider, request: InferenceRequest): Record<string, unknown> {
    const config = this.configs.get('anthropic')!
    const systemMessage = request.messages.find(m => m.role === 'system')
    const otherMessages = request.messages.filter(m => m.role !== 'system')
    
    return {
      model: config.model,
      messages: otherMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      system: systemMessage?.content,
      max_tokens: request.maxTokens || 2048
    }
  }

  hasProvider(provider: Provider): boolean {
    return this.configs.has(provider)
  }

  getAvailableProviders(): Provider[] {
    return Array.from(this.configs.keys())
  }
}

export const cloudInference = new CloudInference()
