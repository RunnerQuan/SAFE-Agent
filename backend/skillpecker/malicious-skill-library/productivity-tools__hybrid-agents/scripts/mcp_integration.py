"""
MCP Tool Integration

Model Context Protocol integration for Azure AI Foundry agents.
Supports Microsoft Learn and other MCP servers.
"""

import os
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class MCPSearchResult:
    """Result from MCP search."""
    query: str
    results: List[Dict[str, Any]]
    run_status: str


class MCPAgentClient:
    """
    MCP-enabled agent client for Azure AI Foundry.

    Integrates with Microsoft Learn MCP server and other MCP endpoints.
    """

    # Known MCP servers
    MCP_SERVERS = {
        "microsoft_learn": {
            "url": "https://learn.microsoft.com/api/mcp",
            "tools": ["microsoft_docs_search", "microsoft_docs_fetch", "microsoft_code_sample_search"],
            "auth_required": False,
        },
        "github_copilot": {
            "url": "https://api.githubcopilot.com/mcp/",
            "tools": ["*"],  # All tools
            "auth_required": True,
        },
        "github_readonly": {
            "url": "https://api.githubcopilot.com/mcp/readonly",
            "tools": ["*"],
            "auth_required": True,
        },
    }

    def __init__(
        self,
        project_endpoint: Optional[str] = None,
        model_deployment: Optional[str] = None,
    ):
        """
        Initialize MCP client.

        Args:
            project_endpoint: AI Foundry project endpoint (or PROJECT_ENDPOINT env var)
            model_deployment: Model deployment name (or MODEL_DEPLOYMENT_NAME env var)
        """
        self.project_endpoint = project_endpoint or os.environ.get(
            "PROJECT_ENDPOINT",
            os.environ.get("AZURE_AI_PROJECT_ENDPOINT")
        )
        self.model_deployment = model_deployment or os.environ.get(
            "MODEL_DEPLOYMENT_NAME",
            os.environ.get("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4o-mini")
        )

        if not self.project_endpoint:
            raise ValueError("PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT is required")

        self._client = None

    @property
    def client(self):
        """Lazy-load the AgentsClient."""
        if self._client is None:
            from azure.ai.agents import AgentsClient
            from azure.identity import DefaultAzureCredential

            # AgentsClient requires TokenCredential, use DefaultAzureCredential
            # User must run 'az login' first for authentication
            self._client = AgentsClient(
                endpoint=self.project_endpoint,
                credential=DefaultAzureCredential(),
            )

        return self._client

    def search_microsoft_docs(
        self,
        query: str,
        auto_approve: bool = True,
        allowed_tools: Optional[List[str]] = None,
    ) -> MCPSearchResult:
        """
        Search Microsoft documentation using MCP.

        Args:
            query: Search query
            auto_approve: Whether to auto-approve tool calls
            allowed_tools: Specific tools to allow (default: search and fetch)

        Returns:
            MCPSearchResult with search results
        """
        from azure.ai.agents.models import McpTool

        if allowed_tools is None:
            allowed_tools = ["microsoft_docs_search", "microsoft_docs_fetch"]

        # Configure MCP tool
        mcp_tool = McpTool(
            server_label="microsoft_learn",
            server_url=self.MCP_SERVERS["microsoft_learn"]["url"],
            allowed_tools=allowed_tools
        )

        if auto_approve:
            mcp_tool.set_approval_mode("never")

        agent = self.client.create_agent(
            model=self.model_deployment,
            name="DocsResearcher",
            instructions="""You are a Microsoft documentation expert.
            Use the MCP tools to search and fetch official Microsoft documentation.
            Always cite the source URLs in your responses.
            Provide concise, accurate answers.""",
            tools=mcp_tool.definitions,
        )

        try:
            # Create thread and run
            run = self.client.create_thread_and_process_run(
                agent_id=agent.id,
                body={
                    "messages": [{"role": "user", "content": query}],
                    "tool_resources": mcp_tool.resources if hasattr(mcp_tool, 'resources') else None
                }
            )

            # Get messages from the thread
            messages_response = self.client.messages.list(thread_id=run.thread_id)

            results = []
            for msg in messages_response:
                if hasattr(msg, 'content') and msg.content:
                    for content_item in msg.content:
                        if hasattr(content_item, 'text') and hasattr(content_item.text, 'value'):
                            results.append({
                                "role": msg.role,
                                "content": content_item.text.value
                            })
                            break

            return MCPSearchResult(
                query=query,
                results=results,
                run_status=run.status,
            )

        finally:
            self.client.delete_agent(agent.id)

    def _run_with_manual_approval(self, thread_id: str, agent_id: str, mcp_tool):
        """
        Run agent with manual MCP tool approval.

        Args:
            thread_id: Thread ID
            agent_id: Agent ID
            mcp_tool: MCP tool configuration

        Returns:
            Run result
        """
        from azure.ai.agents.models import (
            RequiredMcpToolCall,
            SubmitToolApprovalAction,
            ToolApproval,
        )

        run = self.client.runs.create(
            thread_id=thread_id,
            agent_id=agent_id,
            tool_resources=mcp_tool.resources if hasattr(mcp_tool, 'resources') else None
        )

        while run.status in ["queued", "in_progress", "requires_action"]:
            time.sleep(1)
            run = self.client.runs.get(thread_id=thread_id, run_id=run.id)

            if run.status == "requires_action":
                if isinstance(run.required_action, SubmitToolApprovalAction):
                    tool_calls = run.required_action.submit_tool_approval.tool_calls

                    tool_approvals = []
                    for tool_call in tool_calls:
                        if isinstance(tool_call, RequiredMcpToolCall):
                            print(f"Approving MCP tool: {tool_call.name}")
                            print(f"Arguments: {tool_call.arguments}")

                            tool_approvals.append(
                                ToolApproval(
                                    tool_call_id=tool_call.id,
                                    approve=True,
                                    headers=mcp_tool.headers if hasattr(mcp_tool, 'headers') else {},
                                )
                            )

                    if tool_approvals:
                        self.client.runs.submit_tool_outputs(
                            thread_id=thread_id,
                            run_id=run.id,
                            tool_approvals=tool_approvals
                        )

        return run

    def search_with_custom_mcp(
        self,
        server_url: str,
        server_label: str,
        query: str,
        allowed_tools: List[str],
        headers: Optional[Dict[str, str]] = None,
        auto_approve: bool = True,
    ) -> MCPSearchResult:
        """
        Search using a custom MCP server.

        Args:
            server_url: MCP server URL
            server_label: Label for the server
            query: Search query
            allowed_tools: List of allowed tool names
            headers: Optional authentication headers
            auto_approve: Whether to auto-approve tool calls

        Returns:
            MCPSearchResult with results
        """
        from azure.ai.agents.models import McpTool

        mcp_tool = McpTool(
            server_label=server_label,
            server_url=server_url,
            allowed_tools=allowed_tools,
        )

        if headers:
            for key, value in headers.items():
                mcp_tool.headers[key] = value

        if auto_approve:
            mcp_tool.set_approval_mode("never")

        agent = self.client.create_agent(
            model=self.model_deployment,
            name="MCPAgent",
            instructions=f"Use the {server_label} tools to answer questions accurately.",
            tools=mcp_tool.definitions,
        )

        try:
            run = self.client.create_thread_and_process_run(
                agent_id=agent.id,
                body={
                    "messages": [{"role": "user", "content": query}],
                    "tool_resources": mcp_tool.resources if hasattr(mcp_tool, 'resources') else None
                }
            )

            messages_response = self.client.messages.list(thread_id=run.thread_id)

            results = []
            for msg in messages_response:
                if hasattr(msg, 'content') and msg.content:
                    for content_item in msg.content:
                        if hasattr(content_item, 'text') and hasattr(content_item.text, 'value'):
                            results.append({
                                "role": msg.role,
                                "content": content_item.text.value
                            })
                            break

            return MCPSearchResult(
                query=query,
                results=results,
                run_status=run.status,
            )

        finally:
            self.client.delete_agent(agent.id)


if __name__ == "__main__":
    print("=" * 60)
    print("MCP Integration Client - Test")
    print("=" * 60)

    # Load from project root .env
    load_dotenv("C:/Users/User/Desktop/test/.env")

    # Check environment
    endpoint = os.environ.get("PROJECT_ENDPOINT") or os.environ.get("AZURE_AI_PROJECT_ENDPOINT")
    if not endpoint:
        print("\n[ERROR] PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT not set")
        print("Please configure .env with your Azure AI Foundry credentials")
        exit(1)

    try:
        client = MCPAgentClient()
        print(f"\n[OK] Client initialized")
        print(f"    Endpoint: {client.project_endpoint}")
        print(f"    Model: {client.model_deployment}")

        # Test Microsoft Learn search
        print("\n--- Testing Microsoft Learn MCP ---")
        print("Query: What is Azure AI Foundry Agent Service?")

        result = client.search_microsoft_docs(
            "What is Azure AI Foundry Agent Service? Give a brief overview."
        )

        print(f"[OK] Status: {result.run_status}")
        for msg in result.results:
            if msg['role'] == 'assistant':
                print(f"\nAssistant Response:")
                print(msg['content'][:500])
                if len(msg['content']) > 500:
                    print("...")

        print("\n" + "=" * 60)
        print("[SUCCESS] MCP Integration working!")
        print("=" * 60)

    except ImportError as e:
        print(f"\n[ERROR] Missing package: {e}")
        print("Install with: pip install azure-ai-projects azure-ai-agents azure-identity")

    except Exception as e:
        error_msg = str(e)
        if "DefaultAzureCredential" in error_msg or "az login" in error_msg.lower():
            print(f"\n[ERROR] Azure authentication required")
            print("The AgentsClient requires Azure CLI authentication.")
            print("Please run: az login")
            print("Then: az account set --subscription 'Your Subscription'")
        else:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()
