export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type CollaborationMode = 'human' | 'collaborative' | 'agent';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: {
    name: string;
    avatar: string;
    role: string;
  };
  deadline: string; // ISO or YYYY-MM-DD
  lane: 'product' | 'marketing' | 'operations';
  position: { x: number; y: number }; // Visual canvas coordinates
  dependsOn: string[]; // Task IDs
  createdBy: 'human' | 'agent';
  updatedBy: 'human' | 'agent';
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  id: string;
  projectId: string;
  sourceTaskId: string; // Predecessor
  targetTaskId: string; // Successor
  type: 'finish_to_start' | 'start_to_start';
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string;
  status: 'pending' | 'reached' | 'at_risk';
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  targetLaunchDate: string;
  status: 'planning' | 'in_progress' | 'at_risk' | 'ready';
  milestones: Milestone[];
  collaborativeMode: CollaborationMode;
  createdAt: string;
  updatedAt: string;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  agentId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'success' | 'failed' | 'requires_approval';
  timestamp: string;
  durationMs: number;
}

export interface ApprovalProposal {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  impactExplanation: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  timestamp: string;
  proposedChanges: {
    moveTasks?: Array<{
      taskId: string;
      taskTitle: string;
      currentDeadline: string;
      proposedDeadline: string;
      lane?: 'product' | 'marketing' | 'operations';
    }>;
    createTasks?: Array<{
      title: string;
      lane: 'product' | 'marketing' | 'operations';
      priority: TaskPriority;
      deadline: string;
      dependsOn: string[];
    }>;
    targetLaunchDate?: string;
  };
}

export interface ActivityEvent {
  id: string;
  type: 'tool_execution' | 'human_action' | 'approval_request' | 'conflict_detected' | 'agent_thought';
  actor: 'human' | 'agent' | 'webmcp' | 'system';
  actorName: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'idle' | 'paused' | 'analyzing';
  successRate: number;
  executionsCount: number;
  toolsCount: number;
  lastRun: string;
  currentTask?: string;
}

export interface Integration {
  id: string;
  name: string;
  provider: 'github' | 'slack' | 'google_calendar' | 'notion' | 'linear';
  description: string;
  connected: boolean;
  status: 'synced' | 'disconnected' | 'syncing';
  lastSync?: string;
  isMock: boolean;
}
