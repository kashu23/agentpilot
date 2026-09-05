from setuptools import setup, find_packages

setup(
    name="agentpilot",
    version="0.2.0",
    description="Python SDK and MCP Server for AgentPilot WebMCP Command Center",
    author="AgentPilot Team",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],
    entry_points={
        "console_scripts": [
            "agentpilot=agentpilot.cli:main",
            "agentpilot-mcp=agentpilot.mcp_server:main",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
)
