import { WebMCPToolDefinition, ModelContext, WebMCPToolResult, WebMCPExecutionContext } from './types';
import { getProjectStateTool, createMilestoneTool } from './tools/project';
import { getTasksTool, createTaskTool, updateTaskTool, deleteTaskTool, prioritizeTasksTool } from './tools/tasks';
import { connectTasksTool, disconnectTasksTool, analyzeDependenciesTool, findBlockersTool } from './tools/dependencies';
import { generatePlanTool, validatePlanTool, estimateTimelineTool, suggestNextActionTool } from './tools/planning';

// The canonical 15 WebMCP tools for AGENTPILOT
export const ALL_WEBMCP_TOOLS: WebMCPToolDefinition[] = [
  getProjectStateTool,
  getTasksTool,
  createTaskTool,
  updateTaskTool,
  deleteTaskTool,
  createMilestoneTool,
  connectTasksTool,
  disconnectTasksTool,
  analyzeDependenciesTool,
  findBlockersTool,
  prioritizeTasksTool,
  generatePlanTool,
  validatePlanTool,
  estimateTimelineTool,
  suggestNextActionTool
];

class WebMCPRegistry implements ModelContext {
  private tools: Map<string, WebMCPToolDefinition> = new Map();
  private executionHistory: Array<{
    toolName: string;
    status: 'success' | 'failed' | 'requires_approval';
    durationMs: number;
    timestamp: string;
  }> = [];

  constructor() {
    // Register the 15 tools by default
    ALL_WEBMCP_TOOLS.forEach(tool => this.registerTool(tool));
  }

  public registerTool(tool: WebMCPToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public getTools(): WebMCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getTool(name: string): WebMCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  public async executeTool(
    name: string,
    input: any,
    context?: WebMCPExecutionContext
  ): Promise<WebMCPToolResult> {
    const startTime = performance.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `WebMCP tool "${name}" is not registered on document.modelContext.`
      };
    }

    try {
      const result = await tool.execute(input, context);
      const durationMs = Math.round(performance.now() - startTime);

      const executionRecord = {
        toolName: name,
        status: result.requiresApproval ? ('requires_approval' as const) : (result.success ? 'success' as const : 'failed' as const),
        durationMs,
        timestamp: new Date().toLocaleTimeString()
      };

      this.executionHistory.unshift(executionRecord);

      // Log to application activity store if window is available
      if (typeof window !== 'undefined') {
        const store = (window as any).__AGENTPILOT_STORE__;
        if (store?.getState?.().addActivity) {
          store.getState().addActivity({
            id: `act-tool-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'tool_execution',
            actor: context?.actor === 'agent' ? 'agent' : 'webmcp',
            actorName: context?.agentId ? 'Agent Engine' : 'WebMCP Registry',
            action: name,
            description: result.message || `Executed tool ${name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            metadata: { input, output: result.data || result.proposal, durationMs }
          });
        }
      }

      return result;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        error: err?.message || 'Unknown WebMCP tool execution failure'
      };
    }
  }

  public getExecutionHistory() {
    return this.executionHistory;
  }
}

export const webMCPRegistry = new WebMCPRegistry();

// Initialize on document.modelContext for browser environments
export function initWebMCPOnDocument(): void {
  if (typeof document !== 'undefined') {
    if (!document.modelContext) {
      document.modelContext = {
        registerTool: (tool: WebMCPToolDefinition) => webMCPRegistry.registerTool(tool),
        getTools: () => webMCPRegistry.getTools(),
        getTool: (name: string) => webMCPRegistry.getTool(name),
        executeTool: (name: string, input: any, context?: WebMCPExecutionContext) =>
          webMCPRegistry.executeTool(name, input, context)
      };
    }
  }
}
