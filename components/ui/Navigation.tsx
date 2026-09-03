'use client';

import React from 'react';
import { 
  Bot, 
  User, 
  Users, 
  Search, 
  Bell, 
  Terminal, 
  Layers, 
  PlayCircle,
  Activity,
  Cpu,
  Workflow,
  Sparkles
} from 'lucide-react';
import { CollaborationMode } from '@/types';
import { useAppStore } from '@/lib/store';

export type NavTab = 'dashboard' | 'workspace' | 'agents' | 'tools' | 'activity' | 'integrations';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAskAgent: () => void;
  onToggleDemoTour: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAskAgent,
  onToggleDemoTour
}) => {
  const [state, store] = useAppStore();

  const handleModeChange = (mode: CollaborationMode) => {
    store.setCollaborationMode(mode);
  };

  return (
    <header className="sticky top-4 z-40 px-4 max-w-7xl mx-auto w-full mb-6">
      <nav className="glass-nav rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between border border-white/10 text-white">
        {/* Brand & WebMCP Badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4 text-zinc-950 font-bold" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-sm text-white">AGENTPILOT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-400 -mt-0.5 tracking-wide">HUMAN + AGENT COMMAND</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>WEBMCP ENABLED</span>
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'workspace', label: 'Workspace', icon: Layers },
            { id: 'agents', label: 'Agents', icon: Cpu },
            { id: 'tools', label: 'Tools', icon: Terminal },
            { id: 'activity', label: 'Activity', icon: Workflow },
            { id: 'integrations', label: 'Integrations', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as NavTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-md font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Section: Mode Switcher & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Collaboration Mode Switcher */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-full border border-white/10">
            <button
              title="Human Only mode"
              onClick={() => handleModeChange('human')}
              className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 transition-all ${
                state.collaborationMode === 'human'
                  ? 'bg-zinc-200 text-zinc-900 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">Human</span>
            </button>
            <button
              title="Collaborative (Shared Human + Agent Control)"
              onClick={() => handleModeChange('collaborative')}
              className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 transition-all ${
                state.collaborationMode === 'collaborative'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Collab</span>
            </button>
            <button
              title="Agent Autonomous mode"
              onClick={() => handleModeChange('agent')}
              className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 transition-all ${
                state.collaborationMode === 'agent'
                  ? 'bg-indigo-500 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span className="hidden sm:inline">Agent</span>
            </button>
          </div>

          {/* 14-Step Demo Button */}
          <button
            onClick={onToggleDemoTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Judge Demo Flow</span>
          </button>

          {/* Ask Agent Trigger Button */}
          <button
            onClick={onOpenAskAgent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ask Agent</span>
          </button>

          {/* User Avatar */}
          <div 
            className="w-8 h-8 rounded-full border border-white/20 overflow-hidden relative cursor-pointer"
            title="Elena Rostova (Lead Product Eng)"
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" 
              alt="Elena"
              className="w-full h-full object-cover" 
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
          </div>
        </div>
      </nav>
    </header>
  );
};
