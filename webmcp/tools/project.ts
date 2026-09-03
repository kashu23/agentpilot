import { WebMCPToolDefinition } from '../types';

export const getProjectStateTool: WebMCPToolDefinition = {
  name: 'get_project_state',
  description: 'Retrieve the comprehensive state of the current project, including milestone health, completion velocity, deadlines, and overall risk posture.',
  category: 'project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Unique identifier of the project (defaults to active project if omitted)'
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Whether to calculate real-time completion velocity and risk metrics'
      }
    }
  },
  execute: async (input, context) => {
    // Access active project from window state or provided ID
    const project = (typeof window !== 'undefined' && (window as any).__AGENTPILOT_STORE__?.getState?.().project);
    const tasks = (typeof window !== 'undefined' && (window as any).__AGENTPILOT_STORE__?.getState?.().tasks) || [];
    
    if (!project) {
      return {
        success: false,
        error: 'No active project found in execution context.'
      };
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter((t: any) => t.status === 'blocked').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      success: true,
      message: `Project "${project.title}" state evaluated successfully.`,
      data: {
        id: project.id,
        title: project.title,
        status: project.status,
        targetLaunchDate: project.targetLaunchDate,
        collaborativeMode: project.collaborativeMode,
        milestones: project.milestones,
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          completionRate: `${completionRate}%`,
          daysRemaining: Math.ceil((new Date(project.targetLaunchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }
      }
    };
  }
};

export const createMilestoneTool: WebMCPToolDefinition = {
  name: 'create_milestone',
  description: 'Define and register a new high-leverage delivery milestone for the active project.',
  category: 'project',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the milestone (e.g. "Public Beta Cutover")'
      },
      targetDate: {
        type: 'string',
        description: 'Target completion date in YYYY-MM-DD format'
      },
      description: {
        type: 'string',
        description: 'Scope and exit criteria for this milestone'
      }
    },
    required: ['title', 'targetDate']
  },
  execute: async (input, context) => {
    if (!input.title || !input.targetDate) {
      return {
        success: false,
        error: 'Milestone title and targetDate are required.'
      };
    }

    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    if (store?.getState?.().addMilestone) {
      const newMilestone = {
        id: `milestone-${Date.now()}`,
        projectId: store.getState().project?.id || 'proj-launch-nova',
        title: input.title,
        targetDate: input.targetDate,
        status: 'pending' as const,
        description: input.description || ''
      };
      store.getState().addMilestone(newMilestone);

      return {
        success: true,
        message: `Milestone "${input.title}" targeted for ${input.targetDate} created successfully.`,
        data: newMilestone
      };
    }

    return {
      success: false,
      error: 'State store is not accessible in the current execution environment.'
    };
  }
};
