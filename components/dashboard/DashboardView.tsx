'use client';

import React from 'react';
import { MetricCards } from './MetricCards';
import { ActivityChart } from './ActivityChart';
import { LiveActivityFeed } from './LiveActivityFeed';
import { Plus, Sparkles, PlayCircle, ShieldCheck, Terminal, Bot } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface DashboardViewProps {
  onOpenAskAgent: () => void;
  onOpenWorkspace: () => void;
  onToggleDemoTour: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAskAgent,
  onOpenWorkspace,
  onToggleDemoTour
}) => {
  const [state] = useAppStore();

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-100/60 px-2 py-0.5 rounded-md">
              Shared Autonomous Workspace
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-mono text-zinc-500">
              WebMCP Protocol v1.0
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">
            Agent Command Center
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Monitor your projects, agents, decisions and automation from one shared workspace.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleDemoTour}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Judge Demo Flow</span>
          </button>

          <button
            onClick={onOpenWorkspace}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-500" />
            <span>Open Workspace</span>
          </button>

          <button
            onClick={onOpenAskAgent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask Agent</span>
          </button>
        </div>
      </div>

      {/* 4 Large Metric Cards */}
      <MetricCards />

      {/* Main Grid: Activity Chart (Large) + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart />

          {/* Quick Active Project Banner */}
          <div 
            onClick={onOpenWorkspace}
            className="cursor-pointer group bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Bot className="w-48 h-48 -mr-10 -mt-10 text-white" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-medium">
                    ACTIVE PROJECT
                  </span>
                  <span className="text-zinc-400 text-xs">
                    Target: {state.project.targetLaunchDate}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {state.project.title} — {state.project.tagline}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                  {state.project.description}
                </p>
              </div>

              <button className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-100 transition-colors shrink-0 shadow">
                Enter Visual Canvas →
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
};
