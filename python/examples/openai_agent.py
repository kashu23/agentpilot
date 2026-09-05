"""Example: Using OpenAI (GPT-4o / GPT-4o-mini) with AgentPilot WebMCP Tools.

Demonstrates how OpenAI models invoke AgentPilot's 15 WebMCP tools via Function Calling.
If OPENAI_API_KEY is not set, runs in simulated offline mode.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agentpilot.openai_bridge import OpenAIMCPBridge


def main():
    print("=" * 70)
    print("  AGENTPILOT: OPENAI AGENT & WEBMCP FUNCTION CALLING")
    print("=" * 70)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("\n[NOTE] OPENAI_API_KEY environment variable not found.")
        print("       Running in autonomous offline simulation mode.")
        print("       To use live GPT-4o, set: export OPENAI_API_KEY=your_key_here\n")

    bridge = OpenAIMCPBridge(model="gpt-4o-mini")
    user_query = "Can we launch Friday? Check the live WebMCP dependency graph and identify any blockers."

    print(f"[User Query] {user_query}\n")
    print("[Reasoning Trace]")

    def on_step(tool_name, arguments):
        print(f"  -> [CALL] OpenAI invoked WebMCP tool: `{tool_name}`")
        if arguments:
            print(f"            Arguments: {arguments}")

    result = bridge.chat(user_query, on_step=on_step)

    print("\n" + "=" * 70)
    print(f"  AGENT FINAL RESPONSE ({result.get('provider')})")
    print("=" * 70)
    print(result.get("answer"))
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
