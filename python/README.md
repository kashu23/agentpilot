# AgentPilot Python SDK & Model Context Protocol (MCP) Server

The official Python client, agent runtime, and MCP server for **AgentPilot: The Command Center for Human-AI Collaboration**.

---

## Capabilities

- **15 WebMCP Tools in Python**: Full implementations of project queries, dependency graph analysis, cycle detection, critical path calculation, and schedule planning.
- **Anthropic MCP Standard Server**: Connect Claude Desktop, Cursor, Antigravity, or other MCP clients directly via stdio.
- **Consequential Action Gateway**: Enforces human approval before destructive actions (like deleting tasks) or schedule regenerations.
- **Autonomous Reasoning Engine**: Multi-step tool execution with pause, resume, and stop controls.
- **Reactive Conflict Listener**: Proactively flags dependency violations when humans modify deadlines.
- **Zero Required Dependencies**: Runs 100% out of the box with the Python Standard Library.

---

## Installation

```bash
cd python
pip install -e .
```

---

## CLI Usage

### View Project Status
```bash
python -m agentpilot.cli status
```

### Run Dependency Graph Analysis
```bash
python -m agentpilot.cli analyze
```

### Run the 14-Step Judge Demo Flow
```bash
python -m agentpilot.cli demo
```

---

## Claude Desktop MCP Integration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentpilot": {
      "command": "python",
      "args": ["-m", "agentpilot.mcp_server"],
      "env": {}
    }
  }
}
```

Now Claude can inspect your project graph, find blockers, and generate optimized schedules through AgentPilot's 15 typed tools!

---

## Programmatic Usage

```python
from agentpilot import WebMCPTools, AutonomousEngine, AgentFleet

# Initialize WebMCP toolset
tools = WebMCPTools()

# Run dependency analysis
analysis = tools.tool_analyze_dependencies({})
print("Critical path:", analysis["criticalPath"])

# Run autonomous agent reasoning flow
engine = AutonomousEngine(tools)
result = engine.execute_flow("Can we launch Friday?")
print("Agent Assessment:", result["answer"])
```

---

## Testing

```bash
python -m unittest discover -s python/tests
```
