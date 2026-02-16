export type ConversationRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AgentMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: number;
  toolCallId?: string;
  toolName?: string;
  name?: string;
  toolCalls?: unknown[];
}

export interface AgentResponse {
  id: string;
  message: AgentMessage;
  toolCalls?: ToolCall[];
  isComplete: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentContext {
  conversationId: string;
  messages: AgentMessage[];
  projectId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTool<Context = AgentContext> {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (args: Record<string, unknown>, context: Context) => Promise<ToolResult>;
}

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    default?: unknown;
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
      properties?: Record<string, any>; // Relaxed recursion
      items?: any; // Relaxed
      required?: string[];
    }>;
    items?: {
      type: string;
      properties?: Record<string, any>;
    };
    required?: string[];
  }>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
