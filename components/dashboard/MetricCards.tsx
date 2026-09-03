'use client';

import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, Cpu, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export const MetricCards: React.FC = () => {
  const [state] = useAppStore();

  const totalTasks = state.tasks.length;
  const pendingApprovalsCount = state.pendingApproval ? 1 : 0;
  
  const cards = [
    {
      title: 'ACTIVE PROJECTS',
      value: '04',
      description: '1 high-priority release active',
      trend: '+1 this week',
      trendPositive: true,
      icon: Layers,
      accent: 'zinc',
      sparks: [35, 45, 40, 60, 55, 75, 90]
    },
    {
      title: 'AGENT TASKS',
      value: `${totalTasks < 10 ? `0${totalTasks}` : totalTasks}`,
      description: '8 synchronized via WebMCP',
      trend: '+12% velocity',
      trendPositive: true,
      icon: Cpu,
      accent: 'emerald',
      sparks: [20, 30, 45, 60, 50, 80, 95]
    },
    {
      title: 'PENDING APPROVALS',
      value: `${pendingApprovalsCount < 10 ? `0${pendingApprovalsCount}` : pendingApprovalsCount}`,
      description: pendingApprovalsCount > 0 ? 'Consequential changes queued' : 'All proposals resolved',
      trend: pendingApprovalsCount > 0 ? 'Action required' : 'Clear',
      trendPositive: pendingApprovalsCount === 0,
      icon: AlertTriangle,
      accent: pendingApprovalsCount > 0 ? 'amber' : 'zinc',
      sparks: [10, 20, 15, 30, 25, 40, pendingApprovalsCount * 30]
    },
    {
      title: 'AUTOMATION SUCCESS',
      value: '98.4%',
      description: '248 safe WebMCP tool runs',
      trend: '+0.6% precision',
      trendPositive: true,
      icon: CheckCircle2,
      accent: 'emerald',
      sparks: [85, 90, 88, 94, 96, 98, 98.4]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isAmber = card.accent === 'amber';
        const isEmerald = card.accent === 'emerald';

        return (
          <div
            key={idx}
            className={`relative overflow-hidden bg-white/95 rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-all group ${
              isAmber ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/40 to-white' : ''
            }`}
          >
            {/* Header / Label */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-500 uppercase">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isAmber
                    ? 'bg-amber-100 text-amber-700'
                    : isEmerald
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Main Metric Value */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">
                {card.value}
              </div>
              <div
                className={`flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  card.trendPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700 font-semibold'
                }`}
              >
                {card.trendPositive ? (
                  <TrendingUp className="w-3 h-3 mr-1 inline" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mr-1 inline" />
                )}
                {card.trend}
              </div>
            </div>

            {/* Subtitle & Sparkline */}
            <div className="mt-3 flex items-end justify-between pt-2 border-t border-zinc-100">
              <p className="text-xs text-zinc-500 truncate pr-2">{card.description}</p>
              
              {/* Mini Sparkline SVG */}
              <div className="w-16 h-5 flex items-end gap-[3px] shrink-0">
                {card.sparks.map((val, sIdx) => {
                  const heightPercent = Math.max(15, Math.min(100, val));
                  return (
                    <div
                      key={sIdx}
                      style={{ height: `${heightPercent}%` }}
                      className={`w-1 rounded-t-sm transition-all duration-300 ${
                        isAmber
                          ? 'bg-amber-400'
                          : isEmerald
                          ? 'bg-emerald-400'
                          : 'bg-zinc-300 group-hover:bg-zinc-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
