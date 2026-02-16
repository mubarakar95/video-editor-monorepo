export type InferenceBackend = 'openai' | 'anthropic' | 'local' | 'custom';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface InferenceRequest {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  tools?: ToolDefinitionInfo[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinitionInfo {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface InferenceResponse {
  id: string;
  model: string;
  message: Message;
  usage: InferenceUsage;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string;
  created: number;
}

export interface InferenceUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderConfig {
  backend: InferenceBackend;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  defaultParameters?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
  timeout?: number;
  retries?: number;
}

export interface RoutingDecision {
  selectedBackend: InferenceBackend;
  selectedModel: string;
  reason: 'capability' | 'cost' | 'latency' | 'availability' | 'user_preference';
  fallbackBackends?: InferenceBackend[];
  estimatedLatency?: number;
  estimatedCost?: number;
}
