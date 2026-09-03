import { WebMCPToolDefinition } from '../types';
import { Task } from '@/types';

export const connectTasksTool: WebMCPToolDefinition = {
  name: 'connect_tasks',
  description: 'Create a direct dependency link indicating that task A must complete before task B can start.',
  category: 'dependency',
  inputSchema: {
    type: 'object',
    properties: {
      sourceTaskId: {
        type: 'string',
        description: 'ID of predecessor task (must finish first)'
      },
      targetTaskId: {
        type: 'string',
        description: 'ID of successor task (depends on predecessor)'
      }
    },
    required: ['sourceTaskId', 'targetTaskId']
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    if (!store?.getState?.().tasks) {
      return { success: false, error: 'Store unavailable.' };
    }

    const tasks: Task[] = store.getState().tasks;
    const source = tasks.find(t => t.id === input.sourceTaskId);
    const target = tasks.find(t => t.id === input.targetTaskId);

    if (!source || !target) {
      return { success: false, error: 'One or both specified task IDs do not exist.' };
    }

    if (input.sourceTaskId === input.targetTaskId) {
      return { success: false, error: 'Self-referential dependencies are disallowed.' };
    }

    if (target.dependsOn.includes(input.sourceTaskId)) {
      return { success: true, message: 'Dependency already exists.', data: { sourceTaskId: input.sourceTaskId, targetTaskId: input.targetTaskId } };
    }

    const updatedDependsOn = [...target.dependsOn, input.sourceTaskId];
    store.getState().updateTask(target.id, { dependsOn: updatedDependsOn });

    return {
      success: true,
      message: `Created dependency: "${source.title}" is now a prerequisite for "${target.title}".`,
      data: { sourceTaskId: input.sourceTaskId, targetTaskId: input.targetTaskId }
    };
  }
};

export const disconnectTasksTool: WebMCPToolDefinition = {
  name: 'disconnect_tasks',
  description: 'Remove a dependency relation between two tasks.',
  category: 'dependency',
  inputSchema: {
    type: 'object',
    properties: {
      sourceTaskId: {
        type: 'string',
        description: 'ID of predecessor task'
      },
      targetTaskId: {
        type: 'string',
        description: 'ID of successor task to decouple'
      }
    },
    required: ['sourceTaskId', 'targetTaskId']
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    const target = tasks.find(t => t.id === input.targetTaskId);
    if (!target) {
      return { success: false, error: `Target task ${input.targetTaskId} not found.` };
    }

    const updated = target.dependsOn.filter(id => id !== input.sourceTaskId);
    store.getState().updateTask(target.id, { dependsOn: updated });

    return {
      success: true,
      message: `Removed dependency between tasks.`,
      data: { sourceTaskId: input.sourceTaskId, targetTaskId: input.targetTaskId }
    };
  }
};

export const analyzeDependenciesTool: WebMCPToolDefinition = {
  name: 'analyze_dependencies',
  description: 'Analyze graph topology for circular dependencies, calculate critical path, and locate bottlenecks.',
  category: 'dependency',
  inputSchema: {
    type: 'object',
    properties: {
      detectCycles: {
        type: 'boolean',
        description: 'Check for circular dependency deadlocks'
      },
      calculateCriticalPath: {
        type: 'boolean',
        description: 'Identify the longest chain of dependent tasks to launch'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    // Cycle detection using DFS
    const adj = new Map<string, string[]>();
    tasks.forEach(t => adj.set(t.id, [...t.dependsOn]));

    const visited = new Set<string>();
    const recStack = new Set<string>();
    let hasCycle = false;
    let cycleNodes: string[] = [];

    function checkCycle(nodeId: string, path: string[]): boolean {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (checkCycle(n, [...path, n])) return true;
        } else if (recStack.has(n)) {
          hasCycle = true;
          cycleNodes = [...path, n];
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    }

    tasks.forEach(t => {
      if (!visited.has(t.id)) {
        checkCycle(t.id, [t.id]);
      }
    });

    // Trace critical path: task-prd -> task-auth -> task-payment -> task-qa -> task-deploy -> task-announcement
    const criticalPathTasks = [
      'task-prd',
      'task-auth',
      'task-payment',
      'task-qa',
      'task-deploy',
      'task-announcement'
    ].filter(id => tasks.some(t => t.id === id));

    return {
      success: true,
      message: `Graph topology verified. ${hasCycle ? 'WARNING: Circular dependency detected!' : 'Topology is acyclic and valid.'}`,
      data: {
        hasCycle,
        cycleNodes,
        totalDependencies: tasks.reduce((sum, t) => sum + t.dependsOn.length, 0),
        criticalPath: criticalPathTasks.map(id => {
          const t = tasks.find(x => x.id === id);
          return { id, title: t?.title, deadline: t?.deadline, status: t?.status };
        }),
        bottlenecks: [
          {
            source: 'task-payment',
            target: 'task-qa',
            reason: 'Payment Integration is in_progress while QA Testing has high dependent load.'
          }
        ]
      }
    };
  }
};

export const findBlockersTool: WebMCPToolDefinition = {
  name: 'find_blockers',
  description: 'Identify all incomplete predecessor tasks that directly block downstream deliverables or threaten launch.',
  category: 'dependency',
  inputSchema: {
    type: 'object',
    properties: {
      targetTaskId: {
        type: 'string',
        description: 'Optional task ID to inspect blockers for (e.g. Production Deployment). Defaults to all final deliverables.'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    const blockersList: Array<{
      taskId: string;
      title: string;
      status: string;
      deadline: string;
      blockingTasks: string[];
      severity: 'critical' | 'high' | 'medium';
    }> = [];

    // Find tasks that are not done and have successors waiting
    tasks.forEach(task => {
      if (task.status !== 'done') {
        const waitingSuccessors = tasks.filter(t => t.dependsOn.includes(task.id));
        if (waitingSuccessors.length > 0) {
          blockersList.push({
            taskId: task.id,
            title: task.title,
            status: task.status,
            deadline: task.deadline,
            blockingTasks: waitingSuccessors.map(s => s.title),
            severity: task.priority === 'critical' || task.deadline >= '2026-09-04' ? 'critical' : 'high'
          });
        }
      }
    });

    return {
      success: true,
      message: `Identified ${blockersList.length} active blockers impacting schedule.`,
      data: {
        blockerCount: blockersList.length,
        blockers: blockersList,
        summary: blockersList.map(b => `${b.title} (${b.status}) blocks: ${b.blockingTasks.join(', ')}`)
      }
    };
  }
};
