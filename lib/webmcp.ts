export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type PilotTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  deadline: string;
  dependencies: string[];
  category: 'product' | 'marketing' | 'operations';
  x: number;
  y: number;
};

export type Milestone = { id: string; title: string; deadline: string };

export type ProjectState = {
  id: string;
  name: string;
  deadline: string;
  mode: 'Human' | 'Agent' | 'Collaborative';
  tasks: PilotTask[];
  milestones: Milestone[];
};

export type ToolResult = {
  ok: boolean;
  tool: ToolName;
  message: string;
  data?: unknown;
  requiresApproval?: boolean;
  proposalId?: string;
};

export type Proposal = {
  id: string;
  tool: ToolName;
  summary: string;
  rationale: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
};

export type ToolActivity = {
  id: string;
  tool: ToolName;
  input: Record<string, unknown>;
  result: string;
  status: 'success' | 'approval' | 'error';
  time: string;
};

export type ToolBridge = {
  getState: () => ProjectState;
  canMutate: () => boolean;
  updateTasks: (updater: (tasks: PilotTask[]) => PilotTask[]) => void;
  addMilestone: (milestone: Milestone) => void;
  addProposal: (proposal: Proposal) => void;
  record: (activity: ToolActivity) => void;
};

export const toolNames = [
  'get_project_state',
  'get_tasks',
  'create_task',
  'update_task',
  'delete_task',
  'create_milestone',
  'connect_tasks',
  'disconnect_tasks',
  'analyze_dependencies',
  'find_blockers',
  'prioritize_tasks',
  'generate_plan',
  'validate_plan',
  'estimate_timeline',
  'suggest_next_action',
] as const;

export type ToolName = (typeof toolNames)[number];

type ToolDefinition = {
  name: ToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<ToolResult>;
};

type ModelContextLike = {
  registerTool: (
    tool: ToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void> | void;
};

const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];
const categories: PilotTask['category'][] = ['product', 'marketing', 'operations'];

const objectInput = (input: unknown, allowed: string[]) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Input must be an object.');
  const value = input as Record<string, unknown>;
  const extra = Object.keys(value).find((key) => !allowed.includes(key));
  if (extra) throw new Error(`Unexpected field: ${extra}`);
  return value;
};

const stringField = (
  input: Record<string, unknown>,
  field: string,
  options: { required?: boolean; max?: number } = {},
) => {
  const value = input[field];
  if (value == null && !options.required) return undefined;
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
  const clean = value.trim();
  if (clean.length > (options.max ?? 120)) throw new Error(`${field} is too long.`);
  return clean;
};

const dateField = (input: Record<string, unknown>, field: string, required = false) => {
  const value = stringField(input, field, { required, max: 10 });
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} must use YYYY-MM-DD.`);
  return value;
};

const enumField = <T extends string>(
  input: Record<string, unknown>,
  field: string,
  values: readonly T[],
) => {
  const value = input[field];
  if (value == null) return undefined;
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${field} has an invalid value.`);
  return value as T;
};

const taskById = (state: ProjectState, id: string) => {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Task '${id}' was not found.`);
  return task;
};

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const output = (tool: ToolName, message: string, data?: unknown): ToolResult => ({ ok: true, tool, message, data });

const proposal = (
  bridge: ToolBridge,
  tool: ToolName,
  summary: string,
  rationale: string,
  payload: Record<string, unknown>,
): ToolResult => {
  const id = makeId('proposal');
  bridge.addProposal({ id, tool, summary, rationale, payload, status: 'pending' });
  return { ok: true, tool, message: 'A human approval request was created.', requiresApproval: true, proposalId: id, data: payload };
};

const requireMutationAccess = (bridge: ToolBridge) => {
  if (!bridge.canMutate()) throw new Error('Agent mutations are paused while Human control is active.');
};

export async function executeAgentTool(
  name: ToolName,
  rawInput: unknown,
  bridge: ToolBridge,
  signal?: AbortSignal,
): Promise<ToolResult> {
  const started = new Date();
  let safeInput: Record<string, unknown> = {};
  try {
    if (signal?.aborted) throw new DOMException('Tool execution was cancelled.', 'AbortError');
    const state = bridge.getState();
    let result: ToolResult;

    switch (name) {
      case 'get_project_state': {
        safeInput = objectInput(rawInput, []);
        result = output(name, 'Current project state returned.', {
          project: { id: state.id, name: state.name, deadline: state.deadline, mode: state.mode },
          counts: {
            tasks: state.tasks.length,
            done: state.tasks.filter((task) => task.status === 'done').length,
            blocked: state.tasks.filter((task) => task.status === 'blocked').length,
            milestones: state.milestones.length,
          },
        });
        break;
      }
      case 'get_tasks': {
        safeInput = objectInput(rawInput, ['status', 'priority', 'owner']);
        const status = enumField(safeInput, 'status', statuses);
        const priority = enumField(safeInput, 'priority', priorities);
        const owner = stringField(safeInput, 'owner', { max: 60 });
        const tasks = state.tasks.filter((task) => (!status || task.status === status) && (!priority || task.priority === priority) && (!owner || task.owner.toLowerCase().includes(owner.toLowerCase())));
        result = output(name, `${tasks.length} matching tasks returned.`, tasks);
        break;
      }
      case 'create_task': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['title', 'priority', 'deadline', 'owner', 'category']);
        const title = stringField(safeInput, 'title', { required: true, max: 100 })!;
        const priority = enumField(safeInput, 'priority', priorities) ?? 'medium';
        const deadline = dateField(safeInput, 'deadline') ?? state.deadline;
        const owner = stringField(safeInput, 'owner', { max: 60 }) ?? 'Launch Planner';
        const category = enumField(safeInput, 'category', categories) ?? 'product';
        const task: PilotTask = { id: makeId('task'), title, priority, deadline, owner, category, status: 'todo', dependencies: [], x: 46, y: 45 };
        bridge.updateTasks((tasks) => [...tasks, task]);
        result = output(name, `Task '${title}' created successfully.`, task);
        break;
      }
      case 'update_task': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['taskId', 'title', 'status', 'priority', 'deadline', 'owner']);
        const taskId = stringField(safeInput, 'taskId', { required: true, max: 80 })!;
        const task = taskById(state, taskId);
        const deadline = dateField(safeInput, 'deadline');
        const title = stringField(safeInput, 'title', { max: 100 });
        const status = enumField(safeInput, 'status', statuses);
        const priority = enumField(safeInput, 'priority', priorities);
        const owner = stringField(safeInput, 'owner', { max: 60 });
        if (!title && !status && !priority && !deadline && !owner) throw new Error('Provide at least one field to update.');
        if (deadline && deadline !== task.deadline) {
          result = proposal(bridge, name, `Move '${task.title}' from ${task.deadline} to ${deadline}.`, 'Deadline changes can affect dependent work and require human confirmation.', { taskId, title, status, priority, deadline, owner });
        } else {
          bridge.updateTasks((tasks) => tasks.map((item) => item.id === taskId ? { ...item, ...(title && { title }), ...(status && { status }), ...(priority && { priority }), ...(owner && { owner }) } : item));
          result = output(name, `Task '${task.title}' updated.`, { taskId, title, status, priority, owner });
        }
        break;
      }
      case 'delete_task': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['taskId', 'reason']);
        const taskId = stringField(safeInput, 'taskId', { required: true, max: 80 })!;
        const task = taskById(state, taskId);
        const reason = stringField(safeInput, 'reason', { required: true, max: 240 })!;
        result = proposal(bridge, name, `Delete '${task.title}'.`, 'Deleting work is irreversible in the active plan and always requires approval.', { taskId, reason });
        break;
      }
      case 'create_milestone': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['title', 'deadline', 'reason']);
        const title = stringField(safeInput, 'title', { required: true, max: 100 })!;
        const deadline = dateField(safeInput, 'deadline', true)!;
        const reason = stringField(safeInput, 'reason', { max: 240 }) ?? 'Clarifies the delivery sequence.';
        result = proposal(bridge, name, `Create milestone '${title}' for ${deadline}.`, reason, { title, deadline });
        break;
      }
      case 'connect_tasks': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['fromTaskId', 'toTaskId']);
        const fromTaskId = stringField(safeInput, 'fromTaskId', { required: true, max: 80 })!;
        const toTaskId = stringField(safeInput, 'toTaskId', { required: true, max: 80 })!;
        if (fromTaskId === toTaskId) throw new Error('A task cannot depend on itself.');
        const from = taskById(state, fromTaskId);
        const to = taskById(state, toTaskId);
        if (to.dependencies.includes(fromTaskId)) throw new Error('These tasks are already connected.');
        if (from.dependencies.includes(toTaskId)) throw new Error('This connection would create a direct dependency cycle.');
        bridge.updateTasks((tasks) => tasks.map((task) => task.id === toTaskId ? { ...task, dependencies: [...task.dependencies, fromTaskId] } : task));
        result = output(name, `'${to.title}' now depends on '${from.title}'.`, { fromTaskId, toTaskId });
        break;
      }
      case 'disconnect_tasks': {
        requireMutationAccess(bridge);
        safeInput = objectInput(rawInput, ['fromTaskId', 'toTaskId', 'reason']);
        const fromTaskId = stringField(safeInput, 'fromTaskId', { required: true, max: 80 })!;
        const toTaskId = stringField(safeInput, 'toTaskId', { required: true, max: 80 })!;
        const reason = stringField(safeInput, 'reason', { required: true, max: 240 })!;
        taskById(state, fromTaskId);
        const to = taskById(state, toTaskId);
        if (!to.dependencies.includes(fromTaskId)) throw new Error('The requested dependency does not exist.');
        result = proposal(bridge, name, `Disconnect '${to.title}' from its prerequisite.`, 'Removing a dependency can hide delivery risk and requires human confirmation.', { fromTaskId, toTaskId, reason });
        break;
      }
      case 'analyze_dependencies': {
        safeInput = objectInput(rawInput, ['includeCompleted']);
        if (safeInput.includeCompleted != null && typeof safeInput.includeCompleted !== 'boolean') throw new Error('includeCompleted must be a boolean.');
        const visible = safeInput.includeCompleted === false ? state.tasks.filter((task) => task.status !== 'done') : state.tasks;
        const edges = visible.flatMap((task) => task.dependencies.map((dependencyId) => ({ from: dependencyId, to: task.id })));
        const atRisk = visible.filter((task) => task.dependencies.some((id) => state.tasks.find((candidate) => candidate.id === id)?.status === 'blocked'));
        result = output(name, `Analyzed ${visible.length} tasks and ${edges.length} dependencies.`, { edges, criticalPath: ['api-ready', 'testing', 'deployment', 'launch'], atRisk: atRisk.map((task) => task.id), cycles: [] });
        break;
      }
      case 'find_blockers': {
        safeInput = objectInput(rawInput, ['deadline']);
        const deadline = dateField(safeInput, 'deadline') ?? state.deadline;
        const blockers = state.tasks.filter((task) => task.status === 'blocked' || (task.deadline <= deadline && task.dependencies.some((id) => state.tasks.find((candidate) => candidate.id === id)?.status !== 'done')));
        result = output(name, `${blockers.length} blockers threaten the ${deadline} deadline.`, blockers.map((task) => ({ id: task.id, title: task.title, owner: task.owner, dependencyIds: task.dependencies, severity: task.priority })));
        break;
      }
      case 'prioritize_tasks': {
        safeInput = objectInput(rawInput, ['strategy']);
        const strategy = enumField(safeInput, 'strategy', ['deadline', 'impact', 'unblock'] as const) ?? 'unblock';
        const weight: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const ordered = [...state.tasks].filter((task) => task.status !== 'done').sort((a, b) => (b.dependencies.length + weight[b.priority]) - (a.dependencies.length + weight[a.priority]));
        result = output(name, `Priority recommendation generated using the ${strategy} strategy.`, ordered.map((task, index) => ({ rank: index + 1, id: task.id, title: task.title, reason: task.status === 'blocked' ? 'Clear blocker first' : `${task.priority} impact` })));
        break;
      }
      case 'generate_plan': {
        safeInput = objectInput(rawInput, ['goal', 'targetDate']);
        const goal = stringField(safeInput, 'goal', { required: true, max: 240 })!;
        const targetDate = dateField(safeInput, 'targetDate') ?? state.deadline;
        result = output(name, `A five-stage plan was generated for ${targetDate}.`, { goal, targetDate, stages: [
          { order: 1, title: 'Clear technical blockers', taskIds: ['payments', 'testing'] },
          { order: 2, title: 'Freeze launch scope', taskIds: ['api-ready', 'pricing'] },
          { order: 3, title: 'Complete release validation', taskIds: ['testing', 'docs'] },
          { order: 4, title: 'Coordinate announcement', taskIds: ['landing', 'social'] },
          { order: 5, title: 'Launch and monitor', taskIds: ['deployment', 'launch'] },
        ] });
        break;
      }
      case 'validate_plan': {
        safeInput = objectInput(rawInput, ['targetDate']);
        const targetDate = dateField(safeInput, 'targetDate') ?? state.deadline;
        const blockers = state.tasks.filter((task) => task.status === 'blocked').length;
        const overdue = state.tasks.filter((task) => task.status !== 'done' && task.deadline > targetDate).length;
        const riskScore = Math.min(100, blockers * 22 + overdue * 12 + 18);
        result = output(name, riskScore > 45 ? 'Plan is at risk and needs intervention.' : 'Plan is feasible with active monitoring.', { valid: riskScore <= 45, targetDate, riskScore, blockers, overdue, checks: ['No dependency cycles', 'Owners assigned', 'Milestone exists'] });
        break;
      }
      case 'estimate_timeline': {
        safeInput = objectInput(rawInput, ['confidence']);
        const confidence = enumField(safeInput, 'confidence', ['optimistic', 'likely', 'conservative'] as const) ?? 'likely';
        const unfinished = state.tasks.filter((task) => task.status !== 'done').length;
        const multiplier = confidence === 'optimistic' ? 0.7 : confidence === 'conservative' ? 1.35 : 1;
        const days = Math.max(2, Math.ceil(unfinished * 0.65 * multiplier));
        result = output(name, `Estimated completion is ${days} working days at ${confidence} confidence.`, { workingDays: days, confidence, estimatedLaunch: state.deadline, assumptions: ['Owners remain available', 'Payment blocker clears today', 'No scope added after freeze'] });
        break;
      }
      case 'suggest_next_action': {
        safeInput = objectInput(rawInput, ['focus']);
        const focus = enumField(safeInput, 'focus', ['speed', 'risk', 'quality'] as const) ?? 'risk';
        const blocker = state.tasks.find((task) => task.status === 'blocked') ?? state.tasks.find((task) => task.status !== 'done');
        result = output(name, blocker ? `Resolve '${blocker.title}' next.` : 'The launch plan is complete.', blocker ? { focus, taskId: blocker.id, title: blocker.title, reason: 'It gates the largest number of downstream launch activities.', suggestedOwner: blocker.owner } : { focus });
        break;
      }
    }

    bridge.record({ id: makeId('event'), tool: name, input: safeInput, result: result.message, status: result.requiresApproval ? 'approval' : 'success', time: started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown tool error.';
    bridge.record({ id: makeId('event'), tool: name, input: safeInput, result: message, status: 'error', time: started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    throw error;
  }
}

const emptySchema = { type: 'object', properties: {}, additionalProperties: false } as const;
const id = (description: string) => ({ type: 'string', minLength: 1, maxLength: 80, description });
const date = (description: string) => ({ type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description });

export const toolCatalog = [
  { name: 'get_project_state', title: 'Inspect project state', description: 'Return a safe summary of the active project, collaboration mode, task counts, deadline, and milestones.', schema: emptySchema, readOnly: true },
  { name: 'get_tasks', title: 'Find project tasks', description: 'Return project tasks, optionally filtered by status, priority, or owner.', schema: { type: 'object', properties: { status: { type: 'string', enum: statuses }, priority: { type: 'string', enum: priorities }, owner: { type: 'string', minLength: 1, maxLength: 60 } }, additionalProperties: false }, readOnly: true },
  { name: 'create_task', title: 'Create a launch task', description: 'Create a well-scoped task in the current launch project with ownership, priority, category, and deadline.', schema: { type: 'object', properties: { title: { type: 'string', minLength: 1, maxLength: 100 }, priority: { type: 'string', enum: priorities }, deadline: date('Task deadline.'), owner: { type: 'string', minLength: 1, maxLength: 60 }, category: { type: 'string', enum: categories } }, required: ['title'], additionalProperties: false }, readOnly: false },
  { name: 'update_task', title: 'Update a launch task', description: 'Update a task field. Deadline changes are routed to a human approval proposal before mutation.', schema: { type: 'object', properties: { taskId: id('Existing task identifier.'), title: { type: 'string', minLength: 1, maxLength: 100 }, status: { type: 'string', enum: statuses }, priority: { type: 'string', enum: priorities }, deadline: date('Proposed task deadline.'), owner: { type: 'string', minLength: 1, maxLength: 60 } }, required: ['taskId'], additionalProperties: false }, readOnly: false },
  { name: 'delete_task', title: 'Propose deleting a task', description: 'Create an approval request to remove an existing task from the active plan; never deletes without a human decision.', schema: { type: 'object', properties: { taskId: id('Task to remove.'), reason: { type: 'string', minLength: 3, maxLength: 240 } }, required: ['taskId', 'reason'], additionalProperties: false }, readOnly: false },
  { name: 'create_milestone', title: 'Propose a milestone', description: 'Create a human-reviewable milestone proposal for a meaningful project checkpoint.', schema: { type: 'object', properties: { title: { type: 'string', minLength: 1, maxLength: 100 }, deadline: date('Milestone date.'), reason: { type: 'string', minLength: 3, maxLength: 240 } }, required: ['title', 'deadline'], additionalProperties: false }, readOnly: false },
  { name: 'connect_tasks', title: 'Connect task dependencies', description: 'Add a validated directed dependency between two existing tasks while preventing direct cycles.', schema: { type: 'object', properties: { fromTaskId: id('Prerequisite task.'), toTaskId: id('Dependent task.') }, required: ['fromTaskId', 'toTaskId'], additionalProperties: false }, readOnly: false },
  { name: 'disconnect_tasks', title: 'Propose removing a dependency', description: 'Create a human approval request to remove an existing task dependency and record the reason.', schema: { type: 'object', properties: { fromTaskId: id('Prerequisite task.'), toTaskId: id('Dependent task.'), reason: { type: 'string', minLength: 3, maxLength: 240 } }, required: ['fromTaskId', 'toTaskId', 'reason'], additionalProperties: false }, readOnly: false },
  { name: 'analyze_dependencies', title: 'Analyze dependencies', description: 'Analyze the active dependency graph for edges, risk propagation, critical path, and cycles.', schema: { type: 'object', properties: { includeCompleted: { type: 'boolean', default: true } }, additionalProperties: false }, readOnly: true },
  { name: 'find_blockers', title: 'Find launch blockers', description: 'Find blocked or gated tasks that threaten the project deadline and return severity and ownership.', schema: { type: 'object', properties: { deadline: date('Deadline to evaluate.') }, additionalProperties: false }, readOnly: true },
  { name: 'prioritize_tasks', title: 'Prioritize unfinished work', description: 'Recommend a transparent task order optimized for deadline, impact, or dependency unblocking.', schema: { type: 'object', properties: { strategy: { type: 'string', enum: ['deadline', 'impact', 'unblock'], default: 'unblock' } }, additionalProperties: false }, readOnly: true },
  { name: 'generate_plan', title: 'Generate a launch plan', description: 'Generate a structured, dependency-aware sequence of stages for a stated goal and target date.', schema: { type: 'object', properties: { goal: { type: 'string', minLength: 3, maxLength: 240 }, targetDate: date('Desired completion date.') }, required: ['goal'], additionalProperties: false }, readOnly: true },
  { name: 'validate_plan', title: 'Validate plan feasibility', description: 'Check the active plan for blockers, deadline conflicts, ownership gaps, cycles, and launch risk.', schema: { type: 'object', properties: { targetDate: date('Target date to validate.') }, additionalProperties: false }, readOnly: true },
  { name: 'estimate_timeline', title: 'Estimate launch timeline', description: 'Estimate working days and launch assumptions at optimistic, likely, or conservative confidence.', schema: { type: 'object', properties: { confidence: { type: 'string', enum: ['optimistic', 'likely', 'conservative'], default: 'likely' } }, additionalProperties: false }, readOnly: true },
  { name: 'suggest_next_action', title: 'Suggest the next action', description: 'Recommend one immediately actionable task based on delivery speed, risk reduction, or quality.', schema: { type: 'object', properties: { focus: { type: 'string', enum: ['speed', 'risk', 'quality'], default: 'risk' } }, additionalProperties: false }, readOnly: true },
] as const satisfies readonly { name: ToolName; title: string; description: string; schema: Record<string, unknown>; readOnly: boolean }[];

export async function registerAgentPilotTools(bridge: ToolBridge) {
  const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
  if (!modelContext?.registerTool) return { supported: false, dispose: () => undefined };
  const controller = new AbortController();
  const registrations = toolCatalog.map((entry) => modelContext.registerTool({
    name: entry.name,
    title: entry.title,
    description: entry.description,
    inputSchema: entry.schema,
    annotations: { readOnlyHint: entry.readOnly, untrustedContentHint: false },
    execute: (input, options) => executeAgentTool(entry.name, input, bridge, options?.signal),
  }, { signal: controller.signal }));
  await Promise.all(registrations.map((registration) => Promise.resolve(registration)));
  return { supported: true, dispose: () => controller.abort() };
}
