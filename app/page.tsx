'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Bot,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Command,
  Gauge,
  GitBranch,
  Info,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Menu,
  Network,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  UserRound,
  UsersRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  executeAgentTool,
  registerAgentPilotTools,
  toolCatalog,
  type PilotTask,
  type ProjectState,
  type Proposal,
  type ToolActivity,
  type ToolBridge,
  type ToolName,
} from '@/lib/webmcp';

type Page = 'Dashboard' | 'Workspace' | 'Agents' | 'Tools' | 'Activity' | 'Integrations';
type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'complete';

const navigation: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Workspace', icon: Network },
  { label: 'Agents', icon: Bot },
  { label: 'Tools', icon: Wrench },
  { label: 'Activity', icon: Activity },
  { label: 'Integrations', icon: GitBranch },
];

const initialTasks: PilotTask[] = [
  { id: 'brief', title: 'Product brief', status: 'done', priority: 'high', owner: 'Maya Chen', deadline: '2026-09-01', dependencies: [], category: 'product', x: 5, y: 8 },
  { id: 'api-ready', title: 'API ready', status: 'in_progress', priority: 'critical', owner: 'Devon Blake', deadline: '2026-09-02', dependencies: ['brief'], category: 'product', x: 30, y: 8 },
  { id: 'payments', title: 'Payment integration', status: 'blocked', priority: 'critical', owner: 'Devon Blake', deadline: '2026-09-02', dependencies: ['api-ready'], category: 'product', x: 57, y: 8 },
  { id: 'testing', title: 'Production testing', status: 'blocked', priority: 'high', owner: 'QA Agent', deadline: '2026-09-04', dependencies: ['api-ready', 'payments'], category: 'operations', x: 30, y: 39 },
  { id: 'deployment', title: 'Deployment', status: 'todo', priority: 'critical', owner: 'Maya Chen', deadline: '2026-09-04', dependencies: ['testing'], category: 'operations', x: 57, y: 39 },
  { id: 'landing', title: 'Landing page', status: 'in_progress', priority: 'high', owner: 'Ria Singh', deadline: '2026-09-02', dependencies: ['brief'], category: 'marketing', x: 5, y: 70 },
  { id: 'social', title: 'Social campaign', status: 'todo', priority: 'medium', owner: 'Launch Planner', deadline: '2026-09-03', dependencies: ['landing'], category: 'marketing', x: 30, y: 70 },
  { id: 'docs', title: 'Documentation', status: 'todo', priority: 'high', owner: 'Research Agent', deadline: '2026-09-03', dependencies: ['api-ready'], category: 'operations', x: 57, y: 70 },
  { id: 'launch', title: 'Product launch', status: 'todo', priority: 'critical', owner: 'Maya Chen', deadline: '2026-09-04', dependencies: ['deployment', 'social', 'docs'], category: 'operations', x: 79, y: 39 },
];

const seedActivities: ToolActivity[] = [
  { id: 'activity-1', tool: 'analyze_dependencies', input: { includeCompleted: true }, result: 'Analyzed 17 tasks and found 3 delivery risks.', status: 'success', time: '08:42 PM' },
  { id: 'activity-2', tool: 'update_task', input: { taskId: 'testing', deadline: '2026-09-02' }, result: 'A human approval request was created.', status: 'approval', time: '08:38 PM' },
  { id: 'activity-3', tool: 'estimate_timeline', input: { confidence: 'likely' }, result: 'Estimated completion is 5 working days.', status: 'success', time: '08:31 PM' },
];

const seedProposal: Proposal = {
  id: 'proposal-production-testing',
  tool: 'update_task',
  summary: "Move 'Production testing' from Sep 4 to Sep 2.",
  rationale: 'Testing gates deployment and documentation. Moving it forward protects the Friday launch.',
  payload: { taskId: 'testing', deadline: '2026-09-02' },
  status: 'pending',
};

const chartData = [
  { time: '00:00', agents: 8, humans: 4, completed: 5 },
  { time: '04:00', agents: 13, humans: 3, completed: 9 },
  { time: '08:00', agents: 21, humans: 7, completed: 16 },
  { time: '12:00', agents: 18, humans: 9, completed: 15 },
  { time: '16:00', agents: 29, humans: 6, completed: 22 },
  { time: '20:00', agents: 25, humans: 8, completed: 21 },
  { time: '24:00', agents: 34, humans: 5, completed: 28 },
];

const chartConfig = {
  agents: { label: 'Agent executions', color: '#202521' },
  humans: { label: 'Human interventions', color: '#dc8c5c' },
  completed: { label: 'Completed actions', color: '#92b84b' },
} satisfies ChartConfig;

const quickActions = ['Analyze project', 'Find blockers', 'Generate plan', 'Prioritize tasks', 'Estimate timeline', 'Optimize schedule'];

const metricCards = [
  { label: 'ACTIVE PROJECTS', value: '04', note: 'Across two workspaces', trend: '+1 this week', icon: Box, line: '4,12 18,10 31,13 46,5 60,7 74,3' },
  { label: 'AGENT TASKS', value: '27', note: '11 completed today', trend: '+24.11%', icon: Bot, line: '4,14 18,12 31,14 46,9 60,10 74,3' },
  { label: 'PENDING APPROVALS', value: '03', note: '1 deadline change', trend: 'Needs review', icon: ShieldCheck, line: '4,12 18,12 31,8 46,9 60,4 74,4' },
  { label: 'AUTOMATION SUCCESS', value: '98.4%', note: 'Last 30 days', trend: '+2.4%', icon: Zap, line: '4,13 18,9 31,10 46,6 60,7 74,2' },
];

const agentRoster = [
  { name: 'Launch Planner', role: 'Orchestrates milestones and critical path', status: 'Working', tasks: 12, tone: 'lime', icon: Sparkles },
  { name: 'Dependency Analyzer', role: 'Detects blockers, cycles and risk propagation', status: 'Ready', tasks: 7, tone: 'gray', icon: Network },
  { name: 'Research Agent', role: 'Synthesizes launch research and documentation', status: 'Ready', tasks: 5, tone: 'blue', icon: Search },
  { name: 'Schedule Optimizer', role: 'Balances owners, deadlines and workload', status: 'Paused', tasks: 3, tone: 'orange', icon: CalendarDays },
];

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function StatusPill({ status }: { status: ToolActivity['status'] }) {
  const labels = { success: 'Success', approval: 'Waiting for approval', error: 'Failed' };
  return <span className={`status-pill status-${status}`}><span />{labels[status]}</span>;
}

function ToolTrace({ activity, expanded, onToggle }: { activity: ToolActivity; expanded: boolean; onToggle: () => void }) {
  const agent = activity.tool === 'estimate_timeline' ? 'Schedule Optimizer' : activity.tool === 'analyze_dependencies' ? 'Dependency Analyzer' : 'Launch Planner';
  return (
    <article className={`activity-row ${expanded ? 'activity-expanded' : ''}`}>
      <button onClick={onToggle} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left sm:gap-4 sm:p-5">
        <span className="grid size-9 place-items-center rounded-xl bg-[#edf0e9] text-[#4e5b51]"><Bot className="size-4" /></span>
        <span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{agent}</span><span className="mt-1 block text-[11px] text-[#818982]">WebMCP · {activity.tool}</span></span>
        <span className="flex items-center gap-3"><StatusPill status={activity.status} /><span className="hidden text-[11px] tabular-nums text-[#89918b] sm:inline">{activity.time}</span><ChevronDown className={`size-4 text-[#808980] transition ${expanded ? 'rotate-180' : ''}`} /></span>
      </button>
      {expanded && (
        <div className="border-t border-black/6 px-5 pb-5 pt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#f4f6f1] p-4"><p className="eyebrow">WEBMCP ACTION</p><p className="mt-2 font-mono text-xs font-semibold text-[#334039]">{activity.tool}</p><p className="mt-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8a928c]">Input</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-5 text-[#626c65]">{JSON.stringify(activity.input, null, 2)}</pre></div>
            <div className="rounded-2xl border border-[#a3c95e]/25 bg-[#f7faef] p-4"><p className="eyebrow text-[#6e8d36]">RESULT</p><div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#4f5a52]"><CircleCheck className="mt-0.5 size-4 shrink-0 text-[#7da43b]" />{activity.result}</div></div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [project, setProject] = useState<ProjectState>({ id: 'project-launch', name: 'SaaS Product Launch', deadline: '2026-09-04', mode: 'Collaborative', tasks: initialTasks, milestones: [{ id: 'launch-day', title: 'Launch day', deadline: '2026-09-04' }] });
  const [activities, setActivities] = useState<ToolActivity[]>(seedActivities);
  const [proposals, setProposals] = useState<Proposal[]>([seedProposal]);
  const [expandedActivity, setExpandedActivity] = useState('activity-1');
  const [askOpen, setAskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('Analyze my launch plan and tell me what is blocking the deadline.');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentTrace, setAgentTrace] = useState<ToolName[]>([]);
  const [agentAnswer, setAgentAnswer] = useState('');
  const [webmcpStatus, setWebmcpStatus] = useState<'checking' | 'active' | 'unavailable' | 'error'>('checking');
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [dragging, setDragging] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Judge Review');
  const [feedbackRating, setFeedbackRating] = useState('Mind-blowing 🚀');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const projectRef = useRef(project);
  const agentStatusRef = useRef<AgentStatus>('idle');
  const runRef = useRef(0);

  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { agentStatusRef.current = agentStatus; }, [agentStatus]);

  const bridge = useMemo<ToolBridge>(() => ({
    getState: () => projectRef.current,
    canMutate: () => projectRef.current.mode !== 'Human',
    updateTasks: (updater) => setProject((current) => ({ ...current, tasks: updater(current.tasks) })),
    addMilestone: (milestone) => setProject((current) => ({ ...current, milestones: [...current.milestones, milestone] })),
    addProposal: (proposal) => setProposals((current) => [proposal, ...current]),
    record: (activity) => setActivities((current) => [activity, ...current].slice(0, 30)),
  }), []);

  useEffect(() => {
    let disposed = false;
    let registration: { supported: boolean; dispose: () => void } | undefined;
    registerAgentPilotTools(bridge).then((value) => {
      if (disposed) value.dispose();
      else { registration = value; setWebmcpStatus(value.supported ? 'active' : 'unavailable'); }
    }).catch(() => { if (!disposed) setWebmcpStatus('error'); });
    return () => { disposed = true; registration?.dispose(); };
  }, [bridge]);

  const setMode = (mode: ProjectState['mode']) => setProject((current) => ({ ...current, mode }));

  const runAnalysis = async () => {
    const run = ++runRef.current;
    setAskOpen(true);
    setAgentStatus('running');
    agentStatusRef.current = 'running';
    setAgentTrace([]);
    setAgentAnswer('');
    const steps: { name: ToolName; input: Record<string, unknown> }[] = [
      { name: 'get_project_state', input: {} },
      { name: 'get_tasks', input: {} },
      { name: 'analyze_dependencies', input: { includeCompleted: true } },
      { name: 'find_blockers', input: { deadline: projectRef.current.deadline } },
    ];
    for (const step of steps) {
      const currentStatus = () => agentStatusRef.current;
      while (currentStatus() === 'paused' && runRef.current === run) await sleep(120);
      if (runRef.current !== run || currentStatus() === 'stopped') return;
      try { await executeAgentTool(step.name, step.input, bridge); setAgentTrace((current) => [...current, step.name]); } catch { setAgentStatus('stopped'); return; }
      await sleep(360);
    }
    if (runRef.current === run) {
      setAgentAnswer('I found 3 blockers. Payment integration and production testing are on the critical path; documentation is also waiting on the API. Your Friday launch is at risk unless testing moves forward by two days.');
      setAgentStatus('complete');
      agentStatusRef.current = 'complete';
    }
  };

  const pauseAgent = () => {
    const next = agentStatusRef.current === 'paused' ? 'running' : 'paused';
    agentStatusRef.current = next;
    setAgentStatus(next);
  };

  const stopAgent = () => {
    runRef.current += 1;
    agentStatusRef.current = 'stopped';
    setAgentStatus('stopped');
    setAgentAnswer('Agent paused by user. No further tools will run.');
  };

  const approveProposal = (proposal: Proposal) => {
    const payload = proposal.payload;
    if (proposal.tool === 'update_task' && typeof payload.taskId === 'string') {
      setProject((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === payload.taskId ? { ...task, ...(typeof payload.deadline === 'string' && { deadline: payload.deadline }), ...(typeof payload.title === 'string' && { title: payload.title }), ...(typeof payload.status === 'string' && { status: payload.status as PilotTask['status'] }), ...(typeof payload.priority === 'string' && { priority: payload.priority as PilotTask['priority'] }) } : task) }));
    }
    if (proposal.tool === 'delete_task' && typeof payload.taskId === 'string') setProject((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== payload.taskId) }));
    if (proposal.tool === 'create_milestone' && typeof payload.title === 'string' && typeof payload.deadline === 'string') bridge.addMilestone({ id: `milestone-${Date.now()}`, title: payload.title, deadline: payload.deadline });
    if (proposal.tool === 'disconnect_tasks' && typeof payload.toTaskId === 'string' && typeof payload.fromTaskId === 'string') setProject((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === payload.toTaskId ? { ...task, dependencies: task.dependencies.filter((id) => id !== payload.fromTaskId) } : task) }));
    setProposals((current) => current.map((item) => item.id === proposal.id ? { ...item, status: 'approved' } : item));
    bridge.record({ id: `event-${Date.now()}`, tool: proposal.tool, input: proposal.payload, result: 'Approved by human and applied to the shared workspace.', status: 'success', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  };

  const rejectProposal = (proposal: Proposal) => {
    setProposals((current) => current.map((item) => item.id === proposal.id ? { ...item, status: 'rejected' } : item));
    bridge.record({ id: `event-${Date.now()}`, tool: proposal.tool, input: proposal.payload, result: 'Rejected by human. Workspace state was not changed.', status: 'success', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  };

  const submitFeedback = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackMessage.trim()) return;
    bridge.record({
      id: `feedback-${Date.now()}`,
      tool: 'suggest_next_action',
      input: { from: feedbackName || 'Anonymous Reviewer', email: feedbackEmail, category: feedbackCategory, rating: feedbackRating },
      result: `Feedback logged [${feedbackRating}] from ${feedbackName || 'Reviewer'}: "${feedbackMessage.trim().slice(0, 80)}"`,
      status: 'success',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setFeedbackSubmitted(true);
  };

  const createTask = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    try { await executeAgentTool('create_task', { title: newTitle.trim(), priority: newPriority, deadline: project.deadline }, bridge); setNewTitle(''); setAddOpen(false); } catch { /* visible in activity */ }
  };

  const pendingProposal = proposals.find((proposal) => proposal.status === 'pending');
  const blockers = project.tasks.filter((task) => task.status === 'blocked');

  return (
    <main className="min-h-screen bg-[var(--canvas)] p-2.5 text-[var(--ink)] md:p-5">
      <section className="relative mx-auto min-h-[calc(100vh-20px)] max-w-[1580px] overflow-hidden rounded-[26px] border border-black/8 bg-[var(--shell)] shadow-[0_30px_90px_rgba(35,48,41,.12)] md:min-h-[calc(100vh-40px)] md:rounded-[32px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center gap-4 border-b border-black/7 bg-white/76 px-4 backdrop-blur-xl md:px-7">
          <button onClick={() => setActivePage('Dashboard')} className="flex items-center gap-3" aria-label="AgentPilot home">
            <span className="grid size-9 place-items-center rounded-xl bg-[#151a17] text-[#d9ff73] shadow-sm"><Command className="size-4" /></span>
            <span className="hidden text-sm font-semibold tracking-[-.025em] sm:inline">AGENTPILOT</span>
          </button>
          <nav className="mx-auto hidden items-center gap-1 rounded-full border border-black/7 bg-white/80 p-1 xl:flex" aria-label="Primary navigation">
            {navigation.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => setActivePage(label)} className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-medium transition ${activePage === label ? 'bg-[#171b18] text-white shadow-sm' : 'text-[#68716b] hover:bg-black/5 hover:text-black'}`}><Icon className="size-3.5" />{label}</button>
            ))}
          </nav>
          <div className="relative ml-auto flex items-center gap-1.5">
            <button onClick={() => { setAskOpen(true); setAgentPrompt(''); }} className="nav-icon" aria-label="Search workspace"><Search /></button>
            <button onClick={() => setNotificationsOpen((value) => !value)} className="nav-icon relative" aria-label="Notifications"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#f18b5b] ring-2 ring-white" /></button>
            <button onClick={() => setActivePage('Integrations')} className="nav-icon hidden sm:grid" aria-label="Settings"><Settings /></button>
            <button onClick={() => { setAboutOpen(true); setFeedbackSubmitted(false); }} className="flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#252f27] shadow-sm transition hover:border-black/20 hover:bg-[#f6f8f4]" aria-label="About AgentPilot"><Info className="size-3.5 text-[#7ea83c]" /><span className="hidden md:inline">About</span></button>
            <button className="ml-1 flex size-9 items-center justify-center rounded-full bg-[#c5a693] text-[10px] font-semibold text-white ring-2 ring-white" aria-label="User menu">KS</button>
            <button onClick={() => setMobileNav((value) => !value)} className="nav-icon xl:hidden" aria-label="Open navigation"><Menu /></button>
            {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[290px] rounded-2xl border border-black/8 bg-white p-3 shadow-[0_24px_60px_rgba(20,27,22,.18)]"><div className="flex items-center justify-between px-2 py-1"><p className="text-xs font-semibold">Notifications</p><button onClick={() => setNotificationsOpen(false)}><X className="size-3.5 text-[#7c857e]" /></button></div><div className="mt-2 rounded-xl bg-[#f4f6f1] p-3"><p className="text-[11px] font-semibold">Approval needed</p><p className="mt-1 text-[10px] leading-4 text-[#747e76]">Launch Planner wants to move production testing.</p></div></div>}
          </div>
        </header>

        {mobileNav && (
          <nav className="sticky top-[70px] z-20 flex gap-1 overflow-x-auto border-b border-black/7 bg-white/90 p-2 backdrop-blur xl:hidden">
            {navigation.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => { setActivePage(label); setMobileNav(false); }} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold ${activePage === label ? 'bg-[#171b18] text-white' : 'text-[#68716b]'}`}><Icon className="size-3.5" />{label}</button>
            ))}
            <button onClick={() => { setAboutOpen(true); setMobileNav(false); setFeedbackSubmitted(false); }} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/8 bg-white px-3 py-2 text-[10px] font-semibold text-[#252f27]"><Info className="size-3.5 text-[#7ea83c]" />About</button>
          </nav>
        )}

        <div className="mx-auto max-w-[1480px] px-4 py-6 md:px-7 md:py-8">
          {activePage === 'Dashboard' && (
            <>
              <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div><div className="eyebrow mb-3 flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#8bb345]" /> System operational</div><h1 className="page-title">Agent Command Center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7871]">Monitor your projects, agents, decisions and automation from one shared workspace.</p></div>
                <div className="flex flex-wrap gap-2"><Button onClick={() => setAddOpen(true)} variant="outline" className="h-10 rounded-xl bg-white px-4"><Plus /> New project</Button><Button onClick={runAnalysis} className="h-10 rounded-xl bg-[#171b18] px-4 text-white hover:bg-black"><Sparkles /> Ask Agent</Button></div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map(({ label, value, note, trend, icon: Icon, line }, index) => <article key={label} className="metric-card"><div className="flex items-center justify-between"><p className="eyebrow">{label}</p><span className="grid size-8 place-items-center rounded-xl bg-[#f0f2ed] text-[#68726b]"><Icon className="size-3.5" /></span></div><div className="mt-8 flex items-end justify-between"><div><p className="text-[36px] font-semibold leading-none tracking-[-.055em]">{value}</p><p className="mt-2 text-[10px] text-[#828a84]">{note}</p></div><svg viewBox="0 0 78 18" className="h-7 w-24" aria-hidden="true"><polyline points={line} fill="none" stroke={index === 2 ? '#dc8c5c' : index === 1 ? '#191f1a' : '#96b950'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div><div className="mt-5 flex items-center justify-between border-t border-black/6 pt-3 text-[10px]"><span className={index === 2 ? 'text-[#b26a41]' : 'text-[#668735]'}>{trend}</span><ArrowDownRight className="size-3.5 text-[#a0a7a1]" /></div></article>)}
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.55fr)]">
                <article className="surface-card p-5 md:p-6"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">LIVE OPERATIONS</p><h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">Agent activity</h2></div><div className="flex flex-wrap gap-3 text-[10px] text-[#737c75]">{[['#202521', 'Agent executions'], ['#dc8c5c', 'Human interventions'], ['#92b84b', 'Completed actions']].map(([color, label]) => <span key={label} className="flex items-center gap-1.5"><span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}</div></div><ChartContainer config={chartConfig} className="h-[290px] w-full"><LineChart data={chartData} margin={{ left: -16, right: 12, top: 10, bottom: 0 }}><CartesianGrid vertical={false} stroke="#dfe3dc" strokeDasharray="3 5" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a928c' }} tickMargin={12} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9aa19c' }} /><ChartTooltip cursor={{ stroke: '#b9c0ba', strokeDasharray: '3 4' }} content={<ChartTooltipContent indicator="line" />} /><Line type="monotone" dataKey="agents" stroke="var(--color-agents)" strokeWidth={2.4} dot={false} activeDot={{ r: 4, fill: '#202521', stroke: '#fff', strokeWidth: 2 }} /><Line type="monotone" dataKey="humans" stroke="var(--color-humans)" strokeWidth={1.6} dot={false} /><Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={1.8} dot={false} /></LineChart></ChartContainer></article>
                <article className="agent-now-card"><div className="flex items-center justify-between"><div><p className="eyebrow text-white/40">NOW RUNNING</p><h2 className="mt-1 text-lg font-semibold">Launch Planner</h2></div><span className="live-pill"><span /> Active</span></div><div className="mt-8 grid grid-cols-[56px_1fr] items-center gap-4"><div className="relative grid size-14 place-items-center rounded-2xl bg-white/8 text-[#d8fa83]"><Bot className="size-6" /><span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#b9e65f] ring-4 ring-[#1b201d]" /></div><div><p className="text-sm font-medium">Validating launch plan</p><p className="mt-1 text-[11px] text-white/45">4 of 6 tools complete</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-[#c9ef6e]" /></div></div></div><div className="mt-8 space-y-2">{['get_project_state', 'analyze_dependencies', 'find_blockers'].map((tool) => <div key={tool} className="flex items-center gap-2 rounded-xl bg-white/[.04] px-3 py-2.5 font-mono text-[10px] text-white/62"><Check className="size-3 text-[#b7dc62]" />{tool}</div>)}</div><div className="mt-7 grid grid-cols-2 gap-2"><button onClick={pauseAgent} className="dark-action"><Pause /> Pause agent</button><button onClick={stopAgent} className="dark-action text-[#f0b18d]"><Square /> Stop</button></div></article>
              </section>

              <section className="surface-card mt-4 overflow-hidden"><div className="flex items-center justify-between p-5 md:p-6"><div><p className="eyebrow">AUDIT TRAIL</p><h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">Live activity feed</h2></div><button onClick={() => setActivePage('Activity')} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#69736b]">View all <ArrowRight className="size-3.5" /></button></div><div className="border-t border-black/6">{activities.slice(0, 3).map((activity) => <ToolTrace key={activity.id} activity={activity} expanded={expandedActivity === activity.id} onToggle={() => setExpandedActivity(expandedActivity === activity.id ? '' : activity.id)} />)}</div></section>
            </>
          )}

          {activePage === 'Workspace' && (
            <>
              <section className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="eyebrow mb-3 flex items-center gap-2"><Gauge className="size-3.5" /> Project workspace <span className="text-black/20">/</span> Launch</div><h1 className="page-title">SaaS Product Launch</h1><p className="mt-3 text-sm text-[#6e7771]">Deadline September 4 · {project.tasks.length} tasks · 3 agents connected</p></div><div className="flex flex-wrap gap-2"><Button onClick={runAnalysis} className="h-10 rounded-xl bg-[#171b18] px-4 text-white"><Bot /> Ask Agent</Button><Button onClick={() => setAddOpen(true)} variant="outline" className="h-10 rounded-xl bg-white px-4"><Plus /> Add task</Button><Button onClick={() => { setAgentPrompt('Generate a plan that protects the launch deadline.'); void runAnalysis(); }} variant="outline" className="h-10 rounded-xl bg-white px-4"><Sparkles /> Generate plan</Button><Button onClick={() => setActivePage('Activity')} variant="outline" className="h-10 rounded-xl bg-white px-4"><Activity /> View activity</Button></div></section>

              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-black/7 bg-white/66 p-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 px-2"><span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#79a63a] opacity-35" /><span className="relative inline-flex size-2.5 rounded-full bg-[#79a63a]" /></span><div><p className="text-xs font-semibold">Shared control is active</p><p className="text-[11px] text-[#7d867f]">The agent can propose. You decide.</p></div></div><div className="flex rounded-xl bg-[#edf0ea] p-1">{(['Human', 'Agent', 'Collaborative'] as const).map((mode) => <button key={mode} onClick={() => setMode(mode)} className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition sm:px-4 ${project.mode === mode ? 'bg-white text-black shadow-sm' : 'text-[#747c76] hover:text-black'}`}>{mode}</button>)}</div></div>

              <section className="collab-strip"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white"><UserRound className="size-4" /></span><div><p className="eyebrow">HUMAN CONTROL</p><p className="mt-1 text-xs font-semibold">You are editing</p></div></div><div className="hidden h-px flex-1 bg-gradient-to-r from-black/8 via-[#93b64e]/60 to-black/8 sm:block" /><div className="flex items-center gap-3 sm:text-right"><div><p className="eyebrow">AGENT CONTROL</p><p className="mt-1 text-xs font-semibold">Agent is observing</p></div><span className="grid size-9 place-items-center rounded-xl bg-[#1d231f] text-[#d5f480]"><Bot className="size-4" /></span></div></section>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section onPointerMove={(event) => {
                  if (!dragging) return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(82, ((event.clientX - bounds.left) / bounds.width) * 100 - 8));
                  const y = Math.max(0, Math.min(82, ((event.clientY - bounds.top - 72) / (bounds.height - 72)) * 100 - 8));
                  setProject((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === dragging ? { ...task, x, y } : task) }));
                }} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} className="graph-canvas">
                  <div className="graph-grid absolute inset-0 opacity-60" />
                  <div className="relative z-10 flex items-center justify-between border-b border-black/6 bg-white/55 px-5 py-4 backdrop-blur-sm"><div><h2 className="text-sm font-semibold">Launch dependency map</h2><p className="mt-0.5 text-[10px] text-[#7b847e]">Drag any task · changes sync to agent context</p></div><div className="flex items-center gap-2 text-[10px] font-medium text-[#6d766f]"><span className="size-2 rounded-full bg-[#9ad34a]" /> Live state</div></div>
                  <svg className="pointer-events-none absolute inset-x-0 bottom-0 top-[72px] h-[calc(100%-72px)] w-full" aria-label="Task dependencies">{project.tasks.flatMap((task) => task.dependencies.map((dependency) => { const source = project.tasks.find((item) => item.id === dependency); if (!source) return null; return <line key={`${source.id}-${task.id}`} x1={`${source.x + 8}%`} y1={`${source.y + 7}%`} x2={`${task.x + 8}%`} y2={`${task.y + 7}%`} className={source.status === 'blocked' ? 'graph-edge edge-risk' : 'graph-edge'} />; }))}</svg>
                  <div className="absolute inset-x-4 bottom-4 top-[86px]">{project.tasks.map((task) => <button key={task.id} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(task.id); }} aria-label={`${task.title} — ${task.status}, ${task.priority} priority, owner ${task.owner}`} style={{ left: `${task.x}%`, top: `${task.y}%` }} className={`task-node task-${task.status} ${task.id === 'launch' ? 'task-milestone' : ''}`}><span className="flex items-start justify-between gap-2"><span className="text-left text-[12px] font-semibold tracking-[-.01em]">{task.title}</span><span className={`task-dot dot-${task.status}`} /></span><span className="mt-4 flex items-center justify-between text-[9px] text-[#79827c]"><span>{task.priority} · {task.deadline.slice(5)}</span><span className="grid size-5 place-items-center rounded-full bg-[#edf0ea] text-[8px] font-bold">{task.owner.charAt(0)}</span></span></button>)}</div>
                  <div className="absolute bottom-4 left-4 rounded-full border border-black/7 bg-white/90 px-3 py-2 text-[9px] text-[#707a72] shadow-sm">{project.tasks.filter((task) => task.status === 'done').length}/{project.tasks.length} complete · {blockers.length} blockers</div>
                </section>

                <aside className="agent-panel"><div className="flex items-center justify-between"><div><p className="eyebrow text-white/40">AGENT ACTIVITY</p><h2 className="mt-1 text-base font-semibold">Launch Planner</h2></div><span className="live-pill"><span /> {agentStatus === 'running' ? 'Analyzing' : agentStatus === 'paused' ? 'Paused' : 'Watching'}</span></div><div className="mt-6 space-y-1.5">{['Read project state', `Analyzed ${project.tasks.length} tasks`, `Found ${blockers.length + 1} dependencies`].map((step) => <div key={step} className="agent-step"><CircleCheck className="size-3.5 text-[#b9e65f]" />{step}</div>)}<div className="agent-step border border-white/8 bg-white/[.06]"><span className="size-3.5 animate-spin rounded-full border border-white/20 border-t-[#c8f16a]" />Monitoring human changes</div></div>{pendingProposal ? <ProposalCard proposal={pendingProposal} modify={modifyId === pendingProposal.id} onApprove={() => approveProposal(pendingProposal)} onReject={() => rejectProposal(pendingProposal)} onModify={() => setModifyId(modifyId === pendingProposal.id ? null : pendingProposal.id)} onChangeDate={(deadline) => setProposals((current) => current.map((item) => item.id === pendingProposal.id ? { ...item, payload: { ...item.payload, deadline }, summary: `Move 'Production testing' to ${deadline}.` } : item))} /> : <div className="mt-6 rounded-2xl border border-white/8 bg-white/[.035] p-5 text-center"><CircleCheck className="mx-auto size-5 text-[#b9e65f]" /><p className="mt-2 text-xs font-semibold">No pending approvals</p><p className="mt-1 text-[10px] text-white/40">The shared plan is synchronized.</p></div>}<div className="mt-auto pt-5"><div className="mb-3 flex items-center justify-between text-[9px] text-white/35"><span>WEBMCP · {toolCatalog.length} TOOLS READY</span><span>{webmcpStatus === 'active' ? 'Connected' : 'Preview'}</span></div><div className="grid grid-cols-2 gap-2"><button onClick={pauseAgent} className="dark-action">{agentStatus === 'paused' ? <Play /> : <Pause />} {agentStatus === 'paused' ? 'Resume' : 'Pause agent'}</button><button onClick={stopAgent} className="dark-action text-[#f0b18d]"><Square /> Stop</button></div></div></aside>
              </div>
            </>
          )}

          {activePage === 'Agents' && <section><PageHeader eyebrow="AUTONOMOUS TEAM" title="Agents" description="Purpose-built collaborators that act through visible, structured tools." action={<Button onClick={runAnalysis} className="h-10 rounded-xl bg-[#171b18] px-4 text-white"><Plus /> Deploy agent</Button>} /><div className="grid gap-4 md:grid-cols-2">{agentRoster.map(({ name, role, status, tasks, tone, icon: Icon }) => <article key={name} className="surface-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(31,42,34,.08)] md:p-6"><div className="flex items-start justify-between"><span className={`agent-avatar tone-${tone}`}><Icon className="size-5" /></span><span className={`agent-status agent-${status.toLowerCase()}`}><span />{status}</span></div><h2 className="mt-7 text-xl font-semibold tracking-[-.035em]">{name}</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#747d76]">{role}</p><div className="mt-8 flex items-center justify-between border-t border-black/6 pt-4"><div className="flex items-center gap-4 text-[10px] text-[#78817a]"><span><strong className="text-[#252b27]">{tasks}</strong> tasks</span><span><strong className="text-[#252b27]">{Math.max(3, tasks - 2)}</strong> tools</span></div><button className="grid size-8 place-items-center rounded-full border border-black/8 bg-white transition group-hover:bg-[#171b18] group-hover:text-white"><ArrowRight className="size-3.5" /></button></div></article>)}</div></section>}

          {activePage === 'Tools' && <section><PageHeader eyebrow="STRUCTURED CAPABILITIES" title="WebMCP Tools" description="A discoverable contract between the workspace and any authorized browser agent." action={<span className={`webmcp-badge badge-${webmcpStatus}`}><span />{webmcpStatus === 'active' ? 'WebMCP registered' : webmcpStatus === 'checking' ? 'Checking support' : 'Preview browser'}</span>} /><div className="mb-4 grid gap-3 md:grid-cols-3"><div className="tool-stat"><p className="eyebrow">REGISTERED</p><p>{toolCatalog.length}</p></div><div className="tool-stat"><p className="eyebrow">READ-ONLY</p><p>{toolCatalog.filter((tool) => tool.readOnly).length}</p></div><div className="tool-stat"><p className="eyebrow">HUMAN GATED</p><p>04</p></div></div><div className="surface-card overflow-hidden">{toolCatalog.map((tool, index) => <div key={tool.name} className="tool-row"><div className="grid size-9 place-items-center rounded-xl bg-[#eef1eb] text-[#5b665e]"><Wrench className="size-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-[11px] font-semibold text-[#303a33]">{tool.name}</p>{tool.readOnly ? <span className="mini-tag"><LockKeyhole /> Read only</span> : <span className="mini-tag tag-write"><Zap /> Writes state</span>}</div><p className="mt-1 text-[10px] leading-4 text-[#7b847d]">{tool.description}</p></div><button onClick={async () => { const sample: Partial<Record<ToolName, Record<string, unknown>>> = { get_project_state: {}, get_tasks: {}, analyze_dependencies: { includeCompleted: true }, find_blockers: { deadline: project.deadline }, prioritize_tasks: { strategy: 'unblock' }, validate_plan: { targetDate: project.deadline }, estimate_timeline: { confidence: 'likely' }, suggest_next_action: { focus: 'risk' }, generate_plan: { goal: 'Protect the Friday product launch' } }; if (!tool.readOnly) { setAgentPrompt(`Use ${tool.name} safely in this project.`); setAskOpen(true); return; } await executeAgentTool(tool.name, sample[tool.name] ?? {}, bridge); setActivePage('Activity'); }} className="tool-run">{tool.readOnly ? 'Run' : 'Inspect'} <ChevronRight /></button>{index < toolCatalog.length - 1 && <span className="absolute inset-x-5 bottom-0 h-px bg-black/6" />}</div>)}</div></section>}

          {activePage === 'Activity' && <section><PageHeader eyebrow="IMMUTABLE AUDIT TRAIL" title="Activity" description="Every agent tool call, proposal, decision and resulting state change—explained." action={<Button onClick={() => setActivities(seedActivities)} variant="outline" className="h-10 rounded-xl bg-white px-4"><Activity /> Export log</Button>} /><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="surface-card overflow-hidden">{activities.map((activity) => <ToolTrace key={activity.id} activity={activity} expanded={expandedActivity === activity.id} onToggle={() => setExpandedActivity(expandedActivity === activity.id ? '' : activity.id)} />)}</div><aside className="space-y-4"><div className="surface-card p-5"><p className="eyebrow">TODAY</p><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-2xl font-semibold tracking-[-.04em]">{activities.length + 21}</p><p className="text-[10px] text-[#808981]">Tool calls</p></div><div><p className="text-2xl font-semibold tracking-[-.04em]">{proposals.filter((proposal) => proposal.status === 'pending').length}</p><p className="text-[10px] text-[#808981]">Pending</p></div></div></div><div className="surface-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#7c9f3d]" /><p className="text-xs font-semibold">Audit integrity</p></div><p className="mt-3 text-[10px] leading-5 text-[#78817a]">Inputs, outputs, approval decisions and timestamps remain visible to the human operator.</p></div></aside></div></section>}

          {activePage === 'Integrations' && <section><PageHeader eyebrow="CONTROL PLANE" title="Integrations" description="Connect the tools your agents need without giving them unbounded access." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[
            { name: 'WebMCP Browser Bridge', description: 'Exposes the active project as structured browser tools.', state: webmcpStatus === 'active' ? 'Connected' : 'Available', icon: Command },
            { name: 'GitHub', description: 'Sync milestones with issues and deployment checks.', state: 'Connected', icon: GitBranch },
            { name: 'Linear', description: 'Mirror prioritized work and ownership changes.', state: 'Connect', icon: Link2 },
            { name: 'Slack', description: 'Send approval requests to launch stakeholders.', state: 'Connect', icon: UsersRound },
            { name: 'Vercel', description: 'Read deployment status before launch decisions.', state: 'Connected', icon: Zap },
            { name: 'Notion', description: 'Keep launch documentation in shared context.', state: 'Connect', icon: Box },
          ].map(({ name, description, state, icon: Icon }) => <article key={name} className="surface-card p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#edf0ea]"><Icon className="size-4" /></span><button className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${state === 'Connected' ? 'bg-[#edf5df] text-[#648033]' : 'border border-black/8 bg-white text-[#6f7871]'}`}>{state}</button></div><h2 className="mt-7 text-sm font-semibold">{name}</h2><p className="mt-2 text-[10px] leading-5 text-[#78817a]">{description}</p></article>)}</div></section>}
        </div>
      </section>

      <Dialog open={askOpen} onOpenChange={setAskOpen}><DialogContent className="max-h-[88vh] max-w-[680px] overflow-y-auto rounded-[26px] border-black/8 bg-[#f8f9f5] p-0 shadow-[0_40px_100px_rgba(24,32,27,.25)]"><DialogHeader className="border-b border-black/6 px-6 pb-5 pt-6 text-left"><div className="mb-3 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-[#1b211d] text-[#d7f67e]"><Sparkles className="size-4" /></span><span className="eyebrow">AGENT COMMAND</span></div><DialogTitle className="text-2xl font-semibold tracking-[-.04em]">What should AgentPilot do?</DialogTitle><DialogDescription className="text-xs text-[#747e76]">The agent uses only the structured tools visible in this workspace.</DialogDescription></DialogHeader><div className="p-6"><Textarea value={agentPrompt} onChange={(event) => setAgentPrompt(event.target.value)} placeholder="Ask about the launch plan..." className="min-h-28 resize-none rounded-2xl border-black/8 bg-white p-4 text-sm shadow-none" /><div className="mt-3 flex flex-wrap gap-2">{quickActions.map((action) => <button key={action} onClick={() => setAgentPrompt(action === 'Find blockers' ? 'Find every blocker that threatens the launch date.' : `${action} for my current launch workspace.`)} className="rounded-full border border-black/7 bg-white px-3 py-2 text-[9px] font-semibold text-[#6b756d] transition hover:border-black/20 hover:text-black">{action}</button>)}</div>{agentStatus !== 'idle' && <div className="mt-6 rounded-[20px] bg-[#1b201d] p-5 text-white"><div className="flex items-center justify-between"><div><p className="eyebrow text-white/40">AGENTPILOT</p><p className="mt-1 text-sm font-semibold">{agentStatus === 'complete' ? 'Analysis complete' : agentStatus === 'stopped' ? 'Agent stopped' : agentStatus === 'paused' ? 'Agent paused by user' : 'Thinking through tools…'}</p></div>{agentStatus === 'running' && <span className="size-4 animate-spin rounded-full border border-white/20 border-t-[#c9ee6f]" />}</div><div className="mt-5 space-y-1.5">{agentTrace.map((tool) => <div key={tool} className="flex items-center gap-2 rounded-xl bg-white/[.04] px-3 py-2.5 font-mono text-[10px] text-white/70"><CircleCheck className="size-3.5 text-[#b9e65f]" />{tool}</div>)}</div>{agentAnswer && <div className="mt-5 border-t border-white/8 pt-5"><p className="text-xs leading-6 text-white/75">{agentAnswer}</p>{agentStatus === 'complete' && <div className="mt-4 flex gap-2"><button onClick={() => { setAskOpen(false); setActivePage('Workspace'); }} className="rounded-xl bg-[#d7ff79] px-3 py-2.5 text-[10px] font-semibold text-[#182016]">Show recommendation</button><button onClick={() => pendingProposal && approveProposal(pendingProposal)} className="rounded-xl border border-white/10 px-3 py-2.5 text-[10px] font-semibold text-white/70">Fix automatically</button></div>}</div>}<div className="mt-5 grid grid-cols-2 gap-2"><button onClick={pauseAgent} disabled={agentStatus === 'complete' || agentStatus === 'stopped'} className="dark-action disabled:opacity-40">{agentStatus === 'paused' ? <Play /> : <Pause />}{agentStatus === 'paused' ? 'Resume agent' : 'Pause agent'}</button><button onClick={stopAgent} disabled={agentStatus === 'complete' || agentStatus === 'stopped'} className="dark-action text-[#efad89] disabled:opacity-40"><Square /> Stop</button></div></div>}<Button onClick={runAnalysis} disabled={!agentPrompt.trim() || agentStatus === 'running'} className="mt-5 h-11 w-full rounded-xl bg-[#171b18] text-white"><Sparkles />{agentStatus === 'running' ? 'Agent is working…' : 'Run with WebMCP tools'}</Button></div></DialogContent></Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className="max-w-[460px] rounded-[24px] border-black/8 bg-[#f8f9f5] p-6"><DialogHeader className="text-left"><DialogTitle className="text-xl font-semibold tracking-[-.035em]">Add a task</DialogTitle><DialogDescription className="text-xs">Human edits update the same state agents inspect.</DialogDescription></DialogHeader><form onSubmit={createTask} className="mt-5 space-y-4"><label htmlFor="new-task-title" className="block"><span className="form-label">Task title</span><Input id="new-task-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={100} placeholder="e.g. Production readiness review" className="mt-2 h-11 rounded-xl border-black/8 bg-white" /></label><label htmlFor="new-task-priority" className="block"><span className="form-label">Priority</span><select id="new-task-priority" value={newPriority} onChange={(event) => setNewPriority(event.target.value as typeof newPriority)} className="mt-2 h-11 w-full rounded-xl border border-black/8 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#8bad4e]/30">{['low', 'medium', 'high', 'critical'].map((priority) => <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>)}</select></label><Button type="submit" className="h-11 w-full rounded-xl bg-[#171b18] text-white"><Plus /> Create task</Button></form></DialogContent></Dialog>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto rounded-[30px] border-black/8 bg-[#f8f9f5] p-0 shadow-[0_40px_120px_rgba(20,28,23,.28)]">
          <DialogHeader className="border-b border-white/10 bg-[#161c18] p-6 text-left text-white sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#222b25] text-[#d7f67e]">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[.15em] text-[#d7f67e] uppercase">WEBMCP CHALLENGE 2026</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/70">v0.2.0</span>
                  </div>
                  <DialogTitle className="mt-1 text-2xl font-semibold tracking-[-.03em] text-white">About AgentPilot</DialogTitle>
                </div>
              </div>
            </div>
            <DialogDescription className="mt-3 text-xs leading-5 text-white/70">
              AgentPilot is not a chatbot that controls a website. It is the first command center where humans and AI agents share the exact same structured workspace, collaborate on complex project graphs, and safely hand control back and forth via WebMCP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6 sm:p-7">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-black/6 bg-white p-3.5 text-center shadow-xs">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#79837c]">WebMCP Tools</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#1b221d]">15 Active</p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-white p-3.5 text-center shadow-xs">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#79837c]">Agent Fleet</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#1b221d]">4 Roles</p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-white p-3.5 text-center shadow-xs">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#79837c]">Safety Gate</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#6b8e34]">Human Review</p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-white p-3.5 text-center shadow-xs">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#79837c]">Multi-Language</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#1b221d]">TS + Python</p>
              </div>
            </div>

            {/* Core Architectural Pillars */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/6 bg-white p-4">
                <div className="grid size-7 place-items-center rounded-lg bg-[#f0f4ea] text-[#6d8a39]">
                  <Network className="size-4" />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-[#1c241e]">1. Shared State</h3>
                <p className="mt-1 text-[11px] leading-4 text-[#727c75]">
                  Humans drag, edit, and modify tasks on the exact same DAG canvas that agents query and evaluate.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-white p-4">
                <div className="grid size-7 place-items-center rounded-lg bg-[#f0f4ea] text-[#6d8a39]">
                  <ShieldCheck className="size-4" />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-[#1c241e]">2. Consequential Gates</h3>
                <p className="mt-1 text-[11px] leading-4 text-[#727c75]">
                  Destructive actions like task deletions and major schedule shifts generate proposals requiring explicit human sign-off.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-white p-4">
                <div className="grid size-7 place-items-center rounded-lg bg-[#f0f4ea] text-[#6d8a39]">
                  <Bot className="size-4" />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-[#1c241e]">3. Open Protocols</h3>
                <p className="mt-1 text-[11px] leading-4 text-[#727c75]">
                  Supports browser WebMCP (`modelContext`), standalone Python SDK, Claude Desktop MCP, and OpenAI tool-calling.
                </p>
              </div>
            </div>

            {/* Interactive Feedback & Review Form */}
            <div className="rounded-[24px] border border-black/7 bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1c241e]">Reviewer Feedback & Judge Notes</h3>
                  <p className="mt-0.5 text-[11px] text-[#78827b]">Leave thoughts, suggestions, or hackathon review notes.</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#f3f7ea] px-2.5 py-1 text-[10px] font-semibold text-[#668735]">
                  <Star className="size-3 fill-current" /> Interactive
                </span>
              </div>

              {feedbackSubmitted ? (
                <div className="rounded-2xl border border-[#7ba23c]/20 bg-[#f4f9ea] p-5 text-center">
                  <CircleCheck className="mx-auto size-7 text-[#769d37]" />
                  <p className="mt-2 text-sm font-semibold text-[#1e271f]">Thank you for your feedback!</p>
                  <p className="mt-1 text-xs text-[#6e7871]">
                    Your note from <strong className="text-[#1c241e]">{feedbackName || 'Reviewer'}</strong> was logged into the immutable workspace audit trail.
                  </p>
                  <button
                    onClick={() => {
                      setFeedbackSubmitted(false);
                      setFeedbackMessage('');
                    }}
                    className="mt-4 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[11px] font-semibold text-[#222a24] transition hover:bg-[#f6f8f4]"
                  >
                    Submit Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={submitFeedback} className="space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="reviewer-name" className="block text-[10px] font-semibold uppercase tracking-wider text-[#79837c]">
                        Your Name / Handle
                      </label>
                      <Input
                        id="reviewer-name"
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        placeholder="e.g. Judge Alex"
                        className="mt-1.5 h-10 rounded-xl border-black/8 bg-[#f9faf7] text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="reviewer-email" className="block text-[10px] font-semibold uppercase tracking-wider text-[#79837c]">
                        Email or GitHub Handle (Optional)
                      </label>
                      <Input
                        id="reviewer-email"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        placeholder="e.g. alex@github.com"
                        className="mt-1.5 h-10 rounded-xl border-black/8 bg-[#f9faf7] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="reviewer-category" className="block text-[10px] font-semibold uppercase tracking-wider text-[#79837c]">
                        Feedback Category
                      </label>
                      <select
                        id="reviewer-category"
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/8 bg-[#f9faf7] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8bad4e]/30"
                      >
                        <option value="Judge Review">Hackathon Judge Review</option>
                        <option value="Feature Suggestion">Feature Suggestion</option>
                        <option value="WebMCP Architecture">WebMCP Architecture</option>
                        <option value="Bug Report">Bug / Improvement</option>
                        <option value="General Feedback">General Feedback</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#79837c]">Quick Impression</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {['Mind-blowing 🚀', 'Super Sleek ✨', 'Great Architecture 🧠', 'Safe WebMCP 🛡️'].map((rating) => (
                          <button
                            type="button"
                            key={rating}
                            onClick={() => setFeedbackRating(rating)}
                            className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${
                              feedbackRating === rating
                                ? 'bg-[#181e1a] text-white shadow-xs'
                                : 'border border-black/7 bg-[#f9faf7] text-[#6b756d] hover:border-black/20'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reviewer-message" className="block text-[10px] font-semibold uppercase tracking-wider text-[#79837c]">
                      Review Notes or Message *
                    </label>
                    <Textarea
                      id="reviewer-message"
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="What impressed you? How does AgentPilot fit your vision of AI human collaboration?"
                      className="mt-1.5 min-h-20 resize-none rounded-xl border-black/8 bg-[#f9faf7] p-3 text-xs leading-5"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setAboutOpen(false);
                        setActivePage('Workspace');
                        runAnalysis();
                      }}
                      className="text-left text-[11px] font-semibold text-[#668735] hover:underline"
                    >
                      ⚡ Quick: Launch 14-Step Judge Demo
                    </button>
                    <Button type="submit" className="h-10 rounded-xl bg-[#171b18] px-5 text-white hover:bg-black">
                      <Send className="size-3.5" /> Submit Review Note
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title mt-3">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7871]">{description}</p></div>{action}</div>;
}

function ProposalCard({ proposal, modify, onApprove, onReject, onModify, onChangeDate }: { proposal: Proposal; modify: boolean; onApprove: () => void; onReject: () => void; onModify: () => void; onChangeDate: (date: string) => void }) {
  return <div className="mt-6 rounded-2xl border border-[#e9b16a]/20 bg-[#f6c47d]/[.07] p-4"><div className="mb-3 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.12em] text-[#f5c985]"><Sparkles className="size-3.5" /> Agent proposal</div><p className="text-sm font-medium leading-5">{proposal.summary}</p><p className="mt-2 text-[10px] leading-4 text-white/48">{proposal.rationale}</p>{modify && <label className="mt-4 block"><span className="text-[9px] font-semibold uppercase tracking-[.1em] text-white/45">Modify date</span><input type="date" value={typeof proposal.payload.deadline === 'string' ? proposal.payload.deadline : ''} onChange={(event) => onChangeDate(event.target.value)} className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-white/8 px-3 text-[10px] text-white outline-none" /></label>}<div className="mt-4 grid grid-cols-3 gap-2"><button onClick={onApprove} className="rounded-xl bg-[#d7ff79] px-2 py-2.5 text-[9px] font-semibold text-[#182016]">Approve</button><button onClick={onReject} className="rounded-xl border border-white/10 px-2 py-2.5 text-[9px] font-semibold text-white/65">Reject</button><button onClick={onModify} className="rounded-xl border border-white/10 px-2 py-2.5 text-[9px] font-semibold text-white/65">{modify ? 'Done' : 'Modify'}</button></div></div>;
}
