import { useState, useEffect } from 'react';
import {
  Project,
  Task,
  Milestone,
  Agent,
  Integration,
  ActivityEvent,
  ApprovalProposal,
  CollaborationMode
} from '@/types';
import {
  INITIAL_PROJECT,
  INITIAL_TASKS,
  INITIAL_AGENTS,
  INITIAL_INTEGRATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_PENDING_APPROVAL
} from './initial-data';
import { initWebMCPOnDocument } from '@/webmcp/registry';

export interface AppState {
  project: Project;
  tasks: Task[];
  agents: Agent[];
  integrations: Integration[];
  activities: ActivityEvent[];
  pendingApproval: ApprovalProposal | null;
  collaborationMode: CollaborationMode;
  isAgentRunning: boolean;
  isAgentPaused: boolean;
  agentStatusMessage: string;
  lastWebMCPExecution: {
    toolName: string;
    status: 'success' | 'failed' | 'requires_approval';
    timestamp: string;
  } | null;
  conflictWarning: string | null;
  showConflictAlert: boolean;
}

type Listener = () => void;

class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = {
      project: INITIAL_PROJECT,
      tasks: INITIAL_TASKS,
      agents: INITIAL_AGENTS,
      integrations: INITIAL_INTEGRATIONS,
      activities: INITIAL_ACTIVITIES,
      pendingApproval: INITIAL_PENDING_APPROVAL,
      collaborationMode: 'collaborative',
      isAgentRunning: false,
      isAgentPaused: false,
      agentStatusMessage: 'Agent ready on WebMCP',
      lastWebMCPExecution: {
        toolName: 'analyze_dependencies',
        status: 'success',
        timestamp: 'Just now'
      },
      conflictWarning: null,
      showConflictAlert: false
    };

    if (typeof window !== 'undefined') {
      (window as any).__AGENTPILOT_STORE__ = this;
      initWebMCPOnDocument();
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  // Domain Actions
  public updateProject(updates: Partial<Project>): void {
    this.state.project = { ...this.state.project, ...updates, updatedAt: new Date().toISOString() };
    this.notify();
  }

  public addTask(task: Task): void {
    this.state.tasks = [...this.state.tasks, task];
    this.state.activities = [
      {
        id: `act-${Date.now()}`,
        type: 'human_action',
        actor: task.createdBy,
        actorName: task.createdBy === 'agent' ? 'WebMCP Agent' : 'Human Operator',
        action: 'create_task',
        description: `Created task "${task.title}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: { taskId: task.id, lane: task.lane, deadline: task.deadline }
      },
      ...this.state.activities
    ];
    this.checkDependencyConflicts();
    this.notify();
  }

  public updateTask(id: string, updates: Partial<Task>): void {
    const prevTask = this.state.tasks.find(t => t.id === id);
    this.state.tasks = this.state.tasks.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );

    // If a human updated the deadline or status, record event and check conflicts
    if (updates.deadline || updates.status || updates.priority) {
      this.state.activities = [
        {
          id: `act-${Date.now()}`,
          type: 'human_action',
          actor: updates.updatedBy || 'human',
          actorName: (updates.updatedBy === 'agent') ? 'WebMCP Agent' : 'Human Operator',
          action: 'update_task',
          description: `Updated "${prevTask?.title || id}": ${
            updates.deadline ? `deadline → ${updates.deadline}` : updates.status ? `status → ${updates.status}` : 'details'
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: { taskId: id, updates }
        },
        ...this.state.activities
      ];
    }

    // Step 12/13 trigger: If human moved Production Deployment from Thursday to Friday, trigger agent conflict!
    if (id === 'task-deploy' && updates.deadline && (updates.updatedBy === 'human' || !updates.updatedBy)) {
      this.detectDeploymentConflict(updates.deadline);
    } else {
      this.checkDependencyConflicts();
    }

    this.notify();
  }

  public deleteTask(id: string): void {
    const taskToDelete = this.state.tasks.find(t => t.id === id);
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    // Remove from other dependencies
    this.state.tasks = this.state.tasks.map(t => ({
      ...t,
      dependsOn: t.dependsOn.filter(d => d !== id)
    }));

    this.state.activities = [
      {
        id: `act-${Date.now()}`,
        type: 'human_action',
        actor: 'human',
        actorName: 'Human Operator',
        action: 'delete_task',
        description: `Deleted task "${taskToDelete?.title || id}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...this.state.activities
    ];
    this.checkDependencyConflicts();
    this.notify();
  }

  public addMilestone(milestone: Milestone): void {
    this.state.project.milestones = [...this.state.project.milestones, milestone];
    this.notify();
  }

  public setPendingApproval(proposal: ApprovalProposal | null): void {
    this.state.pendingApproval = proposal;
    if (proposal) {
      this.state.activities = [
        {
          id: `act-prop-${Date.now()}`,
          type: 'approval_request',
          actor: 'agent',
          actorName: 'Lead Planner Agent',
          action: 'proposal_submitted',
          description: `Proposal: "${proposal.title}" submitted for human review.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: { proposalId: proposal.id }
        },
        ...this.state.activities
      ];
    }
    this.notify();
  }

  public resolveApproval(
    proposalId: string,
    action: 'approved' | 'rejected' | 'modified',
    modifiedProposal?: ApprovalProposal
  ): void {
    const proposal = modifiedProposal || this.state.pendingApproval;
    if (!proposal) return;

    if (action === 'approved' || action === 'modified') {
      // Execute changes from proposal
      const moveTasks = proposal.proposedChanges.moveTasks || [];
      const createTasks = proposal.proposedChanges.createTasks || [];

      // Update moved tasks
      moveTasks.forEach(item => {
        this.updateTask(item.taskId, {
          deadline: item.proposedDeadline,
          updatedBy: 'agent'
        });
      });

      // Create new tasks
      createTasks.forEach((item, idx) => {
        const newTask: Task = {
          id: `task-gen-${Date.now()}-${idx}`,
          projectId: this.state.project.id,
          title: item.title,
          description: 'Created by Agent schedule optimization proposal via WebMCP.',
          status: 'todo',
          priority: item.priority,
          owner: {
            name: 'DevOps Sentinel',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
            role: 'Platform Architect'
          },
          deadline: item.deadline,
          lane: item.lane,
          position: { x: 120, y: 640 },
          dependsOn: item.dependsOn,
          createdBy: 'agent',
          updatedBy: 'agent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.addTask(newTask);
      });

      // Mark project status as ready / on_track
      this.state.project.status = 'ready';

      this.state.activities = [
        {
          id: `act-appr-${Date.now()}`,
          type: 'human_action',
          actor: 'human',
          actorName: 'Human Operator',
          action: action === 'modified' ? 'proposal_modified_and_approved' : 'proposal_approved',
          description: `Human approved proposal: "${proposal.title}". WebMCP scheduled 3 updates.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...this.state.activities
      ];
    } else {
      this.state.activities = [
        {
          id: `act-rej-${Date.now()}`,
          type: 'human_action',
          actor: 'human',
          actorName: 'Human Operator',
          action: 'proposal_rejected',
          description: `Human rejected proposal: "${proposal.title}".`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...this.state.activities
      ];
    }

    this.state.pendingApproval = null;
    this.notify();
  }

  public addActivity(activity: ActivityEvent): void {
    this.state.activities = [activity, ...this.state.activities];
    if (activity.type === 'tool_execution') {
      this.state.lastWebMCPExecution = {
        toolName: activity.action,
        status: 'success',
        timestamp: 'Just now'
      };
    }
    this.notify();
  }

  public setCollaborationMode(mode: CollaborationMode): void {
    this.state.collaborationMode = mode;
    this.state.project.collaborativeMode = mode;
    this.state.activities = [
      {
        id: `act-mode-${Date.now()}`,
        type: 'human_action',
        actor: 'human',
        actorName: 'Human Operator',
        action: 'set_collaboration_mode',
        description: `Switched mode to: ${mode.toUpperCase()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...this.state.activities
    ];
    this.notify();
  }

  public setAgentRunning(running: boolean, message?: string): void {
    this.state.isAgentRunning = running;
    if (message) this.state.agentStatusMessage = message;
    this.notify();
  }

  public pauseAgent(): void {
    this.state.isAgentPaused = true;
    this.state.agentStatusMessage = 'Agent paused by human operator.';
    this.state.activities = [
      {
        id: `act-pause-${Date.now()}`,
        type: 'human_action',
        actor: 'human',
        actorName: 'Human Operator',
        action: 'pause_agent',
        description: 'Interrupted and paused agent execution.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...this.state.activities
    ];
    this.notify();
  }

  public resumeAgent(): void {
    this.state.isAgentPaused = false;
    this.state.agentStatusMessage = 'Agent resumed.';
    this.notify();
  }

  public stopAgent(): void {
    this.state.isAgentRunning = false;
    this.state.isAgentPaused = false;
    this.state.agentStatusMessage = 'Agent stopped by human operator.';
    this.state.activities = [
      {
        id: `act-stop-${Date.now()}`,
        type: 'human_action',
        actor: 'human',
        actorName: 'Human Operator',
        action: 'stop_agent',
        description: 'Terminated active agent execution.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...this.state.activities
    ];
    this.notify();
  }

  public dismissConflictAlert(): void {
    this.state.showConflictAlert = false;
    this.notify();
  }

  // Core Demo Reactive Hook (Step 12 & 13)
  private detectDeploymentConflict(newDeadline: string): void {
    const qaTask = this.state.tasks.find(t => t.id === 'task-qa');
    if (newDeadline >= '2026-09-04' && qaTask) {
      this.state.conflictWarning = `Your manual change to "Production Deployment" (${newDeadline}) creates a dependency conflict with downstream launch timing. Would you like me to recalculate the plan?`;
      this.state.showConflictAlert = true;

      this.state.activities = [
        {
          id: `act-conf-${Date.now()}`,
          type: 'conflict_detected',
          actor: 'agent',
          actorName: 'Dependency Sentinel Agent',
          action: 'conflict_detected',
          description: `Conflict alert: Production Deployment moved to ${newDeadline}, eliminating buffer before Friday cutover.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...this.state.activities
      ];
    }
  }

  private checkDependencyConflicts(): void {
    // Check general sequencing
    const tasks = this.state.tasks;
    let conflictFound = false;

    for (const task of tasks) {
      for (const depId of task.dependsOn) {
        const dep = tasks.find(t => t.id === depId);
        if (dep && new Date(dep.deadline).getTime() > new Date(task.deadline).getTime()) {
          this.state.conflictWarning = `Sequencing conflict: Prerequisite "${dep.title}" (${dep.deadline}) is scheduled AFTER "${task.title}" (${task.deadline}).`;
          this.state.showConflictAlert = true;
          conflictFound = true;
          break;
        }
      }
      if (conflictFound) break;
    }

    if (!conflictFound && !this.state.conflictWarning?.includes('Production Deployment')) {
      this.state.conflictWarning = null;
      this.state.showConflictAlert = false;
    }
  }

  public resetToDemo(): void {
    this.state = {
      project: JSON.parse(JSON.stringify(INITIAL_PROJECT)),
      tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
      agents: JSON.parse(JSON.stringify(INITIAL_AGENTS)),
      integrations: JSON.parse(JSON.stringify(INITIAL_INTEGRATIONS)),
      activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
      pendingApproval: JSON.parse(JSON.stringify(INITIAL_PENDING_APPROVAL)),
      collaborationMode: 'collaborative',
      isAgentRunning: false,
      isAgentPaused: false,
      agentStatusMessage: 'Agent ready on WebMCP',
      lastWebMCPExecution: {
        toolName: 'analyze_dependencies',
        status: 'success',
        timestamp: 'Just now'
      },
      conflictWarning: null,
      showConflictAlert: false
    };
    this.notify();
  }
}

export const appStore = new Store();

// React Hook to consume appStore
export function useAppStore(): [AppState, Store] {
  const [state, setState] = useState<AppState>(appStore.getState());

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setState({ ...appStore.getState() });
    });
    return unsubscribe;
  }, []);

  return [state, appStore];
}
