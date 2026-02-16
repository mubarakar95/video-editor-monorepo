import type { InferenceRequest, InferenceResponse, RoutingDecision, ApiKeys } from './types'
import { LocalInference } from './local'
import { CloudInference } from './cloud'

export class InferenceRouter {
  private localInference: LocalInference
  private cloudInference: CloudInference
  private initialized = false

  constructor(localInference: LocalInference, cloudInference: CloudInference) {
    this.localInference = localInference
    this.cloudInference = cloudInference
  }

  async initialize(apiKeys: ApiKeys): Promise<void> {
    await Promise.all([
      this.localInference.initialize(),
      this.cloudInference.configure(apiKeys)
    ])
    
    this.initialized = true
  }

  async complete(request: InferenceRequest): Promise<InferenceResponse> {
    const decision = this.route(request)

    if (decision.provider === 'local') {
      try {
        return await this.localInference.complete(request)
      } catch (error) {
        console.warn('Local inference failed, falling back to cloud:', error)
        return this.fallbackToCloud(request)
      }
    }

    return this.cloudInference.complete(request, decision.provider)
  }

  route(request: InferenceRequest): RoutingDecision {
    const complexityScore = this.analyzeComplexity(request)

    if (complexityScore <= 3 && this.localInference.canHandle(request)) {
      return {
        provider: 'local',
        reason: 'Simple task suitable for local inference',
        complexityScore
      }
    }

    if (request.priority === 'high' || complexityScore >= 7) {
      const provider = this.cloudInference.hasProvider('openai') ? 'openai' : 'anthropic'
      return {
        provider,
        reason: 'High priority or complex task requires cloud inference',
        complexityScore
      }
    }

    if (request.task === 'generation' && this.cloudInference.hasProvider('openai')) {
      return {
        provider: 'openai',
        reason: 'Generation tasks benefit from GPT models',
        complexityScore
      }
    }

    if (request.task === 'editing' && this.cloudInference.hasProvider('anthropic')) {
      return {
        provider: 'anthropic',
        reason: 'Editing tasks benefit from Claude models',
        complexityScore
      }
    }

    const availableProviders = this.cloudInference.getAvailableProviders()
    const preferredProvider = availableProviders[0] || 'openai'

    return {
      provider: preferredProvider,
      reason: 'Default routing to available cloud provider',
      complexityScore
    }
  }

  analyzeComplexity(request: InferenceRequest): number {
    let score = 1

    const totalContent = request.messages.reduce((sum, m) => sum + m.content.length, 0)
    
    if (totalContent > 2000) score += 4
    else if (totalContent > 1000) score += 3
    else if (totalContent > 500) score += 2
    else if (totalContent > 200) score += 1

    if (request.messages.length > 6) score += 2
    else if (request.messages.length > 3) score += 1

    switch (request.task) {
      case 'generation':
        score += 3
        break
      case 'editing':
        score += 2
        break
      case 'analysis':
        score += 1
        break
      case 'classification':
        break
    }

    if (request.maxTokens && request.maxTokens > 1000) {
      score += 1
    }

    return Math.min(score, 10)
  }

  private async fallbackToCloud(request: InferenceRequest): Promise<InferenceResponse> {
    const providers = this.cloudInference.getAvailableProviders()
    
    for (const provider of providers) {
      try {
        return await this.cloudInference.complete(request, provider)
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error)
      }
    }

    throw new Error('All inference providers failed')
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export { LocalInference } from './local'
export { CloudInference } from './cloud'
