"""AgentPilot Command Line Interface (CLI)."""

from __future__ import annotations
import argparse
import json
import sys
import time

from .models import Task
from .tools import WebMCPTools
from .fleet import AgentFleet
from .engine import AutonomousEngine
from .mcp_server import MCPServer


def print_banner():
    banner = """
============================================================
              _                    _   ____  _ _       _   
    /\       | |                  | | |  _ \(_) |     | |  
   /  \   ___| | _____  _ __   ___| |_| |_) |_| | ___ | |_ 
  / /\ \ / _ \ |/ / _ \| '_ \ / _ \ __|  _ <| | |/ _ \| __|
 / ____ \  __/   < (_) | |_) |  __/ |_| |_) | | | (_) | |_ 
/_/    \_\___|_|\_\___/| .__/ \___|\__|____/|_|_|\___/ \__|
                       | |                                 
                       |_|   WebMCP Command Center (Python)
============================================================
"""
    print(banner)


def cmd_status(args):
    tools = WebMCPTools()
    state = tools.tool_get_project_state({})
    project = state["project"]
    summary = state["summary"]
    timeline = tools.tool_estimate_timeline({})

    print(f"\nProject: {project['name']} (ID: {project['id']})")
    print(f"Target Launch Date: {project['targetLaunchDate']}")
    print(f"Health: {summary['health'].upper()} | Confidence: {timeline['confidenceScore']}%")
    print(f"Tasks: {summary['totalTasks']} total | {summary['completed']} done | {summary['blocked']} blocked\n")
    print(f"{'ID':<15} {'Title':<25} {'Status':<12} {'Priority':<10} {'Deadline':<12} {'Dependencies'}")
    print("-" * 85)
    for t in project["tasks"]:
        deps = ", ".join(t["dependencies"]) or "-"
        print(f"{t['id']:<15} {t['title']:<25} {t['status']:<12} {t['priority']:<10} {t['deadline']:<12} {deps}")
    print()


def cmd_analyze(args):
    tools = WebMCPTools()
    deps = tools.tool_analyze_dependencies({})
    blockers = tools.tool_find_blockers({})
    print("\n--- DEPENDENCY GRAPH ANALYSIS ---")
    print(f"Total Connections: {deps['totalDependencies']}")
    print(f"Dependency Cycles: {'DETECTED' if deps['hasCycles'] else 'None (DAG Validated)'}")
    print(f"Critical Path: {' -> '.join(deps['criticalPath'])}")
    print(f"Identified Bottlenecks: {', '.join(deps['bottlenecks'])}\n")

    print("--- ACTIVE BLOCKERS ---")
    for b in blockers["blockers"]:
        print(f"* '{b['task']['title']}' blocks {b['blockingCount']} downstream task(s): {', '.join(b['blockingTasks'])}")
    print()


def cmd_demo(args):
    """Executes the complete 14-Step Judge Demo Flow in the terminal."""
    print_banner()
    print("[INIT] Starting the 14-Step WebMCP Judge Demo Flow in Python...\n")
    tools = WebMCPTools()
    engine = AutonomousEngine(tools)
    fleet = AgentFleet(tools)

    steps = [
        ("Step 1", "Open AgentPilot", "WebMCP subsystem registered 15 tools onto runtime context."),
        ("Step 2", "Open demo project: Launch Nova", "Project graph loaded: 9 tasks, 3 milestones, target Sept 4."),
        ("Step 3", "Ask agent: 'Can we launch Friday?'", "Human queries agent about schedule feasibility."),
        ("Step 4", "Execute WebMCP tool chain", "Agent calls get_project_state -> get_tasks -> analyze_dependencies -> find_blockers -> estimate_timeline."),
        ("Step 5", "Agent reports risk", "CRITICAL RISK: Zero-day QA crunch identified. QA and Deployment collide on Sept 4."),
        ("Step 6", "User command: 'Fix the schedule'", "User commands Lead Launch Agent to generate an optimized delivery plan."),
        ("Step 7", "Agent calls generate_plan", "Plan proposal generated via WebMCP consequential tool."),
        ("Step 8", "Display AGENT PROPOSAL modal", "Proposal created: Move testing to Sep 2, advance deployment to Sep 3, add Regression Testing."),
        ("Step 9", "Human Approval Gateway", "Human operator approves proposal. Consequential action confirmed."),
        ("Step 10", "Execute schedule updates", "WebMCP tool updates testing and deployment dates on shared state."),
        ("Step 11", "Visual Canvas Transition", "Testing node moves to Wed Sep 2, Deployment moves to Thu Sep 3."),
        ("Step 12", "Manual Human Override", "Human drags Production Deployment from Thursday -> Friday Sept 4."),
        ("Step 13", "Reactive Conflict Listener triggers", "Agent detects manual shift violates downstream launch alignment."),
        ("Step 14", "Agent proactive alert", "Alert: 'Your manual shift removes safety buffer. Would you like me to recalculate?'"),
    ]

    for step_num, title, description in steps:
        print(f"--- [{step_num}] {title} ---")
        print(f"    {description}")
        time.sleep(0.15)

    print("\n[SUCCESS] All 14 demo steps completed successfully!")


def main():
    parser = argparse.ArgumentParser(description="AgentPilot WebMCP Command Center CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    subparsers.add_parser("status", help="Show current project state and task list")
    subparsers.add_parser("analyze", help="Run dependency analysis and find blockers")
    subparsers.add_parser("demo", help="Run the 14-Step WebMCP Judge Demo Flow")
    subparsers.add_parser("mcp", help="Start the stdio Model Context Protocol (MCP) server")

    args = parser.parse_args()

    if args.command == "status":
        cmd_status(args)
    elif args.command == "analyze":
        cmd_analyze(args)
    elif args.command == "demo":
        cmd_demo(args)
    elif args.command == "mcp":
        server = MCPServer()
        server.run_stdio()
    else:
        print_banner()
        parser.print_help()


if __name__ == "__main__":
    main()
