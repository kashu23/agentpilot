export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  category: 'project' | 'task' | 'dependency' | 'planning';
  inputSchema: JSONSchema;
  requiresApproval?: boolean;
  execute: (input: any, context?: WebMCPExecutionContext) => Promise<WebMCPToolResult>;
}

export interface WebMCPToolResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  requiresApproval?: boolean;
  proposal?: any;
}

export interface WebMCPExecutionContext {
  actor: 'agent' | 'human' | 'developer_inspect';
  agentId?: string;
  projectId?: string;
}

export interface ModelContext {
  registerTool: (tool: WebMCPToolDefinition) => void;
  getTools: () => WebMCPToolDefinition[];
  getTool: (name: string) => WebMCPToolDefinition | undefined;
  executeTool: (name: string, input: any, context?: WebMCPExecutionContext) => Promise<WebMCPToolResult>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
