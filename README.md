# AGENTPILOT

> *"The command center where humans and AI agents work together."*

**A WebMCP Challenge Submission**

---

## The Core Concept

**AgentPilot is not a chatbot that controls a website.**  
It is a web application where **humans and AI agents share the exact same structured workspace**, collaborate on complex project graphs, and safely hand control back and forth.

WebMCP is the foundational contract of this architecture. Instead of an AI agent clumsily guessing CSS selectors or scraping the DOM, AgentPilot registers **15 typed, validated WebMCP tools** directly onto `document.modelContext`.

### The Continuous Collaboration Loop

```
                        ┌──────────────────────────────┐
                        │         HUMAN USER           │
                        └──────────────┬───────────────┘
                           │           │          ▲
                  Edits, Drags,   Approves/    Observes Visual
                  Modifies Dates   Rejects     State & Explanations
                           │           │          │
                           ▼           ▼          │
                ┌──────────────────────────────────────────────┐
                │              APPLICATION STATE               │
                │  - Projects, Tasks, Milestones, Dependencies │
                │  - Reactive Conflict Listener Engine         │
                └──────────────┬───────────────────────────────┘
                               │
                   State Change│Signals / Perceptions
                               ▼
                ┌──────────────────────────────────────────────┐
                │                 WEBMCP LAYER                 │
                │  - document.modelContext.registerTool(...)   │
                │  - 15 Standard Tools with JSON Schemas       │
                │  - Consequential Action Gatekeeper           │
                │  - Real-time Audit Telemetry Log             │
                └──────────────┬───────────────────────────────┘
                               │
                    Structured │ Tool Calls / Invocations
                               ▼
                ┌──────────────────────────────────────────────┐
                │             AI AGENT ENGINE                  │
                │  - Multi-step reasoning: get_state → analyze │
                │  - Proactive conflict detection              │
                │  - Human interruption controller (Pause/Stop)│
                │  - Autonomous & OpenAI hybrid execution      │
                └──────────────────────────────────────────────┘
```

---

## Key Product Capabilities

1. **Interactive Visual Task Canvas:**
   - Swimlanes for Product Engineering, Growth & Marketing, and Operations.
   - Dynamic SVG Bezier dependency lines that actively recalculate when tasks are moved.
   - Real-time drag-and-drop node positioning.
2. **True WebMCP Integration:**
   - Direct registration on `document.modelContext.registerTool(...)`.
   - 15 production-ready tools with strict JSON Schemas, runtime validation, and audit tracking.
3. **Consequential Action Gateway (Human Approval):**
   - Agents cannot arbitrarily overwrite critical launch deadlines without explicit human confirmation.
   - Humans can **Approve**, **Reject**, or **Modify** proposed schedules in-place.
4. **Human Interruption Controls:**
   - Real-time **Pause** and **Stop** controls to halt autonomous operations mid-flight.
5. **Reactive Conflict Listener:**
   - If a human makes a manual schedule change that violates dependency constraints or endangers launch deadlines, the agent detects the shift and proactively alerts the team.
6. **Multi-Agent Fleet Dashboard:**
   - Dedicated metrics for Lead Launch Agent, Dependency Analyzer, Schedule Optimizer, and QA Sentinel.
7. **Developer WebMCP Inspector & Verification Section:**
   - Live status badge, schema inspector, and interactive payload runner.

---

## The 15 WebMCP Tools

| Tool Name | Category | Description | Consequential Gate |
|:---|:---|:---|:---:|
| `get_project_state` | Project | Retrieve complete project health and milestone statuses | No |
| `get_tasks` | Task | Query tasks with status/priority/lane filters | No |
| `create_task` | Task | Create a new task with owner and deadline | No |
| `update_task` | Task | Modify task properties, dates, or canvas positions | No |
| `delete_task` | Task | Remove a task and detach dependencies | **Yes (Approval)** |
| `create_milestone` | Project | Define target delivery milestone | No |
| `connect_tasks` | Dependency | Create directional dependency link between tasks | No |
| `disconnect_tasks` | Dependency | Remove dependency link | No |
| `analyze_dependencies` | Dependency | Cycle detection and critical path calculation | No |
| `find_blockers` | Dependency | Identify incomplete tasks blocking deliverables | No |
| `prioritize_tasks` | Task | Re-rank tasks by deadline urgency and weight | No |
| `generate_plan` | Planning | Optimize delivery schedule for launch date | **Yes (Approval)** |
| `validate_plan` | Planning | Ensure all dependencies satisfy sequential timing | No |
| `estimate_timeline` | Planning | Calculate projected completion and confidence | No |
| `suggest_next_action` | Planning | Surface single highest-leverage recommendation | No |

---

## The 14-Step Judge Demo Flow

AgentPilot includes an interactive **Judge Demo Flow** controller docked at the top of the screen. You can step through each step manually or click **"Auto Run 1-14"**:

- **Step 1:** Open AgentPilot (WebMCP initialized).
- **Step 2:** Open demo project: *Launch Nova* (Target: Sept 4).
- **Step 3:** Ask agent: *"Can we launch Friday?"*
- **Step 4:** Agent executes: `get_project_state` → `get_tasks` → `analyze_dependencies` → `find_blockers` → `estimate_timeline`.
- **Step 5:** Agent reports: *"The launch is at risk"* due to zero-day QA crunch.
- **Step 6:** User requests: *"Fix the schedule"*.
- **Step 7:** Agent generates proposal via `generate_plan`.
- **Step 8:** UI displays **AGENT PROPOSAL** modal.
- **Step 9:** User clicks **Approve & Apply Plan**.
- **Step 10:** WebMCP tools execute schedule updates.
- **Step 11:** Canvas visibly transitions: QA moved to Wednesday, Deployment to Thursday, Regression Testing created.
- **Step 12:** Human manually changes Production Deployment from Thursday → Friday.
- **Step 13:** Agent reactive listener observes the change.
- **Step 14:** Agent alerts: *"Your manual change creates a dependency conflict. Would you like me to recalculate the plan?"*

---

## Multi-Language Architecture & Python SDK

AgentPilot provides first-class support across languages:
- **TypeScript / React**: Modern command center frontend with browser WebMCP registration (`document.modelContext`).
- **Python**: Full standalone Python SDK, 15 WebMCP tool implementations, Claude Desktop MCP server, and autonomous reasoning CLI.
- **Shell / Bash & Windows Batch**: Cross-platform automation scripts.

### Python Quick Start

```bash
# Run the 14-Step Judge Demo Flow directly in Python
python -m agentpilot.cli demo

# Run dependency analysis
python -m agentpilot.cli analyze

# Run unit tests
python -m unittest discover -s python/tests
```

### Claude Desktop MCP Server (Python)

Connect Anthropic Claude Desktop to AgentPilot by adding to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentpilot": {
      "command": "python",
      "args": ["-m", "agentpilot.mcp_server"]
    }
  }
}
```

---

## Quick Start (Web)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
# TypeScript Type Check
npx tsc --noEmit

# Python Unit Tests
python -m unittest discover -s python/tests
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

AgentPilot works **100% out of the box with zero configuration** using its autonomous heuristic engine. To optionally connect real OpenAI LLMs:

Create a `.env.local` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

*Note: All API keys remain strictly on the server and are never exposed to client browser code.*

---

## License

MIT License. See [LICENSE](./LICENSE) for details.
