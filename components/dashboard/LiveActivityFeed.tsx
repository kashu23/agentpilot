'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Bot, 
  User, 
  CheckCircle2, 
  X, 
  Edit3,
  Terminal
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActivityEvent, ApprovalProposal } from '@/types';

interface FeedCard {
  id: string;
  agentName: string;
  actionsCount: number;
  status: 'SUCCESS' | 'WAITING FOR APPROVAL' | 'IN PROGRESS';
  time: string;
  steps: string[];
  hasApproval?: boolean;
  proposal?: {
    actionTitle: string;
    from: string;
    to: string;
    rationale: string;
  };
}

export const LiveActivityFeed: React.FC = () => {
  const [state, store] = useAppStore();
  const [expandedCardId, setExpandedCardId] = useState<string | null>('feed-2'); // Expand approval card by default

  const handleApprove = () => {
    if (state.pendingApproval) {
      store.resolveApproval(state.pendingApproval.id, 'approved');
    }
  };

  const handleReject = () => {
    if (state.pendingApproval) {
      store.resolveApproval(state.pendingApproval.id, 'rejected');
    }
  };

  // Structured high-level feed cards matching prompt specification
  const cards: FeedCard[] = [
    {
      id: 'feed-1',
      agentName: 'Lead Launch Agent',
      actionsCount: 5,
      status: 'SUCCESS',
      time: '08:42 PM',
      steps: [
        'Read project state & target launch milestones',
        'Analyzed 10 active tasks across 3 swimlanes',
        'Calculated team velocity & sprint burndown',
        'Verified critical path float & resource allocations',
        'Updated project health diagnostic matrix'
      ]
    },
    {
      id: 'feed-2',
      agentName: 'Project Planner',
      actionsCount: 12,
      status: state.pendingApproval ? 'WAITING FOR APPROVAL' : 'SUCCESS',
      time: '08:38 PM',
      steps: [
        'Agent started execution',
        'Read project state & milestones',
        'Analyzed 10 tasks across product and marketing',
        'Found 3 upstream dependencies on critical path',
        'Identified zero-day collision on Friday cutover',
        'Generated optimized schedule with buffer insertion'
      ],
      hasApproval: !!state.pendingApproval,
      proposal: state.pendingApproval ? {
        actionTitle: 'Move "Production Deployment" & "QA Testing"',
        from: 'Friday (Sept 4) → Wednesday (Sept 2)',
        to: 'Staged Deployment on Thursday (Sept 3)',
        rationale: 'Eliminates zero-day crunch and introduces 24h stability buffer.'
      } : undefined
    },
    {
      id: 'feed-3',
      agentName: 'Dependency Analyzer',
      actionsCount: 7,
      status: 'SUCCESS',
      time: '08:31 PM',
      steps: [
        'Scanned graph topology for cyclic deadlocks',
        'Evaluated topological sort order across 10 nodes',
        'Verified Payment Integration prerequisite chain',
        'Audited finish-to-start timing relationships',
        'Recorded graph validation report in WebMCP audit log'
      ]
    }
  ];

  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Live Activity Feed</h2>
          <p className="text-xs text-zinc-500">
            Real-time multi-agent execution streams, WebMCP tool logs, and human-in-the-loop approvals.
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
          {cards.length} Active Feeds
        </span>
      </div>

      <div className="space-y-3">
        {cards.map(card => {
          const isExpanded = expandedCardId === card.id;
          const isWaiting = card.status === 'WAITING FOR APPROVAL';

          return (
            <div
              key={card.id}
              className={`rounded-xl border transition-all ${
                isWaiting
                  ? 'border-amber-300 bg-amber-50/20 shadow-sm'
                  : 'border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50'
              }`}
            >
              {/* Card Header Bar */}
              <div
                onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isWaiting
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{card.agentName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500 font-mono">
                        {card.actionsCount} WebMCP actions
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {card.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full ${
                      isWaiting
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {card.status}
                  </span>
                  <button className="text-zinc-400 hover:text-zinc-700">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Card View */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-200/60 text-xs">
                  <div className="text-[11px] font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                    Execution Trace:
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {card.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-2 text-zinc-700 font-mono text-[12px]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Consequential Proposal Box */}
                  {card.hasApproval && card.proposal && (
                    <div className="mt-4 p-4 rounded-xl bg-white border border-amber-300 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Approval Required</span>
                      </div>
                      <p className="text-xs text-zinc-600 mb-3">
                        The agent has formulated a concrete plan mutation through WebMCP:
                      </p>

                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 mb-3 font-mono text-xs">
                        <div className="font-semibold text-zinc-900 mb-1">
                          Proposed Action:
                        </div>
                        <div className="text-zinc-800 font-bold flex items-center gap-2">
                          <span>Move QA Testing:</span>
                          <span className="text-zinc-500 line-through">Friday</span>
                          <ArrowRight className="w-3 h-3 text-amber-600 inline" />
                          <span className="text-emerald-700 font-bold">Wednesday</span>
                        </div>
                        <div className="text-zinc-800 font-bold flex items-center gap-2 mt-1">
                          <span>Move Production Deployment:</span>
                          <span className="text-zinc-500 line-through">Friday</span>
                          <ArrowRight className="w-3 h-3 text-amber-600 inline" />
                          <span className="text-emerald-700 font-bold">Thursday</span>
                        </div>
                        <div className="text-zinc-800 font-bold flex items-center gap-2 mt-1">
                          <span>Create Task:</span>
                          <span className="text-emerald-700 font-bold">Regression Testing & Canary Verification</span>
                        </div>
                      </div>

                      {/* Approval Action Buttons */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleReject}
                          className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium text-xs transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={handleApprove}
                          className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approve & Execute</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
