import { WebMCPToolDefinition } from '../types';
import { Task, TaskPriority, TaskStatus } from '@/types';

export const getTasksTool: WebMCPToolDefinition = {
  name: 'get_tasks',
  description: 'Query tasks within the project with optional filters for status, priority, or lane.',
  category: 'task',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'done', 'blocked'],
        description: 'Filter by execution status'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filter by priority level'
      },
      lane: {
        type: 'string',
        enum: ['product', 'marketing', 'operations'],
        description: 'Filter by functional workstream'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    let filtered = [...tasks];
    if (input.status) {
      filtered = filtered.filter(t => t.status === input.status);
    }
    if (input.priority) {
      filtered = filtered.filter(t => t.priority === input.priority);
    }
    if (input.lane) {
      filtered = filtered.filter(t => t.lane === input.lane);
    }

    return {
      success: true,
      message: `Retrieved ${filtered.length} tasks matching criteria.`,
      data: {
        count: filtered.length,
        tasks: filtered.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          deadline: t.deadline,
          lane: t.lane,
          dependsOn: t.dependsOn,
          owner: t.owner.name
        }))
      }
    };
  }
};

export const createTaskTool: WebMCPToolDefinition = {
  name: 'create_task',
  description: 'Create a new task in the current project workstream with owner, priority, and deadline.',
  category: 'task',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Clear, actionable title of the task'
      },
      description: {
        type: 'string',
        description: 'Detailed specifications and acceptance criteria'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Urgency and impact level'
      },
      deadline: {
        type: 'string',
        description: 'Target completion date in YYYY-MM-DD format'
      },
      lane: {
        type: 'string',
        enum: ['product', 'marketing', 'operations'],
        description: 'Workstream lane'
      },
      dependsOn: {
        type: 'array',
        description: 'Array of task IDs that must finish before this task begins',
        items: {
          type: 'string'
        }
      }
    },
    required: ['title']
  },
  execute: async (input, context) => {
    if (!input.title) {
      return {
        success: false,
        error: 'Task title is required.'
      };
    }

    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    if (store?.getState?.().addTask) {
      const state = store.getState();
      const existingTasksInLane = state.tasks.filter((t: Task) => t.lane === (input.lane || 'product'));
      const lastTask = existingTasksInLane[existingTasksInLane.length - 1];
      
      const defaultX = input.lane === 'marketing' ? 440 : input.lane === 'operations' ? 760 : 120;
      const defaultY = lastTask ? lastTask.position.y + 140 : 140;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        projectId: state.project?.id || 'proj-launch-nova',
        title: input.title,
        description: input.description || 'Generated via WebMCP',
        status: 'todo',
        priority: (input.priority as TaskPriority) || 'medium',
        owner: {
          name: context?.actor === 'agent' ? 'AI Sentinel' : 'Lead Engineer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
          role: context?.actor === 'agent' ? 'Autonomous Subagent' : 'Team Lead'
        },
        deadline: input.deadline || '2026-09-04',
        lane: input.lane || 'product',
        position: { x: defaultX, y: defaultY },
        dependsOn: input.dependsOn || [],
        createdBy: context?.actor === 'agent' ? 'agent' : 'human',
        updatedBy: context?.actor === 'agent' ? 'agent' : 'human',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      state.addTask(newTask);

      return {
        success: true,
        message: `Task "${newTask.title}" created successfully with ID ${newTask.id}.`,
        data: newTask
      };
    }

    return {
      success: false,
      error: 'State store is not accessible.'
    };
  }
};

export const updateTaskTool: WebMCPToolDefinition = {
  name: 'update_task',
  description: 'Update attributes of an existing task (e.g. deadline, status, priority, or lane position).',
  category: 'task',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Unique identifier of the task to update'
      },
      deadline: {
        type: 'string',
        description: 'New completion deadline in YYYY-MM-DD'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'done', 'blocked'],
        description: 'Updated execution status'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Updated priority level'
      },
      title: {
        type: 'string',
        description: 'Updated title'
      },
      position: {
        type: 'object',
        description: 'Updated visual canvas coordinates { x, y }'
      }
    },
    required: ['taskId']
  },
  execute: async (input, context) => {
    if (!input.taskId) {
      return { success: false, error: 'taskId is required.' };
    }

    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    if (store?.getState?.().updateTask) {
      const state = store.getState();
      const existing = state.tasks.find((t: Task) => t.id === input.taskId);
      if (!existing) {
        return { success: false, error: `Task with id ${input.taskId} not found.` };
      }

      const updates: Partial<Task> = {
        updatedBy: context?.actor === 'agent' ? 'agent' : 'human',
        updatedAt: new Date().toISOString()
      };

      if (input.deadline) updates.deadline = input.deadline;
      if (input.status) updates.status = input.status;
      if (input.priority) updates.priority = input.priority;
      if (input.title) updates.title = input.title;
      if (input.position) updates.position = input.position;

      state.updateTask(input.taskId, updates);

      return {
        success: true,
        message: `Task "${existing.title}" updated successfully.`,
        data: { taskId: input.taskId, changes: updates }
      };
    }

    return { success: false, error: 'State store is not accessible.' };
  }
};

export const deleteTaskTool: WebMCPToolDefinition = {
  name: 'delete_task',
  description: 'Permanently remove a task from the project and detach its downstream dependencies.',
  category: 'task',
  requiresApproval: true,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Unique identifier of the task to delete'
      },
      rationale: {
        type: 'string',
        description: 'Explanation for why this task is being deprecated or removed'
      }
    },
    required: ['taskId']
  },
  execute: async (input, context) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    if (store?.getState?.().deleteTask) {
      const state = store.getState();
      const existing = state.tasks.find((t: Task) => t.id === input.taskId);
      if (!existing) {
        return { success: false, error: `Task ${input.taskId} not found.` };
      }

      state.deleteTask(input.taskId);
      return {
        success: true,
        message: `Task "${existing.title}" successfully deleted.`,
        data: { deletedTaskId: input.taskId }
      };
    }
    return { success: false, error: 'State store is not accessible.' };
  }
};

export const prioritizeTasksTool: WebMCPToolDefinition = {
  name: 'prioritize_tasks',
  description: 'Re-score and prioritize tasks based on critical path position, dependency count, and deadline proximity.',
  category: 'task',
  inputSchema: {
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        enum: ['critical_path', 'deadline_urgency', 'blocker_reduction'],
        description: 'Heuristic weighting strategy'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    // Calculate urgency score
    const scored = tasks.map(task => {
      let score = 0;
      if (task.priority === 'critical') score += 40;
      if (task.priority === 'high') score += 25;
      if (task.priority === 'medium') score += 10;
      if (task.status === 'blocked') score += 30;
      if (task.status === 'in_progress') score += 15;
      
      const downstreamCount = tasks.filter(t => t.dependsOn.includes(task.id)).length;
      score += downstreamCount * 15;

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        urgencyScore: score,
        downstreamDependents: downstreamCount
      };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore);

    return {
      success: true,
      message: `Calculated priority stack rank across ${tasks.length} tasks.`,
      data: {
        strategy: input.strategy || 'critical_path',
        rankedTasks: scored
      }
    };
  }
};
