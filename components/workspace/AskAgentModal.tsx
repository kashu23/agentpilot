'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  Check, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Pause, 
  Square, 
  Play, 
  Wand2, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AgentPilotEngine, AgentStepTrace } from '@/lib/agent-engine';

interface AskAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApprovalModal?: () => void;
}

export const AskAgentModal: React.FC<AskAgentModalProps> = ({
  isOpen,
  onClose,
  onOpenApprovalModal
}) => {
  const [state, store] = useAppStore();
  const [query, setQuery] = useState('Can we still launch Friday?');
  const [steps, setSteps] = useState<AgentStepTrace[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [isAtRisk, setIsAtRisk] = useState(false);

  if (!isOpen) return null;

  const quickActions = [
    'Can we still launch Friday?',
    'Find blockers',
    'Generate plan',
    'Prioritize tasks',
    'Estimate timeline',
    'Optimize schedule'
  ];

  const handleRunAnalysis = async (customQuery?: string) => {
    const q = customQuery || query;
    setQuery(q);
    setIsRunning(true);
    setFinalAnswer(null);
    setSteps([]);

    const result = await AgentPilotEngine.analyzeLaunchRisk(updatedSteps => {
      setSteps(updatedSteps);
    });

    setIsRunning(false);
    setFinalAnswer(result.finalAnswer);
    setIsAtRisk(result.isAtRisk);
  };

  const handleFixSchedule = async () => {
    setIsRunning(true);
    const proposal = await AgentPilotEngine.generateScheduleFix(updatedSteps => {
      setSteps(prev => [...prev, ...updatedSteps]);
    });
    setIsRunning(false);

    if (proposal) {
      onClose();
      onOpenApprovalModal?.();
    }
  };

  const handlePause = () => {
    store.pauseAgent();
  };

  const handleResume = () => {
    store.resumeAgent();
  };

  const handleStop = () => {
    store.stopAgent();
    setIsRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow">
              <Bot className="w-4 h-4 text-zinc-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">AgentPilot Command</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
                  WebMCP v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Autonomous reasoning through typed tool execution</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Query Input Area */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 mb-2 block">
              What should AgentPilot do?
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask about project health, blockers, or schedule..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 pr-24 font-sans text-zinc-900"
              />
              <button
                disabled={isRunning}
                onClick={() => handleRunAnalysis()}
                className="absolute right-2 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Ask</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  disabled={isRunning}
                  onClick={() => handleRunAnalysis(action)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Interruption Controls when Agent is Running */}
          {isRunning && (
            <div className="p-3 rounded-xl bg-zinc-950 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-zinc-300">
                  {state.isAgentPaused ? 'Agent paused by user.' : 'Agent executing WebMCP tools...'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {state.isAgentPaused ? (
                  <button
                    onClick={handleResume}
                    className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1 text-emerald-300"
                  >
                    <Play className="w-3 h-3" /> Resume
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1 text-zinc-300"
                  >
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="px-2.5 py-1 rounded-md bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-medium flex items-center gap-1"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              </div>
            </div>
          )}

          {/* Step by Step Execution Trace (WebMCP Tool Trace) */}
          {steps.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
              <div className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>WebMCP Tool Trace</span>
                <span className="text-zinc-400">{steps.length} tools executed</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {steps.map((st, sIdx) => {
                  const isDone = st.status === 'done';
                  const isRun = st.status === 'running';

                  return (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-200/60 shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-zinc-800">
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        ) : isRun ? (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="font-semibold text-zinc-900">{st.toolName}</span>
                      </div>

                      <span className="text-[10px] text-zinc-500 truncate max-w-[280px]">
                        {st.resultSummary || (isRun ? 'Invoking schema...' : 'Complete')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Final Output & Findings */}
          {finalAnswer && (
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-zinc-900">AgentPilot Assessment</span>
                {isAtRisk && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                    LAUNCH AT RISK
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line font-sans">
                {finalAnswer}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenApprovalModal?.();
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors"
                >
                  Show Recommendation
                </button>

                <button
                  onClick={handleFixSchedule}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fix Automatically</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
