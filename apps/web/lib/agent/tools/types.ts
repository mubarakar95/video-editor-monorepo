import type {
  AgentTool,
  ToolParameterSchema,
  ToolDefinition,
  ToolResult,
} from '@video-editor/shared-types';
import type { TimelineSchema, AgentContext } from '@video-editor/timeline-schema';

export interface AgentToolDefinition extends AgentTool<ToolContext> {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  timeline: TimelineSchema | null;
  agentContext: AgentContext;
  updateTimeline: (timeline: TimelineSchema) => void;
  addPendingOperation: (operation: PendingOperationInfo) => string;
}

export interface PendingOperationInfo {
  operation: string;
  params: Record<string, unknown>;
}

export type { ToolResult };
