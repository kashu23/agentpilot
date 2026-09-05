"""AgentPilot Python SDK - WebMCP Command Center for Humans & AI Agents."""

__version__ = "0.2.0"
__author__ = "AgentPilot Team"

from .models import Task, Milestone, ProjectState, Proposal, ToolActivity, AgentRecord
from .tools import WebMCPTools, ToolExecutionError, ConsequentialActionError
from .fleet import AgentFleet
from .engine import AutonomousEngine
from .client import AgentPilotClient
from .mcp_server import MCPServer
from .openai_bridge import OpenAIMCPBridge

__all__ = [
    "Task",
    "Milestone",
    "ProjectState",
    "Proposal",
    "ToolActivity",
    "AgentRecord",
    "WebMCPTools",
    "ToolExecutionError",
    "ConsequentialActionError",
    "AgentFleet",
    "AutonomousEngine",
    "AgentPilotClient",
    "MCPServer",
    "OpenAIMCPBridge",
]
