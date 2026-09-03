'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Edit3, 
  Sparkles, 
  Layers,
  Save
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ApprovalProposal } from '@/types';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose
}) => {
  const [state, store] = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const proposal = state.pendingApproval;

  // Local editable copies when "Modify" is activated
  const [modifiedQaDate, setModifiedQaDate] = useState('2026-09-02');
  const [modifiedDeployDate, setModifiedDeployDate] = useState('2026-09-03');
  const [modifiedNewTaskTitle, setModifiedNewTaskTitle] = useState(
    'Regression Testing & Canary Verification'
  );

  if (!isOpen || !proposal) return null;

  const handleApprove = () => {
    if (isEditing) {
      // Build modified proposal
      const modifiedProposal: ApprovalProposal = {
        ...proposal,
        proposedChanges: {
          ...proposal.proposedChanges,
          moveTasks: [
            {
              taskId: 'task-qa',
              taskTitle: 'QA Testing',
              currentDeadline: '2026-09-04',
              proposedDeadline: modifiedQaDate,
              lane: 'product'
            },
            {
              taskId: 'task-deploy',
              taskTitle: 'Production Deployment',
              currentDeadline: '2026-09-04',
              proposedDeadline: modifiedDeployDate,
              lane: 'product'
            }
          ],
          createTasks: [
            {
              title: modifiedNewTaskTitle,
              lane: 'product',
              priority: 'high',
              deadline: modifiedDeployDate,
              dependsOn: ['task-qa']
            }
          ]
        }
      };
      store.resolveApproval(proposal.id, 'modified', modifiedProposal);
    } else {
      store.resolveApproval(proposal.id, 'approved');
    }
    onClose();
  };

  const handleReject = () => {
    store.resolveApproval(proposal.id, 'rejected');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  CONSEQUENTIAL ACTION GATEWAY
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mt-0.5">AGENT PROPOSAL</h3>
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
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-base font-extrabold text-zinc-900 font-sans">
              {proposal.title}
            </h4>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              {proposal.summary}
            </p>
          </div>

          {/* Impact Box */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1">
            <span className="font-semibold text-zinc-800 block">System Impact Assessment:</span>
            <p className="text-zinc-600 leading-relaxed">
              {proposal.impactExplanation}
            </p>
          </div>

          {/* Proposed Mutations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-500 uppercase">
                Proposed State Changes ({isEditing ? 'Editing Mode' : 'Read Only'})
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Cancel Edit' : 'Modify Proposal'}</span>
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* QA Shift */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Move QA Testing:</span>
                  <span className="text-[11px] text-zinc-500 line-through">Friday, Sept 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={modifiedQaDate}
                      onChange={e => setModifiedQaDate(e.target.value)}
                      className="px-2 py-1 rounded border border-zinc-300 text-xs font-bold text-emerald-700 bg-white"
                    />
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Wednesday, Sept 2
                    </span>
                  )}
                </div>
              </div>

              {/* Deployment Shift */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Move Production Deployment:</span>
                  <span className="text-[11px] text-zinc-500 line-through">Friday, Sept 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={modifiedDeployDate}
                      onChange={e => setModifiedDeployDate(e.target.value)}
                      className="px-2 py-1 rounded border border-zinc-300 text-xs font-bold text-emerald-700 bg-white"
                    />
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Thursday, Sept 3
                    </span>
                  )}
                </div>
              </div>

              {/* New Task Creation */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Create Buffer Task:</span>
                  <span className="text-[11px] text-zinc-500">Lane: Product Engineering</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={modifiedNewTaskTitle}
                      onChange={e => setModifiedNewTaskTitle(e.target.value)}
                      className="px-2 py-1 rounded border border-zinc-300 text-xs font-medium text-emerald-800 bg-white w-56"
                    />
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold truncate max-w-xs">
                      Regression Testing
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors"
          >
            Reject Proposal
          </button>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modify</span>
              </button>
            )}

            <button
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEditing ? 'Save & Approve' : 'Approve & Apply Plan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
