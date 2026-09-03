import { Project, Task, Agent, Integration, ActivityEvent, ApprovalProposal } from '@/types';

export const INITIAL_PROJECT: Project = {
  id: 'proj-launch-nova',
  title: 'Launch Nova',
  tagline: 'SaaS Product Launch & Public Availability',
  description: 'Next-generation collaborative cloud operating system launch targeted for Friday release.',
  targetLaunchDate: '2026-09-04', // Friday, September 4
  status: 'at_risk',
  collaborativeMode: 'collaborative',
  createdAt: '2026-08-25T08:00:00Z',
  updatedAt: '2026-09-03T09:00:00Z',
  milestones: [
    {
      id: 'm1',
      projectId: 'proj-launch-nova',
      title: 'Core Engine Freeze',
      targetDate: '2026-08-30',
      status: 'reached',
      description: 'API and database schemas finalized'
    },
    {
      id: 'm2',
      projectId: 'proj-launch-nova',
      title: 'Staging Validation & Security Audit',
      targetDate: '2026-09-02',
      status: 'reached',
      description: 'All integration tests and pen tests passed'
    },
    {
      id: 'm3',
      projectId: 'proj-launch-nova',
      title: 'General Availability (Launch)',
      targetDate: '2026-09-04',
      status: 'at_risk',
      description: 'Production traffic cutover and press release'
    }
  ]
};

export const INITIAL_TASKS: Task[] = [
  // Product Lane
  {
    id: 'task-prd',
    projectId: 'proj-launch-nova',
    title: 'Product Requirements',
    description: 'Finalize spec, scope lock, and customer onboarding journeys.',
    status: 'done',
    priority: 'high',
    owner: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', role: 'Head of Product' },
    deadline: '2026-08-28',
    lane: 'product',
    position: { x: 120, y: 140 },
    dependsOn: [],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-25T09:00:00Z',
    updatedAt: '2026-08-28T17:00:00Z',
  },
  {
    id: 'task-auth',
    projectId: 'proj-launch-nova',
    title: 'Authentication API',
    description: 'OAuth2, SSO, session tokens, and rate limiter rollout.',
    status: 'done',
    priority: 'critical',
    owner: { name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', role: 'Staff Backend Eng' },
    deadline: '2026-08-31',
    lane: 'product',
    position: { x: 120, y: 280 },
    dependsOn: ['task-prd'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-26T10:00:00Z',
    updatedAt: '2026-08-31T18:30:00Z',
  },
  {
    id: 'task-payment',
    projectId: 'proj-launch-nova',
    title: 'Payment Integration',
    description: 'Stripe webhook listener, usage meter synchronization, and checkout flow.',
    status: 'in_progress',
    priority: 'critical',
    owner: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', role: 'Billing Lead' },
    deadline: '2026-09-02',
    lane: 'product',
    position: { x: 120, y: 420 },
    dependsOn: ['task-auth'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-28T11:00:00Z',
    updatedAt: '2026-09-02T20:00:00Z',
  },
  {
    id: 'task-qa',
    projectId: 'proj-launch-nova',
    title: 'QA Testing',
    description: 'End-to-end regression suites, load testing up to 25k RPS, and cross-browser verification.',
    status: 'todo',
    priority: 'high',
    owner: { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', role: 'QA Lead' },
    deadline: '2026-09-04', // At risk: scheduled same day as launch!
    lane: 'product',
    position: { x: 120, y: 560 },
    dependsOn: ['task-payment'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-29T12:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'task-deploy',
    projectId: 'proj-launch-nova',
    title: 'Production Deployment',
    description: 'Zero-downtime blue/green deployment, canary DNS routing, and edge cache priming.',
    status: 'todo',
    priority: 'critical',
    owner: { name: 'DevOps Sentinel', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces', role: 'Platform Architect' },
    deadline: '2026-09-04', // Same day as QA!
    lane: 'product',
    position: { x: 120, y: 700 },
    dependsOn: ['task-qa'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-29T14:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  },

  // Marketing Lane
  {
    id: 'task-landing',
    projectId: 'proj-launch-nova',
    title: 'Landing Page',
    description: 'Interactive demo canvas, dynamic pricing calculator, and high-converting copy.',
    status: 'done',
    priority: 'high',
    owner: { name: 'Maya Lin', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces', role: 'Growth Designer' },
    deadline: '2026-08-30',
    lane: 'marketing',
    position: { x: 440, y: 140 },
    dependsOn: ['task-prd'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-25T14:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z',
  },
  {
    id: 'task-docs',
    projectId: 'proj-launch-nova',
    title: 'Documentation',
    description: 'WebMCP API reference, quickstart guide, code snippets, and architecture diagrams.',
    status: 'in_progress',
    priority: 'medium',
    owner: { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces', role: 'Developer Advocate' },
    deadline: '2026-09-03',
    lane: 'marketing',
    position: { x: 440, y: 320 },
    dependsOn: ['task-landing'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-28T09:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'task-announcement',
    projectId: 'proj-launch-nova',
    title: 'Launch Announcement',
    description: 'Product Hunt, Hacker News, X/Twitter thread, and email blast to 50k waiting list.',
    status: 'todo',
    priority: 'critical',
    owner: { name: 'Sophie Taylor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces', role: 'Marketing Lead' },
    deadline: '2026-09-04',
    lane: 'marketing',
    position: { x: 440, y: 520 },
    dependsOn: ['task-deploy', 'task-docs'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-09-02T12:00:00Z',
  },

  // Operations Lane
  {
    id: 'task-pricing',
    projectId: 'proj-launch-nova',
    title: 'Pricing & Tiers',
    description: 'Usage-based credit calculation and enterprise contact-sales tier setup.',
    status: 'done',
    priority: 'high',
    owner: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', role: 'Head of Product' },
    deadline: '2026-08-29',
    lane: 'operations',
    position: { x: 760, y: 140 },
    dependsOn: ['task-prd'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-25T11:00:00Z',
    updatedAt: '2026-08-29T15:00:00Z',
  },
  {
    id: 'task-support',
    projectId: 'proj-launch-nova',
    title: 'Support & Escalation Runbook',
    description: '24/7 on-call rotation, PagerDuty schedules, and triage procedures.',
    status: 'todo',
    priority: 'medium',
    owner: { name: 'DevOps Sentinel', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces', role: 'Platform Architect' },
    deadline: '2026-09-03',
    lane: 'operations',
    position: { x: 760, y: 320 },
    dependsOn: ['task-pricing'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: '2026-08-30T09:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-lead',
    name: 'Lead Launch Agent',
    role: 'Orchestrator & Strategy',
    description: 'Monitors milestone velocity, orchestrates downstream agents, and interfaces with human leadership.',
    status: 'active',
    successRate: 98.4,
    executionsCount: 42,
    toolsCount: 15,
    lastRun: '2 mins ago',
    currentTask: 'Observing Launch Nova critical path'
  },
  {
    id: 'agent-dep',
    name: 'Dependency Analyzer',
    role: 'Topological Graph Verification',
    description: 'Performs continuous cycle detection, critical path calculation, and blocker detection.',
    status: 'active',
    successRate: 100,
    executionsCount: 78,
    toolsCount: 6,
    lastRun: 'Just now',
    currentTask: 'Continuous conflict monitoring'
  },
  {
    id: 'agent-scheduler',
    name: 'Schedule Optimizer',
    role: 'Timeline & Critical Path Method',
    description: 'Calculates slack, float, and optimal task ordering to prevent launch date slippage.',
    status: 'active',
    successRate: 97.2,
    executionsCount: 31,
    toolsCount: 8,
    lastRun: '15 mins ago',
    currentTask: 'Evaluating buffer distribution'
  },
  {
    id: 'agent-qa',
    name: 'QA & Risk Sentinel',
    role: 'Quality Gatekeeper',
    description: 'Tracks test suites, payment gateways, regression coverage, and flags blocker risks.',
    status: 'active',
    successRate: 99.1,
    executionsCount: 54,
    toolsCount: 5,
    lastRun: '32 mins ago',
    currentTask: 'Tracking payment webhook readiness'
  }
];

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-github',
    name: 'GitHub',
    provider: 'github',
    description: 'Sync pull requests, issue commits, and branch deployments to task statuses.',
    connected: true,
    status: 'synced',
    lastSync: '10 mins ago',
    isMock: true
  },
  {
    id: 'int-slack',
    name: 'Slack',
    provider: 'slack',
    description: 'Notify engineering and product channels on agent proposals, blockers, and approvals.',
    connected: true,
    status: 'synced',
    lastSync: '4 mins ago',
    isMock: true
  },
  {
    id: 'int-gcal',
    name: 'Google Calendar',
    provider: 'google_calendar',
    description: 'Synchronize project launch milestones and sprint checkpoints with team schedules.',
    connected: true,
    status: 'synced',
    lastSync: '1 hour ago',
    isMock: true
  },
  {
    id: 'int-notion',
    name: 'Notion',
    provider: 'notion',
    description: 'Bi-directional sync of product specification documents and executive summaries.',
    connected: false,
    status: 'disconnected',
    isMock: true
  },
  {
    id: 'int-linear',
    name: 'Linear',
    provider: 'linear',
    description: 'Mirror issues, cycle roadmaps, and triage queues with WebMCP task records.',
    connected: true,
    status: 'synced',
    lastSync: '2 mins ago',
    isMock: true
  }
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'tool_execution',
    actor: 'agent',
    actorName: 'Lead Launch Agent',
    action: 'get_project_state',
    description: 'Inspected Launch Nova health and milestone deadlines.',
    timestamp: '08:42 PM',
    metadata: { status: 'at_risk', targetLaunchDate: '2026-09-04' }
  },
  {
    id: 'act-2',
    type: 'tool_execution',
    actor: 'webmcp',
    actorName: 'WebMCP Engine',
    action: 'analyze_dependencies',
    description: 'Scanned 10 tasks and identified 1 critical path bottleneck.',
    timestamp: '08:38 PM',
    metadata: { bottleneck: 'task-payment -> task-qa' }
  },
  {
    id: 'act-3',
    type: 'human_action',
    actor: 'human',
    actorName: 'Lead Product Eng',
    action: 'update_task',
    description: 'Marked Authentication API as Done.',
    timestamp: '08:31 PM',
    metadata: { taskId: 'task-auth', status: 'done' }
  },
  {
    id: 'act-4',
    type: 'tool_execution',
    actor: 'agent',
    actorName: 'Dependency Analyzer',
    action: 'find_blockers',
    description: 'Detected 3 incomplete predecessors blocking Friday launch readiness.',
    timestamp: '08:24 PM',
    metadata: { blockers: ['Payment Integration', 'QA Testing', 'Documentation'] }
  }
];

export const INITIAL_PENDING_APPROVAL: ApprovalProposal = {
  id: 'prop-schedule-fix-1',
  agentId: 'agent-scheduler',
  title: 'Optimize Schedule to Protect Friday Launch',
  summary: 'Shift QA Testing earlier, schedule Production Deployment to Thursday, and add dedicated Regression Testing buffer.',
  impactExplanation: 'Currently QA Testing and Production Deployment are scheduled on the same day (Friday). Moving QA to Wednesday eliminates zero-day crunch and gives 24 hours of buffer for live traffic cutover.',
  status: 'pending',
  timestamp: 'Just now',
  proposedChanges: {
    moveTasks: [
      {
        taskId: 'task-qa',
        taskTitle: 'QA Testing',
        currentDeadline: '2026-09-04',
        proposedDeadline: '2026-09-02', // Wednesday
        lane: 'product'
      },
      {
        taskId: 'task-deploy',
        taskTitle: 'Production Deployment',
        currentDeadline: '2026-09-04',
        proposedDeadline: '2026-09-03', // Thursday
        lane: 'product'
      }
    ],
    createTasks: [
      {
        title: 'Regression Testing & Canary Verification',
        lane: 'product',
        priority: 'high',
        deadline: '2026-09-03',
        dependsOn: ['task-qa']
      }
    ]
  }
};
