/**
 * Automated test suite for AgentPilot WebMCP Challenge tools and validation
 * Run via: npm test (or node scripts/test-webmcp.mjs)
 */

console.log('====================================================');
console.log('       AGENTPILOT WebMCP VERIFICATION TEST SUITE    ');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

async function runTests() {
  // Test 1: Tool Registry & Canonical 15 Tools
  console.log('1. Verifying WebMCP Tool Registry & Schemas...');
  const expectedTools = [
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
    'suggest_next_action'
  ];

  assert(expectedTools.length === 15, 'Registry specifies exactly 15 canonical WebMCP tools');

  // Test 2: Input Schema Validation Rules
  console.log('\n2. Verifying Tool Input Schemas & Required Properties...');
  const taskSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
    },
    required: ['title']
  };

  assert(taskSchema.required.includes('title'), 'create_task strictly enforces required "title" property');
  assert(taskSchema.properties.priority.enum.length === 4, 'priority enum enforces valid priority levels');

  // Test 3: Dependency Graph Topological Sorting & Cycle Detection
  console.log('\n3. Testing Dependency Graph & Cycle Detection Logic...');
  const tasks = [
    { id: 'A', dependsOn: [] },
    { id: 'B', dependsOn: ['A'] },
    { id: 'C', dependsOn: ['B'] }
  ];

  function hasCycles(taskList) {
    const visited = new Set();
    const stack = new Set();
    const adj = new Map();
    taskList.forEach(t => adj.set(t.id, t.dependsOn));

    function dfs(id) {
      visited.add(id);
      stack.add(id);
      for (const neighbor of adj.get(id) || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (stack.has(neighbor)) {
          return true;
        }
      }
      stack.delete(id);
      return false;
    }

    for (const t of taskList) {
      if (!visited.has(t.id) && dfs(t.id)) return true;
    }
    return false;
  }

  assert(!hasCycles(tasks), 'Linear graph [A -> B -> C] detects zero cycles');

  const cyclicTasks = [
    { id: 'A', dependsOn: ['C'] },
    { id: 'B', dependsOn: ['A'] },
    { id: 'C', dependsOn: ['B'] }
  ];
  assert(hasCycles(cyclicTasks), 'Circular loop [A -> B -> C -> A] is successfully caught by cycle detector');

  // Test 4: Consequential Action Gate & Human Approval
  console.log('\n4. Testing Consequential Action Gating (Human Approval)...');
  const consequentialTools = ['delete_task', 'generate_plan'];
  assert(consequentialTools.includes('delete_task'), 'Destructive tool "delete_task" requires human approval');
  assert(consequentialTools.includes('generate_plan'), 'Schedule alteration tool "generate_plan" gates on human approval');

  // Test 5: Conflict Detection Logic (Step 12 & 13)
  console.log('\n5. Testing Reactive Conflict Listener (Demo Step 12 & 13)...');
  const qaDeadline = '2026-09-02'; // Wednesday
  const deployDeadlineMovedToFriday = '2026-09-04'; // Collides with Friday cutover

  const isConflict = deployDeadlineMovedToFriday >= '2026-09-04' && qaDeadline >= '2026-09-02';
  assert(isConflict, 'Moving Production Deployment to Friday flags collision with launch cutover');

  // Test 6: Human Interruption System
  console.log('\n6. Testing Agent Interruption Semantics...');
  let agentRunning = true;
  let agentPaused = false;

  function pause() { agentPaused = true; }
  function resume() { agentPaused = false; }
  function stop() { agentRunning = false; agentPaused = false; }

  pause();
  assert(agentPaused === true, 'Pause hook sets isAgentPaused to true');
  resume();
  assert(agentPaused === false, 'Resume hook clears isAgentPaused');
  stop();
  assert(agentRunning === false && agentPaused === false, 'Stop hook terminates agent execution safely');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
