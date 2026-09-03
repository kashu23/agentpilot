'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { useAppStore } from '@/lib/store';
import { 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Move, 
  ArrowRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface DragState {
  taskId: string;
  startX: number;
  startY: number;
  initialNodeX: number;
  initialNodeY: number;
}

export const VisualTaskCanvas: React.FC = () => {
  const [state, store] = useAppStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Status badge helper
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Done' };
      case 'in_progress':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'In Progress' };
      case 'blocked':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Blocked' };
      case 'review':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'Review' };
      default:
        return { bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', text: 'Todo' };
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-600 bg-rose-50 border-rose-200 font-bold';
      case 'high':
        return 'text-amber-600 bg-amber-50 border-amber-200 font-semibold';
      default:
        return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  // Node Dimensions
  const NODE_WIDTH = 270;
  const NODE_HEIGHT = 135;

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTaskId(task.id);
    setDragState({
      taskId: task.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: task.position.x,
      initialNodeY: task.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    const newX = Math.max(20, Math.min(950, dragState.initialNodeX + deltaX));
    const newY = Math.max(120, Math.min(900, dragState.initialNodeY + deltaY));

    store.updateTask(dragState.taskId, {
      position: { x: newX, y: newY },
      updatedBy: 'human'
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Inline Quick Deadline Toggle (Useful for testing demo step 12)
  const handleToggleDeadline = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    // Toggle between Sept 03 and Sept 04
    const newDeadline = task.deadline === '2026-09-04' ? '2026-09-03' : '2026-09-04';
    store.updateTask(task.id, {
      deadline: newDeadline,
      updatedBy: 'human'
    });
  };

  // Calculate Bezier Paths for Dependencies
  const renderDependencyLines = () => {
    const lines: React.ReactNode[] = [];

    state.tasks.forEach(task => {
      task.dependsOn.forEach(depId => {
        const parent = state.tasks.find(t => t.id === depId);
        if (!parent) return;

        // Parent center bottom / right
        const startX = parent.position.x + NODE_WIDTH / 2;
        const startY = parent.position.y + NODE_HEIGHT;

        // Target center top / left
        const endX = task.position.x + NODE_WIDTH / 2;
        const endY = task.position.y;

        const isConflict =
          new Date(parent.deadline).getTime() > new Date(task.deadline).getTime();

        // Cubic Bezier curve
        const dy = Math.abs(endY - startY);
        const cpY1 = startY + Math.max(30, dy * 0.4);
        const cpY2 = endY - Math.max(30, dy * 0.4);
        const pathData = `M ${startX},${startY} C ${startX},${cpY1} ${endX},${cpY2} ${endX},${endY}`;

        lines.push(
          <g key={`${parent.id}->${task.id}`} className="transition-all duration-300">
            {/* Outline / Shadow */}
            <path
              d={pathData}
              fill="none"
              stroke={isConflict ? '#FCA5A5' : '#E2E8F0'}
              strokeWidth={isConflict ? 4 : 3}
            />
            {/* Main Path */}
            <path
              d={pathData}
              fill="none"
              stroke={isConflict ? '#EF4444' : '#94A3B8'}
              strokeWidth={2}
              strokeDasharray={isConflict ? '4 4' : 'none'}
              markerEnd={isConflict ? 'url(#arrow-conflict)' : 'url(#arrow-normal)'}
            />
            {/* Animated Pulses on Active Connections */}
            {!isConflict && (
              <circle r="3" fill="#10B981">
                <animateMotion
                  path={pathData}
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      });
    });

    return lines;
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-[880px] bg-[#FAFAF8] rounded-3xl border border-zinc-200/90 shadow-inner overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(#E2E8F0 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}
    >
      {/* Root Canvas Header Banner: "PRODUCT LAUNCH" */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="px-6 py-2 rounded-2xl bg-zinc-950 text-white shadow-xl border border-zinc-800 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase">
            ROOT MILESTONE: {state.project.title.toUpperCase()} (SEPT 4)
          </span>
          <span className="text-zinc-500 font-mono text-xs">|</span>
          <span className="text-xs text-zinc-300 font-sans font-medium">
            Shared Human & Agent Graph Canvas
          </span>
        </div>
      </div>

      {/* Lane Background Column Guides */}
      <div className="absolute inset-0 grid grid-cols-3 pointer-events-none divide-x divide-zinc-200/60 pt-16">
        <div className="px-8 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider">
              PRODUCT ENGINEERING
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              Lane 1
            </span>
          </div>
        </div>
        <div className="px-8 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider">
              GROWTH & MARKETING
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              Lane 2
            </span>
          </div>
        </div>
        <div className="px-8 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider">
              OPERATIONS & PRICING
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              Lane 3
            </span>
          </div>
        </div>
      </div>

      {/* SVG Dependency Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <marker
            id="arrow-normal"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
          </marker>
          <marker
            id="arrow-conflict"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
          </marker>
        </defs>
        {renderDependencyLines()}
      </svg>

      {/* Draggable Task Node Cards */}
      {state.tasks.map(task => {
        const isDragging = dragState?.taskId === task.id;
        const isSelected = selectedTaskId === task.id;
        const statusBadge = getStatusBadge(task.status);
        const isConflict =
          task.id === 'task-deploy' &&
          task.deadline >= '2026-09-04' &&
          state.tasks.some(t => t.id === 'task-qa' && t.deadline >= '2026-09-04');

        return (
          <div
            key={task.id}
            onMouseDown={e => handleMouseDown(e, task)}
            style={{
              transform: `translate3d(${task.position.x}px, ${task.position.y}px, 0)`,
              width: `${NODE_WIDTH}px`,
              height: `${NODE_HEIGHT}px`
            }}
            className={`absolute z-20 cursor-grab active:cursor-grabbing bg-white/95 rounded-2xl p-3.5 border transition-shadow shadow-sm hover:shadow-lg ${
              isDragging ? 'scale-105 shadow-2xl z-30 border-zinc-900 ring-2 ring-zinc-900/10' : ''
            } ${
              isConflict
                ? 'border-rose-400 bg-gradient-to-br from-rose-50/70 to-white ring-2 ring-rose-300'
                : isSelected
                ? 'border-zinc-800'
                : 'border-zinc-200/90'
            }`}
          >
            {/* Card Header: Lane & Drag Handle & Priority */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                >
                  {statusBadge.text}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${getPriorityBadge(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center text-zinc-400 hover:text-zinc-600">
                <Move className="w-3 h-3" />
              </div>
            </div>

            {/* Title */}
            <h4 className="text-xs font-bold text-zinc-900 leading-tight mb-1 truncate">
              {task.title}
            </h4>

            {/* Description Snippet */}
            <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2.5">
              {task.description}
            </p>

            {/* Bottom Info: Owner Avatar, Deadline Pill, Dependencies */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px]">
              {/* Owner */}
              <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                <img
                  src={task.owner.avatar}
                  alt={task.owner.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
                <span className="text-zinc-600 truncate font-medium">{task.owner.name}</span>
              </div>

              {/* Deadline (Clickable toggle for demo) */}
              <button
                onClick={e => handleToggleDeadline(e, task)}
                title="Click to toggle deadline (Sept 3 / Sept 4)"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono transition-colors ${
                  isConflict
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                <Calendar className="w-2.5 h-2.5" />
                <span>{task.deadline.slice(5)}</span>
              </button>
            </div>

            {/* Agent / Human Source Indicator */}
            {task.updatedBy === 'agent' && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        );
      })}

      {/* Floating Canvas Footer Controls */}
      <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3 text-xs bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-200 shadow-sm font-mono text-zinc-600">
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-zinc-400" /> Drag any card to reposition
        </span>
        <span className="text-zinc-300">|</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-emerald-600" /> Click dates to toggle & test conflicts
        </span>
      </div>
    </div>
  );
};
