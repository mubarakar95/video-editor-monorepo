import type {
  Message,
  AgentMessage,
  ToolCallInfo,
  ToolDefinitionInfo,
  InferenceRequest,
  InferenceResponse,
} from '@video-editor/shared-types';
import type {
  TimelineSchema,
  PendingOperation,
  AgentContext,
} from '@video-editor/timeline-schema';
import { agentTools } from './tools';
import { getSystemPrompt } from './prompts/system';

interface InferenceRouter {
  complete(request: InferenceRequest): Promise<InferenceResponse>;
}

interface OrchestratorContext {
  timeline: TimelineSchema | null;
  conversationHistory: AgentMessage[];
  pendingOperations: PendingOperation[];
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export class AgentOrchestrator {
  private router: InferenceRouter;
  private context: OrchestratorContext;
  private timeline: TimelineSchema | null = null;
  private onTimelineUpdate?: (timeline: TimelineSchema) => void;

  constructor(router: InferenceRouter) {
    this.router = router;
    this.context = {
      timeline: null,
      conversationHistory: [],
      pendingOperations: [],
    };
  }

  setTimeline(timeline: TimelineSchema): void {
    this.timeline = timeline;
    this.context.timeline = timeline;
  }

  setTimelineUpdateCallback(callback: (timeline: TimelineSchema) => void): void {
    this.onTimelineUpdate = callback;
  }

  private updateTimeline(timeline: TimelineSchema): void {
    this.timeline = timeline;
    this.context.timeline = timeline;
    this.onTimelineUpdate?.(timeline);
  }

  private addPendingOperation(operation: {
    operation: string;
    params: Record<string, unknown>;
  }): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.context.pendingOperations.push({ 
      id, 
      operation: operation.operation,
      params: operation.params,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return id;
  }

  async processCommand(
    input: string,
    source: 'chat' | 'terminal'
  ): Promise<import('@video-editor/shared-types').AgentResponse> {
    const messages = this.buildMessages(input, source);
    const toolDefinitions = agentTools.getToolDefinitions();

    const request: InferenceRequest = {
      messages,
      tools: toolDefinitions.map((def): ToolDefinitionInfo => ({
        type: 'function',
        function: {
          name: def.name,
          description: def.description,
          parameters: def.parameters as unknown as Record<string, unknown>,
        },
      })),
      toolChoice: 'auto',
      maxTokens: 2048,
      temperature: source === 'chat' ? 0.7 : 0.3,
    };

    const response = await this.router.complete(request);

    if (response.finishReason === 'tool_calls' && response.message.toolCalls) {
      const toolCalls = this.parseToolCalls(response.message.toolCalls);
      const results = await this.executeTools(toolCalls);

      return this.continueWithToolResults(messages, response, results, source);
    }

    const agentResponse = this.createAgentResponse(response.message.content, false);
    this.context.conversationHistory.push({
      role: 'assistant',
      content: response.message.content,
      timestamp: Date.now(),
      id: agentResponse.id,
    });

    return agentResponse;
  }

  buildMessages(input: string, source: 'chat' | 'terminal'): Message[] {
    const messages: Message[] = [
      {
        role: 'system',
        content: getSystemPrompt(source, this.timeline),
      },
    ];

    for (const msg of this.context.conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
        name: msg.name,
        toolCallId: msg.toolCallId,
        toolCalls: msg.toolCalls as ToolCallInfo[],
      });
    }

    messages.push({
      role: 'user',
      content: input,
    });

    return messages;
  }

  buildSystemPrompt(source: 'chat' | 'terminal'): string {
    return getSystemPrompt(source, this.timeline);
  }

  private parseToolCalls(toolCalls: ToolCallInfo[]): ToolCall[] {
    return toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
  }

  async executeTools(toolCalls: ToolCall[]): Promise<unknown[]> {
    const results: unknown[] = [];

    for (const toolCall of toolCalls) {
      const toolContext = {
        timeline: this.timeline,
        agentContext: this.createAgentContext(),
        updateTimeline: this.updateTimeline.bind(this),
        addPendingOperation: this.addPendingOperation.bind(this),
      };

      const result = await agentTools.executeTool(
        toolCall.name,
        toolCall.arguments,
        toolContext
      );

      results.push({
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result,
      });
    }

    return results;
  }

  async continueWithToolResults(
    messages: Message[],
    response: InferenceResponse,
    results: unknown[],
    source: 'chat' | 'terminal'
  ): Promise<import('@video-editor/shared-types').AgentResponse> {
    // Append the assistant's message (which contains the tool calls) to the conversation
    messages.push({
      role: 'assistant',
      content: response.message.content || '',
      toolCalls: response.message.toolCalls,
    });


    for (const result of results as Array<{ toolCallId: string; result: unknown }>) {
      messages.push({
        role: 'tool',
        content: JSON.stringify(result.result),
        toolCallId: result.toolCallId,
      });
    }

    const toolDefinitions = agentTools.getToolDefinitions();
    const followUpRequest: InferenceRequest = {
      messages,
      tools: toolDefinitions.map((def): ToolDefinitionInfo => ({
        type: 'function',
        function: {
          name: def.name,
          description: def.description,
          parameters: def.parameters as unknown as Record<string, unknown>,
        },
      })),
      toolChoice: 'auto',
      maxTokens: 2048,
      temperature: source === 'chat' ? 0.7 : 0.3,
    };

    const followUpResponse = await this.router.complete(followUpRequest);

    if (followUpResponse.finishReason === 'tool_calls' && followUpResponse.message.toolCalls) {
      const toolCalls = this.parseToolCalls(followUpResponse.message.toolCalls);
      const moreResults = await this.executeTools(toolCalls);
      return this.continueWithToolResults(messages, followUpResponse, moreResults, source);
    }

    const agentResponse = this.createAgentResponse(followUpResponse.message.content, false);
    this.context.conversationHistory.push({
      role: 'assistant',
      content: followUpResponse.message.content,
      timestamp: Date.now(),
      id: agentResponse.id,
    });

    return agentResponse;
  }

  private createAgentResponse(
    content: string,
    isComplete: boolean
  ): import('@video-editor/shared-types').AgentResponse {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      message: {
        id,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      },
      isComplete,
    };
  }

  private createAgentContext(): AgentContext {
    return (
      this.timeline?.agentState?.context || {
        selectedClipIds: [],
        selectedTrackIds: [],
        zoomLevel: 1,
      }
    );
  }

  getConversationHistory(): AgentMessage[] {
    return [...this.context.conversationHistory];
  }

  clearHistory(): void {
    this.context.conversationHistory = [];
  }

  getPendingOperations(): PendingOperation[] {
    return [...this.context.pendingOperations];
  }

  clearPendingOperations(): void {
    this.context.pendingOperations = [];
  }
}

export { agentTools };
export type { InferenceRouter };
