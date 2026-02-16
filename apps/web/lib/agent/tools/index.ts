import type { ToolDefinition, ToolResult, AgentTool } from '@video-editor/shared-types';
import type { ToolContext, AgentToolDefinition } from './types';

class AgentToolsRegistry {
  private tools: Map<string, AgentToolDefinition> = new Map();

  register(tool: AgentToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentToolDefinition | undefined {
    return this.tools.get(name);
  }

  getToolDefinitions(): ToolDefinition[] {
    const definitions: ToolDefinition[] = [];
    this.tools.forEach((tool) => {
      definitions.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    });
    return definitions;
  }

  getToolDescriptions(): string {
    const descriptions: string[] = [];
    this.tools.forEach((tool) => {
      const params = Object.entries(tool.parameters.properties)
        .map(([key, prop]) => `  - ${key}: ${prop.description || prop.type}`)
        .join('\n');
      descriptions.push(`${tool.name}: ${tool.description}\nParameters:\n${params}`);
    });
    return descriptions.join('\n\n');
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }
    try {
      return await tool.execute(args, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const agentTools = new AgentToolsRegistry();
export type { AgentTool, ToolDefinition, ToolResult };
