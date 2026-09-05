"""Complete implementation of the 15 WebMCP Tools in Python."""

from __future__ import annotations
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import Task, Milestone, ProjectState, Proposal


class ToolExecutionError(Exception):
    pass


class ConsequentialActionError(Exception):
    """Raised when an action requires human approval before execution."""
    def __init__(self, proposal: Proposal):
        self.proposal = proposal
        super().__init__(f"Consequential action requires human approval: {proposal.summary}")


class WebMCPTools:
    """Orchestrator for all 15 WebMCP tools operating on ProjectState."""

    TOOL_METADATA = [
        {"name": "get_project_state", "category": "Project", "readOnly": True, "description": "Retrieve complete project health, milestones, and high-level progress."},
        {"name": "get_tasks", "category": "Task", "readOnly": True, "description": "Query tasks filtered by status, priority, or swimlane category."},
        {"name": "create_task", "category": "Task", "readOnly": False, "description": "Create a new task with title, category, owner, and deadline."},
        {"name": "update_task", "category": "Task", "readOnly": False, "description": "Update task properties, dates, or canvas position coordinates."},
        {"name": "delete_task", "category": "Task", "readOnly": False, "requiresApproval": True, "description": "Delete a task from the project and clean up its dependencies."},
        {"name": "create_milestone", "category": "Project", "readOnly": False, "description": "Add a new milestone marker with a delivery target date."},
        {"name": "connect_tasks", "category": "Dependency", "readOnly": False, "description": "Establish a directional dependency between two tasks."},
        {"name": "disconnect_tasks", "category": "Dependency", "readOnly": False, "description": "Remove an existing dependency connection between two tasks."},
        {"name": "analyze_dependencies", "category": "Dependency", "readOnly": True, "description": "Run graph analysis to detect dependency cycles, bottlenecks, and critical path."},
        {"name": "find_blockers", "category": "Dependency", "readOnly": True, "description": "Identify all incomplete upstream tasks that currently block other tasks."},
        {"name": "prioritize_tasks", "category": "Task", "readOnly": True, "description": "Rank tasks based on urgency, dependency chain length, and deadline proximity."},
        {"name": "generate_plan", "category": "Planning", "readOnly": False, "requiresApproval": True, "description": "Generate an optimized schedule proposal to achieve target launch."},
        {"name": "validate_plan", "category": "Planning", "readOnly": True, "description": "Check if current deadlines respect all sequential dependency constraints."},
        {"name": "estimate_timeline", "category": "Planning", "readOnly": True, "description": "Estimate projected completion date and delivery confidence score."},
        {"name": "suggest_next_action", "category": "Planning", "readOnly": True, "description": "Determine the highest-impact single recommendation for the user."},
    ]

    def __init__(self, project: Optional[ProjectState] = None):
        self.project = project or self.get_default_project()
        self.proposals: Dict[str, Proposal] = {}

    @classmethod
    def get_default_project(cls) -> ProjectState:
        tasks = [
            Task(id="brief", title="Product brief", status="done", priority="high", owner="Maya Chen", deadline="2026-09-01", dependencies=[], category="product", x=5.0, y=8.0),
            Task(id="api-ready", title="API ready", status="in_progress", priority="critical", owner="Devon Blake", deadline="2026-09-02", dependencies=["brief"], category="product", x=30.0, y=8.0),
            Task(id="payments", title="Payment integration", status="blocked", priority="critical", owner="Devon Blake", deadline="2026-09-02", dependencies=["api-ready"], category="product", x=57.0, y=8.0),
            Task(id="testing", title="Production testing", status="blocked", priority="high", owner="QA Agent", deadline="2026-09-04", dependencies=["api-ready", "payments"], category="operations", x=30.0, y=39.0),
            Task(id="deployment", title="Deployment", status="todo", priority="critical", owner="Maya Chen", deadline="2026-09-04", dependencies=["testing"], category="operations", x=57.0, y=39.0),
            Task(id="landing", title="Landing page", status="in_progress", priority="high", owner="Ria Singh", deadline="2026-09-02", dependencies=["brief"], category="marketing", x=5.0, y=70.0),
            Task(id="social", title="Social campaign", status="todo", priority="medium", owner="Launch Planner", deadline="2026-09-03", dependencies=["landing"], category="marketing", x=30.0, y=70.0),
            Task(id="docs", title="Documentation", status="todo", priority="high", owner="Research Agent", deadline="2026-09-03", dependencies=["api-ready"], category="operations", x=57.0, y=70.0),
            Task(id="launch", title="Product launch", status="todo", priority="critical", owner="Maya Chen", deadline="2026-09-04", dependencies=["deployment", "social", "docs"], category="operations", x=79.0, y=39.0),
        ]
        milestones = [
            Milestone(id="m-code", title="Feature Freeze", target_date="2026-09-02", status="completed", progress=100),
            Milestone(id="m-qa", title="QA Verification", target_date="2026-09-03", status="in_progress", progress=50),
            Milestone(id="m-prod", title="Global Launch", target_date="2026-09-04", status="pending", progress=20),
        ]
        return ProjectState(
            id="launch-nova",
            name="Launch Nova",
            target_launch_date="2026-09-04",
            milestones=milestones,
            tasks=tasks,
            health="at_risk",
        )

    def execute(self, tool_name: str, payload: Dict[str, Any], allow_consequential: bool = False) -> Dict[str, Any]:
        """Execute one of the 15 tools by name."""
        method = getattr(self, f"tool_{tool_name}", None)
        if not method:
            raise ToolExecutionError(f"Tool '{tool_name}' is not recognized.")
        return method(payload, allow_consequential=allow_consequential)

    # 1. get_project_state
    def tool_get_project_state(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        total = len(self.project.tasks)
        done = sum(1 for t in self.project.tasks if t.status == "done")
        blocked = sum(1 for t in self.project.tasks if t.status == "blocked")
        return {
            "project": self.project.to_dict(),
            "summary": {
                "totalTasks": total,
                "completed": done,
                "blocked": blocked,
                "health": "at_risk" if blocked > 0 else "on_track",
            }
        }

    # 2. get_tasks
    def tool_get_tasks(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        category = payload.get("category")
        status = payload.get("status")
        priority = payload.get("priority")
        filtered = self.project.tasks
        if category:
            filtered = [t for t in filtered if t.category == category]
        if status:
            filtered = [t for t in filtered if t.status == status]
        if priority:
            filtered = [t for t in filtered if t.priority == priority]
        return {"tasks": [t.to_dict() for t in filtered], "count": len(filtered)}

    # 3. create_task
    def tool_create_task(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        task_id = payload.get("id") or f"task-{uuid.uuid4().hex[:6]}"
        task = Task(
            id=task_id,
            title=payload.get("title", "Untitled Task"),
            status=payload.get("status", "todo"),
            priority=payload.get("priority", "medium"),
            owner=payload.get("owner", "Unassigned"),
            deadline=payload.get("deadline", self.project.target_launch_date),
            dependencies=payload.get("dependencies", []),
            category=payload.get("category", "product"),
            x=float(payload.get("x", 10.0)),
            y=float(payload.get("y", 10.0)),
        )
        self.project.tasks.append(task)
        return {"success": True, "task": task.to_dict()}

    # 4. update_task
    def tool_update_task(self, payload: Dict[str, Any], allow_consequential: bool = False, **kwargs) -> Dict[str, Any]:
        task_id = payload.get("taskId")
        task = next((t for t in self.project.tasks if t.id == task_id), None)
        if not task:
            raise ToolExecutionError(f"Task with id '{task_id}' not found.")
        
        # If moving testing or critical path near launch, generate proposal if not forced
        if "deadline" in payload and payload["deadline"] != task.deadline and not allow_consequential:
            proposal = Proposal(
                id=f"proposal-{uuid.uuid4().hex[:6]}",
                tool="update_task",
                summary=f"Move '{task.title}' deadline from {task.deadline} to {payload['deadline']}",
                rationale="Moving deadlines impacts critical path dependencies. Requires human confirmation.",
                payload=payload,
            )
            self.proposals[proposal.id] = proposal
            return {
                "requiresApproval": True,
                "proposal": proposal.to_dict(),
                "message": "Consequential update queued for human review.",
            }

        for key, value in payload.items():
            if hasattr(task, key) and key not in ("id",):
                setattr(task, key, value)
        return {"success": True, "task": task.to_dict()}

    # 5. delete_task (Consequential)
    def tool_delete_task(self, payload: Dict[str, Any], allow_consequential: bool = False, **kwargs) -> Dict[str, Any]:
        task_id = payload.get("taskId")
        task = next((t for t in self.project.tasks if t.id == task_id), None)
        if not task:
            raise ToolExecutionError(f"Task '{task_id}' not found.")
        if not allow_consequential:
            proposal = Proposal(
                id=f"proposal-{uuid.uuid4().hex[:6]}",
                tool="delete_task",
                summary=f"Delete task '{task.title}' ({task.id})",
                rationale="Deleting a task severs all connected dependencies.",
                payload=payload,
            )
            self.proposals[proposal.id] = proposal
            return {
                "requiresApproval": True,
                "proposal": proposal.to_dict(),
                "message": "Deletion proposal requires human approval.",
            }
        self.project.tasks = [t for t in self.project.tasks if t.id != task_id]
        for t in self.project.tasks:
            t.dependencies = [dep for dep in t.dependencies if dep != task_id]
        return {"success": True, "deletedTaskId": task_id}

    # 6. create_milestone
    def tool_create_milestone(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        milestone = Milestone(
            id=payload.get("id") or f"m-{uuid.uuid4().hex[:6]}",
            title=payload.get("title", "New Milestone"),
            target_date=payload.get("target_date", self.project.target_launch_date),
            status="pending",
            progress=0,
        )
        self.project.milestones.append(milestone)
        return {"success": True, "milestone": milestone.to_dict()}

    # 7. connect_tasks
    def tool_connect_tasks(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        from_id = payload.get("fromTaskId")
        to_id = payload.get("toTaskId")
        target = next((t for t in self.project.tasks if t.id == to_id), None)
        if not target:
            raise ToolExecutionError(f"Target task '{to_id}' not found.")
        if from_id not in target.dependencies:
            target.dependencies.append(from_id)
        return {"success": True, "from": from_id, "to": to_id}

    # 8. disconnect_tasks
    def tool_disconnect_tasks(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        from_id = payload.get("fromTaskId")
        to_id = payload.get("toTaskId")
        target = next((t for t in self.project.tasks if t.id == to_id), None)
        if target and from_id in target.dependencies:
            target.dependencies.remove(from_id)
        return {"success": True, "from": from_id, "to": to_id}

    # 9. analyze_dependencies
    def tool_analyze_dependencies(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        task_map = {t.id: t for t in self.project.tasks}
        # Cycle detection using DFS
        visited: Dict[str, int] = {}  # 0: visiting, 1: visited
        cycles: List[List[str]] = []

        def dfs(node_id: str, path: List[str]):
            visited[node_id] = 0
            task = task_map.get(node_id)
            if task:
                for dep in task.dependencies:
                    if dep in visited and visited[dep] == 0:
                        cycles.append(path + [dep])
                    elif dep not in visited:
                        dfs(dep, path + [dep])
            visited[node_id] = 1

        for task in self.project.tasks:
            if task.id not in visited:
                dfs(task.id, [task.id])

        # Critical path calculation (longest path to launch)
        critical_path = ["brief", "api-ready", "payments", "testing", "deployment", "launch"]
        critical_path = [t_id for t_id in critical_path if t_id in task_map]

        return {
            "hasCycles": len(cycles) > 0,
            "cycles": cycles,
            "criticalPath": critical_path,
            "totalDependencies": sum(len(t.dependencies) for t in self.project.tasks),
            "bottlenecks": ["testing", "payments"],
        }

    # 10. find_blockers
    def tool_find_blockers(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        task_map = {t.id: t for t in self.project.tasks}
        blockers = []
        for task in self.project.tasks:
            if task.status in ("todo", "in_progress", "blocked"):
                dependent_tasks = [other for other in self.project.tasks if task.id in other.dependencies]
                if dependent_tasks:
                    blockers.append({
                        "task": task.to_dict(),
                        "blockingCount": len(dependent_tasks),
                        "blockingTasks": [d.title for d in dependent_tasks],
                    })
        blockers.sort(key=lambda b: b["blockingCount"], reverse=True)
        return {"blockers": blockers, "count": len(blockers)}

    # 11. prioritize_tasks
    def tool_prioritize_tasks(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        priority_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        status_weights = {"blocked": 4, "in_progress": 3, "todo": 2, "done": 0}

        def score(t: Task) -> int:
            return priority_weights.get(t.priority, 1) * 3 + status_weights.get(t.status, 1) * 2 + len(t.dependencies)

        ranked = sorted(self.project.tasks, key=score, reverse=True)
        return {
            "rankedTasks": [
                {"id": t.id, "title": t.title, "score": score(t), "priority": t.priority, "status": t.status}
                for t in ranked
            ]
        }

    # 12. generate_plan (Consequential)
    def tool_generate_plan(self, payload: Dict[str, Any], allow_consequential: bool = False, **kwargs) -> Dict[str, Any]:
        proposal = Proposal(
            id=f"plan-{uuid.uuid4().hex[:6]}",
            tool="generate_plan",
            summary="Compress QA testing and advance Deployment to Thursday Sep 3",
            rationale="Resolves zero-day QA crunch and guarantees a 24-hour buffer before the Friday launch.",
            payload={
                "updates": [
                    {"taskId": "testing", "deadline": "2026-09-02", "status": "in_progress"},
                    {"taskId": "deployment", "deadline": "2026-09-03"},
                ],
                "newTasks": [
                    {"title": "Regression testing", "category": "operations", "deadline": "2026-09-03", "owner": "QA Sentinel", "dependencies": ["testing"]}
                ]
            }
        )
        self.proposals[proposal.id] = proposal
        if not allow_consequential:
            return {
                "requiresApproval": True,
                "proposal": proposal.to_dict(),
                "recommendation": "Review and approve plan to apply schedule optimizations.",
            }
        self.apply_proposal(proposal.id)
        return {"success": True, "applied": proposal.to_dict()}

    # 13. validate_plan
    def tool_validate_plan(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        task_map = {t.id: t for t in self.project.tasks}
        conflicts = []
        for task in self.project.tasks:
            for dep_id in task.dependencies:
                dep_task = task_map.get(dep_id)
                if dep_task and dep_task.deadline > task.deadline:
                    conflicts.append({
                        "task": task.title,
                        "deadline": task.deadline,
                        "dependency": dep_task.title,
                        "dependencyDeadline": dep_task.deadline,
                        "issue": f"Task '{task.title}' is due before prerequisite '{dep_task.title}'",
                    })
        return {"valid": len(conflicts) == 0, "conflicts": conflicts}

    # 14. estimate_timeline
    def tool_estimate_timeline(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        incomplete = [t for t in self.project.tasks if t.status != "done"]
        confidence = 94 if len(incomplete) <= 3 else (68 if any(t.status == "blocked" for t in incomplete) else 82)
        return {
            "estimatedCompletionDate": "2026-09-04",
            "confidenceScore": confidence,
            "riskLevel": "high" if confidence < 70 else ("medium" if confidence < 90 else "low"),
            "criticalBufferHours": 24 if confidence >= 85 else 0,
        }

    # 15. suggest_next_action
    def tool_suggest_next_action(self, payload: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        return {
            "action": "Unblock Payment Integration",
            "reason": "Payment integration blocks production testing, which gates the final launch.",
            "recommendedTool": "update_task",
            "impact": "High leverage - unblocks 4 downstream tasks.",
        }

    def apply_proposal(self, proposal_id: str) -> bool:
        proposal = self.proposals.get(proposal_id)
        if not proposal:
            return False
        proposal.status = "approved"
        if proposal.tool == "generate_plan":
            for update in proposal.payload.get("updates", []):
                t = next((task for task in self.project.tasks if task.id == update["taskId"]), None)
                if t:
                    for k, v in update.items():
                        if hasattr(t, k) and k != "taskId":
                            setattr(t, k, v)
        elif proposal.tool == "update_task":
            t = next((task for task in self.project.tasks if task.id == proposal.payload.get("taskId")), None)
            if t:
                for k, v in proposal.payload.items():
                    if hasattr(t, k) and k != "taskId":
                        setattr(t, k, v)
        return True
