"""Unit tests for AgentPilot Python SDK."""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agentpilot.models import Task, Milestone, ProjectState
from agentpilot.tools import WebMCPTools
from agentpilot.engine import AutonomousEngine
from agentpilot.fleet import AgentFleet
from agentpilot.mcp_server import MCPServer


class TestAgentPilot(unittest.TestCase):
    def setUp(self):
        self.tools = WebMCPTools()

    def test_default_project_state(self):
        state = self.tools.tool_get_project_state({})
        self.assertEqual(state["project"]["name"], "Launch Nova")
        self.assertGreater(state["summary"]["totalTasks"], 5)
        self.assertIn("blocked", state["summary"])

    def test_get_tasks_filtering(self):
        marketing_tasks = self.tools.tool_get_tasks({"category": "marketing"})
        for t in marketing_tasks["tasks"]:
            self.assertEqual(t["category"], "marketing")

    def test_cycle_detection(self):
        deps = self.tools.tool_analyze_dependencies({})
        self.assertFalse(deps["hasCycles"])
        self.assertIn("testing", deps["criticalPath"])

    def test_create_and_delete_task(self):
        # Create
        created = self.tools.tool_create_task({
            "title": "New Unit Test Task",
            "category": "operations",
            "priority": "high",
        })
        self.assertTrue(created["success"])
        task_id = created["task"]["id"]

        # Delete without approval (should generate proposal)
        res = self.tools.tool_delete_task({"taskId": task_id}, allow_consequential=False)
        self.assertTrue(res["requiresApproval"])
        self.assertIn("proposal", res)

        # Delete with approval
        del_res = self.tools.tool_delete_task({"taskId": task_id}, allow_consequential=True)
        self.assertTrue(del_res["success"])

    def test_generate_plan_consequential_gate(self):
        plan_res = self.tools.tool_generate_plan({}, allow_consequential=False)
        self.assertTrue(plan_res["requiresApproval"])
        self.assertIn("proposal", plan_res)
        proposal_id = plan_res["proposal"]["id"]

        # Apply approval
        applied = self.tools.apply_proposal(proposal_id)
        self.assertTrue(applied)

    def test_autonomous_engine_execution(self):
        engine = AutonomousEngine(self.tools)
        flow_result = engine.execute_flow("Can we launch Friday?")
        self.assertEqual(flow_result["status"], "complete")
        self.assertEqual(len(flow_result["trace"]), 5)
        self.assertIn("estimate_timeline", flow_result["trace"])

    def test_reactive_conflict_listener(self):
        engine = AutonomousEngine(self.tools)
        # Deployment depends on testing (Sep 4). Moving deployment to Sep 1 violates prerequisite.
        conflict = engine.check_conflict("deployment", "2026-09-01")
        self.assertIsNotNone(conflict)
        self.assertTrue(conflict["conflict"])

    def test_agent_fleet_synthesis(self):
        fleet = AgentFleet(self.tools)
        review = fleet.run_collaborative_review()
        self.assertIn("launchRisk", review)
        self.assertEqual(len(review["agentsParticipated"]), 4)

    def test_mcp_server_initialize_and_tools_list(self):
        server = MCPServer(self.tools)
        init_res = server.handle_request({"jsonrpc": "2.0", "id": 1, "method": "initialize"})
        self.assertIn("capabilities", init_res["result"])

        list_res = server.handle_request({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        tools_list = list_res["result"]["tools"]
        self.assertEqual(len(tools_list), 15)

        call_res = server.handle_request({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {"name": "estimate_timeline", "arguments": {}},
        })
        self.assertFalse(call_res["result"]["isError"])


if __name__ == "__main__":
    unittest.main()
