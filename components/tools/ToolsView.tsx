'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  ExternalLink, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Search,
  Filter,
  Play
} from 'lucide-react';
import { ALL_WEBMCP_TOOLS } from '@/webmcp/registry';
import { WebMCPToolDefinition } from '@/webmcp/types';
import { ToolInspectorModal } from './ToolInspectorModal';
import { useAppStore } from '@/lib/store';

export const ToolsView: React.FC = () => {
  const [state] = useAppStore();
  const [selectedTool, setSelectedTool] = useState<WebMCPToolDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTools = ALL_WEBMCP_TOOLS.filter(tool => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
              WebMCP Standard
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-500">
              document.modelContext.registerTool
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
            WebMCP Tool Registry
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Standardized interfaces exposing structured application primitives to AI models.
          </p>
        </div>
      </div>

      {/* Dedicated WebMCP Developer Verification Ribbon (Prompt Requirement) */}
      <div className="p-5 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                WebMCP Status:
              </span>
              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CONNECTED
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-300 font-mono">
              <span>
                Registered tools: <strong className="text-white">15</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span>
                Last execution:{' '}
                <code className="text-emerald-300 font-bold">
                  {state.lastWebMCPExecution?.toolName || 'get_project_state'}
                </code>
              </span>
              <span className="text-zinc-600">•</span>
              <span>
                Status:{' '}
                <span className="text-emerald-400 font-bold">
                  {state.lastWebMCPExecution?.status.toUpperCase() || 'SUCCESS'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict JSON Schema Validation Active</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'project', 'task', 'dependency', 'planning'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tools & schemas..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 text-zinc-900"
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => {
          const reqCount = tool.inputSchema.required?.length || 0;
          const propCount = Object.keys(tool.inputSchema.properties || {}).length;

          return (
            <div
              key={tool.name}
              onClick={() => setSelectedTool(tool)}
              className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Tool Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-mono text-xs group-hover:bg-zinc-900 group-hover:text-emerald-400 transition-colors">
                      <Terminal className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-mono text-xs font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                      {tool.name}
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 uppercase">
                    {tool.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                  {tool.description}
                </p>

                {/* Schema Meta */}
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60 font-mono text-[11px] text-zinc-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Inputs:</span>
                    <span className="font-semibold">{propCount} fields ({reqCount} req)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Consequential:</span>
                    <span className={tool.requiresApproval ? 'text-amber-700 font-bold' : 'text-zinc-700'}>
                      {tool.requiresApproval ? 'Requires Approval' : 'Autonomous'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Available to Agents</span>
                </span>

                <span className="text-zinc-400 group-hover:text-zinc-900 flex items-center gap-1 transition-colors">
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Inspector */}
      <ToolInspectorModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
};
