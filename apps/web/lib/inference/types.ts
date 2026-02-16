
import type { 
  InferenceRequest as SharedInferenceRequest,
  InferenceResponse as SharedInferenceResponse,
  InferenceUsage,
  Message as SharedMessage
} from '@video-editor/shared-types';

export type InferenceMessage = SharedMessage;

export type Provider = 'openai' | 'anthropic' | 'local';

export interface InferenceRequest extends Omit<SharedInferenceRequest, 'task'> {
  task?: 'classification' | 'generation' | 'editing' | 'analysis';
  priority?: 'low' | 'medium' | 'high';
}

export interface InferenceResponse extends SharedInferenceResponse {
  // Add any local-specific fields if necessary, or just alias
  provider?: Provider; // shared-types doesn't seem to have provider in response directly, but has model
  latency?: number;
}

export interface RoutingDecision {
  provider: Provider;
  reason: string;
  complexityScore: number;
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
}

export interface InferenceProvider {
  initialize(apiKeys?: ApiKeys): Promise<void>;
  canHandle(request: InferenceRequest): boolean;
  complete(request: InferenceRequest, provider?: Provider): Promise<InferenceResponse>;
}
