"""Model Context Protocol (MCP) Standard Server for AgentPilot in Python.

Compatible with Anthropic Claude Desktop, Cursor, Antigravity, and MCP clients.
Communicates via JSON-RPC 2.0 over standard input / output (stdio).
"""

from __future__ import annotations
import sys
import json
import logging
from typing import Dict, Any, Optional

from .tools import WebMCPTools

logger = logging.getLogger("agentpilot.mcp")


class MCPServer:
    """Standard Model Context Protocol (MCP) server exposing AgentPilot WebMCP tools."""

    def __init__(self, tools: Optional[WebMCPTools] = None):
        self.tools = tools or WebMCPTools()

    def handle_request(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {
                        "name": "agentpilot-mcp-server",
                        "version": "0.2.0",
                    },
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {},
                    },
                },
            }

        elif method == "tools/list":
            tools_list = []
            for meta in WebMCPTools.TOOL_METADATA:
                tools_list.append({
                    "name": meta["name"],
                    "description": meta["description"],
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "taskId": {"type": "string", "description": "Target task identifier"},
                            "title": {"type": "string", "description": "Title of the task"},
                            "deadline": {"type": "string", "description": "YYYY-MM-DD deadline"},
                            "status": {"type": "string", "enum": ["todo", "in_progress", "blocked", "done"]},
                            "category": {"type": "string", "enum": ["product", "marketing", "operations"]},
                        },
                    },
                })
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"tools": tools_list},
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            try:
                result = self.tools.execute(tool_name, arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": json.dumps(result, indent=2)}
                        ],
                        "isError": False,
                    },
                }
            except Exception as e:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": f"Error executing tool '{tool_name}': {str(e)}"}
                        ],
                        "isError": True,
                    },
                }

        elif method == "notifications/initialized":
            return None

        elif method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}

        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method '{method}' not found"},
            }

    def run_stdio(self):
        """Run the JSON-RPC loop over sys.stdin and sys.stdout."""
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                res = self.handle_request(req)
                if res is not None:
                    sys.stdout.write(json.dumps(res) + "\n")
                    sys.stdout.flush()
            except Exception as e:
                err_res = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": f"Parse error: {str(e)}"},
                }
                sys.stdout.write(json.dumps(err_res) + "\n")
                sys.stdout.flush()


def main():
    server = MCPServer()
    server.run_stdio()


if __name__ == "__main__":
    main()
