"""Autonomous agent reasoning engine and reactive conflict listener."""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Callable
import time

from .tools import WebMCPTools
from .models import AgentStatus


class AutonomousEngine:
    """Simulates autonomous agent multi-step reasoning over WebMCP tools."""

    def __init__(self, tools: WebMCPTools):
        self.tools = tools
        self.status: AgentStatus = "idle"
        self._stopped = False
        self._paused = False

    def pause(self):
        self._paused = True
        self.status = "paused"

    def resume(self):
        self._paused = False
        self.status = "running"

    def stop(self):
        self._stopped = True
        self.status = "stopped"

    def execute_flow(self, query: str, on_step: Optional[Callable[[str, Dict[str, Any]], None]] = None) -> Dict[str, Any]:
        """Runs the autonomous reasoning loop through WebMCP tools."""
        self.status = "running"
        self._stopped = False
        self._paused = False
        trace: List[str] = []

        steps = [
            ("get_project_state", {}),
            ("get_tasks", {}),
            ("analyze_dependencies", {}),
            ("find_blockers", {}),
            ("estimate_timeline", {}),
        ]

        results = {}
        for tool_name, payload in steps:
            if self._stopped:
                self.status = "stopped"
                return {"status": "stopped", "trace": trace, "results": results}

            while self._paused:
                time.sleep(0.05)
                if self._stopped:
                    self.status = "stopped"
                    return {"status": "stopped", "trace": trace, "results": results}

            result = self.tools.execute(tool_name, payload)
            trace.append(tool_name)
            results[tool_name] = result

            if on_step:
                on_step(tool_name, result)

        self.status = "complete"
        answer = (
            "Based on the live WebMCP dependency graph, your Friday, Sept 4 launch is AT RISK. "
            "Production testing currently finishes on Thursday without safety buffer. "
            "Proposal: Advance QA to Wednesday Sep 2 and deployment to Thursday Sep 3 to restore a 24h stability window."
        )

        return {
            "status": "complete",
            "trace": trace,
            "answer": answer,
            "results": results,
            "health": results["get_project_state"]["summary"]["health"],
            "blockersCount": results["find_blockers"]["count"],
            "confidenceScore": results["estimate_timeline"]["confidenceScore"],
        }

    def check_conflict(self, changed_task_id: str, new_deadline: str) -> Optional[Dict[str, Any]]:
        """Reactive listener: checks if a human change introduced a schedule violation."""
        task_map = {t.id: t for t in self.tools.project.tasks}
        task = task_map.get(changed_task_id)
        if not task:
            return None

        for dep_id in task.dependencies:
            dep_task = task_map.get(dep_id)
            if dep_task and new_deadline < dep_task.deadline:
                return {
                    "conflict": True,
                    "message": f"Manual change conflict: '{task.title}' deadline ({new_deadline}) is earlier than prerequisite '{dep_task.title}' ({dep_task.deadline}).",
                    "offendingTask": task.title,
                    "prerequisiteTask": dep_task.title,
                }
        return None
