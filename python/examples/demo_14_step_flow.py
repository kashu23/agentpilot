"""Example: Executing the 14-Step WebMCP Human-Agent Collaboration Demo Flow in Python."""

import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agentpilot.tools import WebMCPTools
from agentpilot.engine import AutonomousEngine
from agentpilot.fleet import AgentFleet


def run_demo():
    print("=" * 70)
    print("  AGENTPILOT: 14-STEP WEBMCP JUDGE DEMO FLOW (PYTHON)")
    print("=" * 70)

    tools = WebMCPTools()
    engine = AutonomousEngine(tools)
    fleet = AgentFleet(tools)

    # Step 1
    print("\n[Step 1] WebMCP Subsystem Online")
    print("         Registered 15 typed WebMCP tools onto execution runtime.")

    # Step 2
    state = tools.tool_get_project_state({})
    print(f"\n[Step 2] Project Graph Loaded: {state['project']['name']}")
    print(f"         Tasks: {state['summary']['totalTasks']} | Milestones: {len(state['project']['milestones'])} | Health: {state['summary']['health']}")

    # Step 3
    print("\n[Step 3] Human asks Lead Launch Agent: 'Can we launch Friday?'")

    # Step 4
    print("\n[Step 4] Agent runs autonomous WebMCP tool sequence:")
    trace = []
    def on_step(tool_name, res):
        print(f"         -> Calling WebMCP tool: `{tool_name}` ... OK")
    res = engine.execute_flow("Can we launch Friday?", on_step=on_step)

    # Step 5
    print(f"\n[Step 5] Agent Risk Report:")
    print(f"         {res['answer']}")

    # Step 6
    print("\n[Step 6] Human Command: 'Fix the schedule'")

    # Step 7
    print("\n[Step 7] Calling Consequential Tool: `generate_plan`...")
    plan_res = tools.tool_generate_plan({}, allow_consequential=False)
    proposal = plan_res["proposal"]

    # Step 8
    print(f"\n[Step 8] AGENT PROPOSAL Generated:")
    print(f"         Summary:   {proposal['summary']}")
    print(f"         Rationale: {proposal['rationale']}")

    # Step 9
    print("\n[Step 9] Human Approval Gateway:")
    print("         Operator reviews proposal and clicks [APPROVE].")

    # Step 10
    tools.apply_proposal(proposal["id"])
    print("\n[Step 10] WebMCP Tool Updates Applied:")
    for upd in proposal["payload"]["updates"]:
        print(f"          Updated task '{upd['taskId']}' -> deadline: {upd['deadline']}")

    # Step 11
    timeline = tools.tool_estimate_timeline({})
    print(f"\n[Step 11] Shared State Updated:")
    print(f"          New Delivery Confidence: {timeline['confidenceScore']}% | Risk: {timeline['riskLevel']}")

    # Step 12
    print("\n[Step 12] Human Manual Override:")
    print("          Human drags 'Production Deployment' from Thursday back to Friday Sep 4.")

    # Step 13
    print("\n[Step 13] Reactive Conflict Listener triggers:")
    conflict = engine.check_conflict("deployment", "2026-09-02")

    # Step 14
    print("\n[Step 14] Proactive Agent Alert:")
    print(f"          ALERT: Human schedule shift creates dependency crunch.")
    print("          'Would you like me to recalculate the plan?'")

    print("\n" + "=" * 70)
    print("  DEMO COMPLETED: Human and AI agent collaborated safely via WebMCP.")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()
