'use client';

import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Code,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { WebMCPToolDefinition } from '@/webmcp/types';
import { webMCPRegistry } from '@/webmcp/registry';
import { useAppStore } from '@/lib/store';

interface ToolInspectorModalProps {
  tool: WebMCPToolDefinition | null;
  onClose: () => void;
}

export const ToolInspectorModal: React.FC<ToolInspectorModalProps> = ({
  tool,
  onClose
}) => {
  const [state, store] = useAppStore();
  const [testInput, setTestInput] = useState<string>('{}');
  const [executionOutput, setExecutionOutput] = useState<any | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!tool) return null;

  // Initialize sample input based on tool
  const getSampleInput = (toolName: string): any => {
    switch (toolName) {
      case 'create_task':
        return {
          title: 'Staging Penetration Verification',
          priority: 'high',
          lane: 'product',
          deadline: '2026-09-03'
        };
      case 'update_task':
        return {
          taskId: 'task-payment',
          status: 'done'
        };
      case 'get_tasks':
        return {
          lane: 'product',
          status: 'in_progress'
        };
      case 'get_project_state':
        return {
          includeMetrics: true
        };
      case 'analyze_dependencies':
        return {
          detectCycles: true,
          calculateCriticalPath: true
        };
      case 'find_blockers':
        return {};
      case 'generate_plan':
        return {
          targetDate: '2026-09-04',
          bufferDays: 1
        };
      default:
        return {};
    }
  };

  const handleSetSample = () => {
    setTestInput(JSON.stringify(getSampleInput(tool.name), null, 2));
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecutionOutput(null);

    try {
      const parsedInput = JSON.parse(testInput || '{}');
      const res = await webMCPRegistry.executeTool(tool.name, parsedInput, {
        actor: 'developer_inspect'
      });
      setExecutionOutput(res);
    } catch (err: any) {
      setExecutionOutput({
        success: false,
        error: `JSON Input Parse Error: ${err?.message}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(tool.inputSchema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold text-zinc-950">{tool.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  Registered on WebMCP
                </span>
                {tool.requiresApproval && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-2.5 h-2.5" /> Requires Approval
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Category: {tool.category.toUpperCase()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase font-mono mb-1">
              Tool Description
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
              {tool.description}
            </p>
          </div>

          {/* JSON Schema */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase font-mono">
                Input JSON Schema
              </h4>
              <button
                onClick={handleCopySchema}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-zinc-800">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </div>

          {/* Interactive Test Runner */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test Tool Live via WebMCP Engine</span>
              </h4>

              <button
                onClick={handleSetSample}
                className="text-[11px] font-mono text-indigo-600 hover:underline"
              >
                Load Sample Payload
              </button>
            </div>

            <textarea
              rows={3}
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              placeholder='Enter JSON arguments e.g. { "title": "Example" }'
              className="w-full p-3 rounded-xl border border-zinc-300 font-mono text-xs focus:ring-2 focus:ring-zinc-900/10 focus:outline-none text-zinc-900"
            />

            <div className="flex justify-end mt-2">
              <button
                disabled={isExecuting}
                onClick={handleExecute}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span>{isExecuting ? 'Running...' : 'Execute Tool'}</span>
              </button>
            </div>

            {/* Execution Result Output */}
            {executionOutput && (
              <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {executionOutput.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className={executionOutput.success ? 'text-emerald-800' : 'text-rose-800'}>
                    Execution Status: {executionOutput.success ? 'SUCCESS (200 OK)' : 'FAILED'}
                  </span>
                </div>
                <pre className="mt-2 text-[11px] text-zinc-800 bg-white p-2.5 rounded-lg border border-zinc-200 overflow-x-auto max-h-40">
                  {JSON.stringify(executionOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Registered on window.document.modelContext</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
