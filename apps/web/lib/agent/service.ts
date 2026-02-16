
import { AgentOrchestrator } from './orchestrator';
import { localInference, cloudInference, InferenceRouter } from '../inference';
import type { ApiKeys } from '../inference/types';

export class AgentService {
  private static instance: AgentService;
  private orchestrator: AgentOrchestrator | null = null;
  private router: InferenceRouter | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  async initialize(apiKeys: ApiKeys): Promise<void> {
    if (this.initialized && this.orchestrator) {
      // Re-configure cloud inference if keys changed, but don't re-init everything
      if (apiKeys.openai || apiKeys.anthropic) {
        await cloudInference.configure(apiKeys);
      }
      return;
    }

    try {
      this.router = new InferenceRouter(localInference, cloudInference);
      await this.router.initialize(apiKeys);

      this.orchestrator = new AgentOrchestrator(this.router);
      this.initialized = true;
      console.log('Agent service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent service:', error);
      throw error;
    }
  }

  getOrchestrator(): AgentOrchestrator {
    if (!this.orchestrator) {
      throw new Error('Agent service not initialized');
    }
    return this.orchestrator;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// export const agentService = AgentService.getInstance();
export const agentService = AgentService.getInstance();
