import { NextRequest, NextResponse } from 'next/server';
import { toolCatalog, executeAgentTool, type ToolBridge, type ProjectState } from '@/lib/webmcp';

const mockState: ProjectState = {
  id: 'launch-nova',
  name: 'Launch Nova',
  deadline: '2026-09-04',
  mode: 'Collaborative',
  tasks: [
    { id: 'brief', title: 'Product brief', status: 'done', priority: 'high', owner: 'Maya Chen', deadline: '2026-09-01', dependencies: [], category: 'product', x: 5, y: 8 },
    { id: 'api-ready', title: 'API ready', status: 'in_progress', priority: 'critical', owner: 'Devon Blake', deadline: '2026-09-02', dependencies: ['brief'], category: 'product', x: 30, y: 8 },
    { id: 'payments', title: 'Payment integration', status: 'blocked', priority: 'critical', owner: 'Devon Blake', deadline: '2026-09-02', dependencies: ['api-ready'], category: 'product', x: 57, y: 8 },
    { id: 'testing', title: 'Production testing', status: 'blocked', priority: 'high', owner: 'QA Agent', deadline: '2026-09-04', dependencies: ['api-ready', 'payments'], category: 'operations', x: 30, y: 39 },
    { id: 'deployment', title: 'Deployment', status: 'todo', priority: 'critical', owner: 'Maya Chen', deadline: '2026-09-04', dependencies: ['testing'], category: 'operations', x: 57, y: 39 },
    { id: 'landing', title: 'Landing page', status: 'in_progress', priority: 'high', owner: 'Ria Singh', deadline: '2026-09-02', dependencies: ['brief'], category: 'marketing', x: 5, y: 70 },
    { id: 'social', title: 'Social campaign', status: 'todo', priority: 'medium', owner: 'Launch Planner', deadline: '2026-09-03', dependencies: ['landing'], category: 'marketing', x: 30, y: 70 },
    { id: 'docs', title: 'Documentation', status: 'todo', priority: 'high', owner: 'Research Agent', deadline: '2026-09-03', dependencies: ['api-ready'], category: 'operations', x: 57, y: 70 },
    { id: 'launch', title: 'Product launch', status: 'todo', priority: 'critical', owner: 'Maya Chen', deadline: '2026-09-04', dependencies: ['deployment', 'social', 'docs'], category: 'operations', x: 79, y: 39 },
  ],
  milestones: [
    { id: 'm-code', title: 'Feature Freeze', deadline: '2026-09-02' },
    { id: 'm-qa', title: 'QA Verification', deadline: '2026-09-03' },
    { id: 'm-prod', title: 'Global Launch', deadline: '2026-09-04' },
  ],
};

const mockBridge: ToolBridge = {
  getState: () => mockState,
  canMutate: () => true,
  updateTasks: (updater) => { mockState.tasks = updater(mockState.tasks); },
  addMilestone: (milestone) => { mockState.milestones.push(milestone); },
  addProposal: () => {},
  record: () => {},
};

export async function GET() {
  return NextResponse.json({
    status: 'connected',
    protocol: 'WebMCP',
    version: '1.0',
    toolsCount: toolCatalog.length,
    tools: toolCatalog,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { toolName?: string; input?: Record<string, unknown> };
    const toolName = body?.toolName as (typeof toolCatalog)[number]['name'] | undefined;
    const input = body?.input || {};

    if (!toolName) {
      return NextResponse.json({ ok: false, error: 'toolName is required' }, { status: 400 });
    }

    const exists = toolCatalog.find((t) => t.name === toolName);
    if (!exists) {
      return NextResponse.json({ ok: false, error: `Tool "${toolName}" not found.` }, { status: 404 });
    }

    const result = await executeAgentTool(toolName, input, mockBridge);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Execution error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
