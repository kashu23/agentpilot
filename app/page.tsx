'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from '@/components/ui/Navigation';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { WorkspaceView } from '@/components/workspace/WorkspaceView';
import { AgentsView } from '@/components/agents/AgentsView';
import { ToolsView } from '@/components/tools/ToolsView';
import { ActivityView } from '@/components/activity/ActivityView';
import { IntegrationsView } from '@/components/integrations/IntegrationsView';
import { AskAgentModal } from '@/components/workspace/AskAgentModal';
import { ApprovalModal } from '@/components/workspace/ApprovalModal';
import { DemoFlowRunner } from '@/components/workspace/DemoFlowRunner';
import { useAppStore } from '@/lib/store';
import { initWebMCPOnDocument } from '@/webmcp/registry';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>('workspace');
  const [isAskAgentOpen, setIsAskAgentOpen] = useState<boolean>(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);
  const [showDemoTour, setShowDemoTour] = useState<boolean>(true); // default visible for judge ease
  const [state] = useAppStore();

  useEffect(() => {
    // Ensure WebMCP is initialized on document.modelContext on client mount
    initWebMCPOnDocument();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F1] flex flex-col font-sans">
      {/* Floating Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAskAgent={() => setIsAskAgentOpen(true)}
        onToggleDemoTour={() => setShowDemoTour(!showDemoTour)}
      />

      {/* Main Container Shell */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-12">
        {/* Judge 14-Step Flow Dock (Toggleable) */}
        {showDemoTour && (
          <DemoFlowRunner
            onOpenAskAgent={() => setIsAskAgentOpen(true)}
            onOpenApprovalModal={() => setIsApprovalOpen(true)}
            onSelectTab={setCurrentTab}
          />
        )}

        {/* Tab Content Router */}
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenAskAgent={() => setIsAskAgentOpen(true)}
            onOpenWorkspace={() => setCurrentTab('workspace')}
            onToggleDemoTour={() => setShowDemoTour(true)}
          />
        )}

        {currentTab === 'workspace' && (
          <WorkspaceView
            onOpenAskAgent={() => setIsAskAgentOpen(true)}
            onOpenApprovalModal={() => setIsApprovalOpen(true)}
            onOpenActivity={() => setCurrentTab('activity')}
          />
        )}

        {currentTab === 'agents' && (
          <AgentsView onOpenAskAgent={() => setIsAskAgentOpen(true)} />
        )}

        {currentTab === 'tools' && <ToolsView />}

        {currentTab === 'activity' && <ActivityView />}

        {currentTab === 'integrations' && <IntegrationsView />}
      </main>

      {/* Command & Approval Modals */}
      <AskAgentModal
        isOpen={isAskAgentOpen}
        onClose={() => setIsAskAgentOpen(false)}
        onOpenApprovalModal={() => setIsApprovalOpen(true)}
      />

      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-zinc-200/60 text-center text-xs text-zinc-400 font-mono">
        AGENTPILOT • WebMCP Challenge Submission • Document Model Context Protocol v1.0
      </footer>
    </div>
  );
}
