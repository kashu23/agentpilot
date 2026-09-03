'use client';

import React, { useState } from 'react';
import { 
  Workflow, 
  Bot, 
  User, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActivityEvent } from '@/types';

type FilterType = 'All' | 'Agent' | 'Human' | 'WebMCP' | 'Success' | 'Failed' | 'Approval';

export const ActivityView: React.FC = () => {
  const [state] = useAppStore();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filters: FilterType[] = ['All', 'Agent', 'Human', 'WebMCP', 'Success', 'Failed', 'Approval'];

  const filteredActivities = state.activities.filter(act => {
    switch (selectedFilter) {
      case 'Agent':
        return act.actor === 'agent';
      case 'Human':
        return act.actor === 'human';
      case 'WebMCP':
        return act.actor === 'webmcp' || act.type === 'tool_execution';
      case 'Approval':
        return act.type === 'approval_request' || act.action.includes('approval');
      case 'Success':
        return !act.action.includes('fail') && !act.action.includes('reject');
      case 'Failed':
        return act.action.includes('fail') || act.action.includes('reject');
      default:
        return true;
    }
  });

  const getActorBadge = (actor: ActivityEvent['actor']) => {
    switch (actor) {
      case 'agent':
        return {
          label: 'Agent',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: Bot
        };
      case 'human':
        return {
          label: 'Human',
          bg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          icon: User
        };
      case 'webmcp':
        return {
          label: 'WebMCP',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: Terminal
        };
      default:
        return {
          label: 'System',
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          icon: Workflow
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Audit Stream
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-500">Immutable Execution Journal</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
            Collaborative Activity Timeline
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Every human modification and WebMCP tool invocation audited with microsecond precision.
          </p>
        </div>

        <span className="text-xs font-mono text-zinc-500 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-xs self-start sm:self-auto">
          {filteredActivities.length} Events Logged
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
              selectedFilter === f
                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline Event List */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs">
        <div className="relative border-l-2 border-zinc-200 ml-4 pl-6 space-y-6">
          {filteredActivities.map((act, index) => {
            const actorBadge = getActorBadge(act.actor);
            const ActorIcon = actorBadge.icon;
            const isExpanded = expandedEventId === act.id;
            const isTool = act.type === 'tool_execution';
            const isApproval = act.type === 'approval_request';
            const isConflict = act.type === 'conflict_detected';

            return (
              <div key={act.id} className="relative group">
                {/* Timeline Bullet */}
                <span
                  className={`absolute -left-[35px] top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                    isConflict
                      ? 'bg-rose-500 text-white'
                      : isApproval
                      ? 'bg-amber-500 text-white'
                      : act.actor === 'agent'
                      ? 'bg-emerald-500 text-white'
                      : act.actor === 'human'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  <ActorIcon className="w-2.5 h-2.5" />
                </span>

                {/* Event Card */}
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : act.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isConflict
                      ? 'border-rose-300 bg-rose-50/40'
                      : isApproval
                      ? 'border-amber-300 bg-amber-50/40'
                      : isExpanded
                      ? 'border-zinc-300 bg-zinc-50'
                      : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {/* Timestamp */}
                      <span className="text-zinc-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {act.timestamp}
                      </span>

                      <span className="text-zinc-300">•</span>

                      {/* Actor Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${actorBadge.bg}`}
                      >
                        <ActorIcon className="w-2.5 h-2.5" />
                        <span>{actorBadge.label}</span>
                      </span>

                      <span className="text-zinc-300">•</span>

                      {/* Action Name */}
                      <span className="font-bold text-zinc-900 font-mono">
                        {act.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isConflict
                            ? 'bg-rose-100 text-rose-800'
                            : isApproval
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isConflict ? 'CONFLICT' : isApproval ? 'ACTION REQUIRED' : 'SUCCESS'}
                      </span>
                      <button className="text-zinc-400 hover:text-zinc-600">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-700 mt-2 font-sans leading-relaxed">
                    {act.description}
                  </p>

                  {/* Expanded Metadata JSON */}
                  {isExpanded && act.metadata && (
                    <div className="mt-3 pt-3 border-t border-zinc-200/70">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                        Structured Payload:
                      </span>
                      <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-zinc-800">
                        {JSON.stringify(act.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
