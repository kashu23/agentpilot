"""Client for interacting with AgentPilot WebMCP REST endpoints."""

from __future__ import annotations
import urllib.request
import urllib.error
import json
from typing import Dict, Any, Optional


class AgentPilotClient:
    """Python client for connecting to AgentPilot WebMCP server."""

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json"}
        req_data = json.dumps(data).encode("utf-8") if data else None

        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.URLError as e:
            return {"error": str(e), "success": False}

    def get_tools(self) -> Dict[str, Any]:
        """Fetch registered WebMCP tools."""
        return self._request("GET", "/api/webmcp")

    def call_tool(self, tool_name: str, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a tool via WebMCP endpoint."""
        return self._request("POST", "/api/webmcp", {"toolName": tool_name, "input": input_data or {}})

    def get_project(self) -> Dict[str, Any]:
        """Fetch current project state."""
        return self._request("GET", "/api/projects")

    def ask_agent(self, query: str) -> Dict[str, Any]:
        """Ask agent reasoning engine a question."""
        return self._request("POST", "/api/agent", {"query": query})
