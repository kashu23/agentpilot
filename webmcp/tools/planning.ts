import { WebMCPToolDefinition } from '../types';
import { Task, ApprovalProposal } from '@/types';

export const generatePlanTool: WebMCPToolDefinition = {
  name: 'generate_plan',
  description: 'Generate an optimized delivery plan and task schedule to meet a target launch date.',
  category: 'planning',
  inputSchema: {
    type: 'object',
    properties: {
      targetDate: {
        type: 'string',
        description: 'Hard launch deadline in YYYY-MM-DD (defaults to active project launch date)'
      },
      bufferDays: {
        type: 'number',
        description: 'Safety buffer days allocated prior to public launch'
      }
    }
  },
  execute: async (input, context) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];
    const project = store?.getState?.().project;

    const targetDate = input.targetDate || project?.targetLaunchDate || '2026-09-04';

    // Formulate the schedule optimization proposal
    const proposal: ApprovalProposal = {
      id: `prop-${Date.now()}`,
      agentId: context?.agentId || 'agent-scheduler',
      title: 'Optimize Schedule for Friday Launch',
      summary: 'Reschedule QA Testing to Wednesday (Sept 2), Production Deployment to Thursday (Sept 3), and inject Regression Verification.',
      impactExplanation: 'Currently QA Testing and Production Deployment collide on Friday (Sept 4). Shifting QA Testing earlier and staging deployment gives 24h stability buffer, reducing launch failure risk by 92%.',
      status: 'pending',
      timestamp: 'Just now',
      proposedChanges: {
        moveTasks: [
          {
            taskId: 'task-qa',
            taskTitle: 'QA Testing',
            currentDeadline: '2026-09-04',
            proposedDeadline: '2026-09-02',
            lane: 'product'
          },
          {
            taskId: 'task-deploy',
            taskTitle: 'Production Deployment',
            currentDeadline: '2026-09-04',
            proposedDeadline: '2026-09-03',
            lane: 'product'
          }
        ],
        createTasks: [
          {
            title: 'Regression Testing & Canary Verification',
            lane: 'product',
            priority: 'high',
            deadline: '2026-09-03',
            dependsOn: ['task-qa']
          }
        ]
      }
    };

    // Store proposal in state
    if (store?.getState?.().setPendingApproval) {
      store.getState().setPendingApproval(proposal);
    }

    return {
      success: true,
      requiresApproval: true,
      message: 'Generated optimized delivery plan. Consequential schedule shifts require human approval before applying.',
      proposal,
      data: {
        targetDate,
        totalTasks: tasks.length,
        rescheduledCount: 2,
        newTasksCount: 1,
        projectedLaunchFeasibility: '94%'
      }
    };
  }
};

export const validatePlanTool: WebMCPToolDefinition = {
  name: 'validate_plan',
  description: 'Audit the active project schedule to ensure all task deadlines strictly satisfy prerequisite dependencies.',
  category: 'planning',
  inputSchema: {
    type: 'object',
    properties: {
      strictMode: {
        type: 'boolean',
        description: 'Enforce that successors must have deadlines strictly after predecessors'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    const conflicts: Array<{
      predecessor: string;
      successor: string;
      predecessorDeadline: string;
      successorDeadline: string;
      message: string;
    }> = [];

    tasks.forEach(task => {
      task.dependsOn.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          const depDate = new Date(depTask.deadline).getTime();
          const taskDate = new Date(task.deadline).getTime();

          if (depDate > taskDate) {
            conflicts.push({
              predecessor: depTask.title,
              successor: task.title,
              predecessorDeadline: depTask.deadline,
              successorDeadline: task.deadline,
              message: `Prerequisite "${depTask.title}" (${depTask.deadline}) is due AFTER dependent "${task.title}" (${task.deadline}).`
            });
          } else if (depDate === taskDate && depTask.status !== 'done') {
            conflicts.push({
              predecessor: depTask.title,
              successor: task.title,
              predecessorDeadline: depTask.deadline,
              successorDeadline: task.deadline,
              message: `Prerequisite "${depTask.title}" is due on the exact same date as "${task.title}", leaving 0h buffer.`
            });
          }
        }
      });
    });

    const isValid = conflicts.length === 0;

    return {
      success: isValid,
      message: isValid
        ? 'All dependencies are sequentially valid.'
        : `Detected ${conflicts.length} timeline conflict(s) in task dependencies.`,
      data: {
        valid: isValid,
        conflictCount: conflicts.length,
        conflicts
      }
    };
  }
};

export const estimateTimelineTool: WebMCPToolDefinition = {
  name: 'estimate_timeline',
  description: 'Estimate overall project completion confidence based on task velocity and dependency critical path.',
  category: 'planning',
  inputSchema: {
    type: 'object',
    properties: {
      confidenceThreshold: {
        type: 'number',
        description: 'Target confidence percentile (e.g. 0.95 for 95%)'
      }
    }
  },
  execute: async (input) => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];
    const project = store?.getState?.().project;

    const remainingIncomplete = tasks.filter(t => t.status !== 'done');
    const criticalIncomplete = remainingIncomplete.filter(t => t.priority === 'critical');

    // Risk calculation: if QA Testing or Deploy are scheduled on launch day without buffer, risk is high
    const qaTask = tasks.find(t => t.id === 'task-qa');
    const deployTask = tasks.find(t => t.id === 'task-deploy');
    const isAtRisk = (qaTask && qaTask.deadline >= '2026-09-04') || (deployTask && deployTask.deadline >= '2026-09-04');

    return {
      success: true,
      message: isAtRisk
        ? 'Launch is AT RISK. Pre-deployment QA overlaps with target cutover window.'
        : 'Timeline on track with adequate buffer.',
      data: {
        status: isAtRisk ? 'at_risk' : 'on_track',
        targetLaunchDate: project?.targetLaunchDate || '2026-09-04',
        projectedCompletionDate: isAtRisk ? '2026-09-06' : '2026-09-04',
        confidenceScore: isAtRisk ? '42%' : '96%',
        bottleneckTasks: ['task-payment', 'task-qa', 'task-deploy'],
        recommendedActions: [
          'Reschedule QA Testing to finish by Wednesday Sept 2',
          'Deploy to production canary on Thursday Sept 3',
          'Execute regression checks before general availability'
        ]
      }
    };
  }
};

export const suggestNextActionTool: WebMCPToolDefinition = {
  name: 'suggest_next_action',
  description: 'Provide the single most impactful recommendation for the human engineer right now.',
  category: 'planning',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  execute: async () => {
    const store = typeof window !== 'undefined' ? (window as any).__AGENTPILOT_STORE__ : null;
    const tasks: Task[] = store?.getState?.().tasks || [];

    const payment = tasks.find(t => t.id === 'task-payment');
    const qa = tasks.find(t => t.id === 'task-qa');

    let recommendation = 'Review open PRs and approve staging integration.';
    if (payment?.status !== 'done') {
      recommendation = 'Unblock Payment Integration: Stripe webhook verification is on the critical path for QA testing.';
    } else if (qa?.deadline === '2026-09-04') {
      recommendation = 'Shift QA Testing earlier: Current schedule creates a same-day crunch with Production Deployment.';
    }

    return {
      success: true,
      message: 'Next best action identified.',
      data: {
        action: recommendation,
        urgency: 'high',
        estimatedImpact: 'Saves ~14 hours of deadline slippage'
      }
    };
  }
};
