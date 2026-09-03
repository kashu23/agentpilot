'use client';

import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Check, 
  ChevronRight, 
  Bot, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AgentPilotEngine } from '@/lib/agent-engine';

interface DemoFlowRunnerProps {
  onOpenAskAgent: () => void;
  onOpenApprovalModal: () => void;
  onSelectTab: (tab: any) => void;
}

const DEMO_STEPS = [
  { step: 1, title: 'Open AgentPilot', desc: 'Initialize command center with WebMCP tools registered' },
  { step: 2, title: 'Open Demo Project', desc: 'Active project: Launch Nova (Target: Sept 4)' },
  { step: 3, title: 'Ask Agent', desc: 'User asks: "Can we launch Friday?"' },
  { step: 4, title: 'Tool Execution', desc: 'get_project_state, get_tasks, analyze_dependencies, find_blockers, estimate_timeline' },
  { step: 5, title: 'Agent Assessment', desc: 'Reports: "The launch is at risk" due to zero-day QA collision' },
  { step: 6, title: 'User Requests Fix', desc: 'User triggers: "Fix the schedule"' },
  { step: 7, title: 'Agent Proposal', desc: 'Agent generates structured multi-task rescheduling proposal' },
  { step: 8, title: 'UI Shows Proposal', desc: 'Presents consequential action gateway with Approve / Reject / Modify' },
  { step: 9, title: 'Human Approves', desc: 'User commits the proposal to application state' },
  { step: 10, title: 'WebMCP Execution', desc: 'Tools batch execute updates and emit audit telemetry' },
  { step: 11, title: 'Canvas Updates', desc: 'Nodes visibly transition and dependency lines stabilize' },
  { step: 12, title: 'Human Intervention', desc: 'User manually shifts Production Deployment: Thursday → Friday' },
  { step: 13, title: 'Agent Detection', desc: 'Autonomous conflict listener observes manual state change' },
  { step: 14, title: 'Agent Alerts Conflict', desc: '"Your manual change creates a dependency conflict. Recalculate?"' }
];

export const DemoFlowRunner: React.FC<DemoFlowRunnerProps> = ({
  onOpenAskAgent,
  onOpenApprovalModal,
  onSelectTab
}) => {
  const [state, store] = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutomating, setIsAutomating] = useState(false);

  const executeStep = async (stepNum: number) => {
    setCurrentStep(stepNum);

    switch (stepNum) {
      case 1:
        onSelectTab('dashboard');
        break;
      case 2:
        onSelectTab('workspace');
        break;
      case 3:
      case 4:
      case 5:
        onSelectTab('workspace');
        onOpenAskAgent();
        break;
      case 6:
      case 7:
      case 8:
        onSelectTab('workspace');
        onOpenApprovalModal();
        break;
      case 9:
      case 10:
      case 11:
        if (state.pendingApproval) {
          store.resolveApproval(state.pendingApproval.id, 'approved');
        }
        onSelectTab('workspace');
        break;
      case 12:
      case 13:
      case 14:
        // Move Production deployment to Friday (Sept 4) to trigger conflict!
        onSelectTab('workspace');
        store.updateTask('task-deploy', {
          deadline: '2026-09-04',
          updatedBy: 'human'
        });
        break;
      default:
        break;
    }
  };

  const handleNext = () => {
    if (currentStep < 14) {
      executeStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    store.resetToDemo();
    setCurrentStep(1);
    onSelectTab('workspace');
  };

  const handleRunFullDemo = async () => {
    setIsAutomating(true);
    for (let i = 1; i <= 14; i++) {
      await executeStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }
    setIsAutomating(false);
  };

  const activeStepObj = DEMO_STEPS[currentStep - 1];

  return (
    <div className="bg-zinc-950 text-white rounded-2xl p-4 border border-zinc-800 shadow-xl mb-6 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Step Indicator & Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-sm">
            {currentStep}/14
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider font-bold">
                WEBMCP CHALLENGE DEMO FLOW:
              </span>
              <span className="text-sm font-bold text-white">
                STEP {currentStep} — {activeStepObj.title}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{activeStepObj.desc}</p>
          </div>
        </div>

        {/* Step Progress Tracker Badges */}
        <div className="hidden xl:flex items-center gap-1 overflow-x-auto max-w-md">
          {DEMO_STEPS.map(s => {
            const isDone = s.step < currentStep;
            const isCurr = s.step === currentStep;
            return (
              <button
                key={s.step}
                onClick={() => executeStep(s.step)}
                title={`Step ${s.step}: ${s.title}`}
                className={`w-6 h-6 rounded-md font-mono text-[10px] flex items-center justify-center transition-all ${
                  isCurr
                    ? 'bg-emerald-400 text-zinc-950 font-bold scale-110 ring-2 ring-emerald-300'
                    : isDone
                    ? 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700'
                    : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : s.step}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Reset state to initial Launch Nova project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            disabled={isAutomating}
            onClick={handleRunFullDemo}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAutomating ? 'Auto Playing...' : 'Auto Run 1-14'}</span>
          </button>

          <button
            disabled={currentStep >= 14 || isAutomating}
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow disabled:opacity-50"
          >
            <span>Next Step</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
