'use client';

import React, { useState } from 'react';
import { VisualTaskCanvas } from './VisualTaskCanvas';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Layers, 
  AlertTriangle, 
  Bot, 
  User, 
  Users, 
  Pause, 
  Square, 
  Play, 
  RotateCcw,
  CheckCircle2,
  Workflow,
  Wand2,
  X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TaskPriority } from '@/types';

interface WorkspaceViewProps {
  onOpenAskAgent: () => void;
  onOpenApprovalModal: () => void;
  onOpenActivity: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  onOpenAskAgent,
  onOpenApprovalModal,
  onOpenActivity
}) => {
  const [state, store] = useAppStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLane, setNewTaskLane] = useState<'product' | 'marketing' | 'operations'>('product');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const x = newTaskLane === 'marketing' ? 440 : newTaskLane === 'operations' ? 760 : 120;
    const laneTasks = state.tasks.filter(t => t.lane === newTaskLane);
    const lastY = laneTasks.length > 0 ? Math.max(...laneTasks.map(t => t.position.y)) : 140;

    store.addTask({
      id: `task-${Date.now()}`,
      projectId: state.project.id,
      title: newTaskTitle.trim(),
      description: 'Manually created via Workspace command bar.',
      status: 'todo',
      priority: newTaskPriority,
      owner: {
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'Head of Product'
      },
      deadline: '2026-09-04',
      lane: newTaskLane,
      position: { x, y: lastY + 140 },
      dependsOn: [],
      createdBy: 'human',
      updatedBy: 'human',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleRecalculatePlan = () => {
    store.dismissConflictAlert();
    onOpenAskAgent();
  };

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-zinc-500">
              Project Launch
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Graph Canvas
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
              {state.project.title} — {state.project.tagline}
            </h1>
            <span className="text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
              Target Deadline: Friday, September 4
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={onOpenApprovalModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs font-semibold transition-colors shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Generate Plan</span>
          </button>

          <button
            onClick={onOpenActivity}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs font-semibold transition-colors shadow-xs"
          >
            <Workflow className="w-3.5 h-3.5 text-zinc-500" />
            <span>View Activity</span>
          </button>

          <button
            onClick={onOpenAskAgent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask Agent</span>
          </button>
        </div>
      </div>

      {/* Collaboration Indicator & Human Interruption Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Collaboration Indicator */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="font-bold text-zinc-900">HUMAN CONTROL:</span>
            <span className="text-zinc-600">You are editing & dragging tasks</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-zinc-200" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-emerald-800">AGENT CONTROL:</span>
            <span className="text-zinc-600">
              {state.isAgentRunning ? 'Agent is analyzing graph...' : 'Agent observing state'}
            </span>
          </div>
        </div>

        {/* Guiding Principle & Interruption Controls */}
        <div className="flex items-center gap-3">
          <span className="hidden xl:inline text-xs text-zinc-400 italic">
            "The agent can propose. You decide."
          </span>

          {state.isAgentRunning && (
            <div className="flex items-center gap-2 bg-zinc-100 px-2.5 py-1 rounded-xl">
              <button
                onClick={() => (state.isAgentPaused ? store.resumeAgent() : store.pauseAgent())}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1"
              >
                {state.isAgentPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{state.isAgentPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={() => store.stopAgent()}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 ml-2"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reactive Conflict Warning Banner (Step 13/14 Trigger) */}
      {state.showConflictAlert && state.conflictWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-amber-900">
                  AGENT PROACTIVE CONFLICT ALERT
                </span>
                <span className="text-[10px] font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                  WebMCP Reactive Listener
                </span>
              </div>
              <p className="text-xs text-amber-950 mt-0.5 font-medium">
                {state.conflictWarning}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => store.dismissConflictAlert()}
              className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleRecalculatePlan}
              className="px-4 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recalculate Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Task Drawer / Inline Form */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 rounded-2xl bg-white border border-zinc-300 shadow-md flex flex-wrap items-center gap-3 animate-in fade-in duration-150"
        >
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Task title (e.g. End-to-end security penetration test)..."
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 text-zinc-900"
            />
          </div>

          <select
            value={newTaskLane}
            onChange={e => setNewTaskLane(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-white"
          >
            <option value="product">Lane: Product Engineering</option>
            <option value="marketing">Lane: Growth & Marketing</option>
            <option value="operations">Lane: Operations & Pricing</option>
          </select>

          <select
            value={newTaskPriority}
            onChange={e => setNewTaskPriority(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-white"
          >
            <option value="low">Priority: Low</option>
            <option value="medium">Priority: Medium</option>
            <option value="high">Priority: High</option>
            <option value="critical">Priority: Critical</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Main Visual Task Graph Canvas */}
      <VisualTaskCanvas />
    </div>
  );
};
