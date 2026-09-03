'use client';

import React, { useState } from 'react';
import { Bot, Cpu, ShieldCheck, Activity, Terminal, ArrowRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Agent } from '@/types';

export const AgentsView: React.FC<{ onOpenAskAgent: () => void }> = ({ onOpenAskAgent }) => {
  const [state] = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
              Multi-Agent Mesh
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-500">4 Active Autonomous Units</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
            AI Agent Fleet
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Dedicated autonomous specialized agents operating through typed WebMCP tools.
          </p>
        </div>

        <button
          onClick={onOpenAskAgent}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Instruct Fleet</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.agents.map(agent => (
          <div
            key={agent.id}
            className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">{agent.name}</h3>
                    <span className="text-xs font-mono text-zinc-500">{agent.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize">{agent.status}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                {agent.description}
              </p>

              {/* Current Task Box */}
              {agent.currentTask && (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 mb-4 text-xs">
                  <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 block mb-0.5">
                    Active Assignment
                  </span>
                  <p className="text-zinc-800 font-mono font-medium text-[11px] truncate">
                    {agent.currentTask}
                  </p>
                </div>
              )}

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 font-mono text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 block">SUCCESS</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {agent.successRate}%
                  </span>
                </div>
                <div className="border-x border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block">EXECUTIONS</span>
                  <span className="text-sm font-extrabold text-zinc-900">
                    {agent.executionsCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">TOOLS</span>
                  <span className="text-sm font-extrabold text-zinc-900">
                    {agent.toolsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last run: {agent.lastRun}
              </span>

              <button
                onClick={() => setSelectedAgent(agent)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Open Agent</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Agent Drawer / Inspector Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">{selectedAgent.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{selectedAgent.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-zinc-400 hover:text-zinc-700 font-mono text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {selectedAgent.description}
            </p>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Autonomous Runtime:</span>
                <span className="font-semibold text-zinc-900">WebMCP Safe Sandbox</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Approval Requirement:</span>
                <span className="font-semibold text-amber-700">Enforced on Consequential Ops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Subscribed Protocols:</span>
                <span className="font-semibold text-zinc-900">ModelContext Protocol v1</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-semibold hover:bg-zinc-200"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  onOpenAskAgent();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800"
              >
                Prompt Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
