"""Data models for AgentPilot WebMCP Command Center."""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Literal

TaskStatus = Literal["todo", "in_progress", "blocked", "done"]
TaskPriority = Literal["low", "medium", "high", "critical"]
TaskCategory = Literal["product", "marketing", "operations"]
ProposalStatus = Literal["pending", "approved", "rejected"]
AgentStatus = Literal["idle", "running", "paused", "stopped", "complete"]


@dataclass
class Task:
    id: str
    title: str
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    owner: str = "Unassigned"
    deadline: str = "2026-09-04"
    dependencies: List[str] = field(default_factory=list)
    category: TaskCategory = "product"
    x: float = 0.0
    y: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Task:
        return cls(
            id=data["id"],
            title=data["title"],
            status=data.get("status", "todo"),
            priority=data.get("priority", "medium"),
            owner=data.get("owner", "Unassigned"),
            deadline=data.get("deadline", "2026-09-04"),
            dependencies=list(data.get("dependencies", [])),
            category=data.get("category", "product"),
            x=float(data.get("x", 0.0)),
            y=float(data.get("y", 0.0)),
        )


@dataclass
class Milestone:
    id: str
    title: str
    target_date: str
    status: str = "pending"
    progress: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Milestone:
        return cls(
            id=data["id"],
            title=data["title"],
            target_date=data["target_date"],
            status=data.get("status", "pending"),
            progress=int(data.get("progress", 0)),
        )


@dataclass
class ProjectState:
    id: str
    name: str
    target_launch_date: str
    milestones: List[Milestone] = field(default_factory=list)
    tasks: List[Task] = field(default_factory=list)
    health: str = "on_track"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "targetLaunchDate": self.target_launch_date,
            "milestones": [m.to_dict() for m in self.milestones],
            "tasks": [t.to_dict() for t in self.tasks],
            "health": self.health,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> ProjectState:
        return cls(
            id=data["id"],
            name=data["name"],
            target_launch_date=data.get("targetLaunchDate", data.get("target_launch_date", "2026-09-04")),
            milestones=[Milestone.from_dict(m) for m in data.get("milestones", [])],
            tasks=[Task.from_dict(t) for t in data.get("tasks", [])],
            health=data.get("health", "on_track"),
        )


@dataclass
class Proposal:
    id: str
    tool: str
    summary: str
    rationale: str
    payload: Dict[str, Any]
    status: ProposalStatus = "pending"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ToolActivity:
    id: str
    tool: str
    input: Dict[str, Any]
    result: str
    status: str
    time: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AgentRecord:
    id: str
    name: str
    role: str
    status: str
    current_focus: str
    last_action: str
    confidence: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
