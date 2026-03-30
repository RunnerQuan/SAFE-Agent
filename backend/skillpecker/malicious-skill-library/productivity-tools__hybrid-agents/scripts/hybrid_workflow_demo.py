"""
Hybrid Agentic Workflow Demo - Foundry Agents v1

Demonstrates a hybrid workflow combining:
- 1 Foundry Agent v1 (AgentsClient) with MSLearn MCP server (cloud-managed)
- 2 MAF Agents running locally (analyzer and recommender)

Architecture:
    [Foundry Agent v1 + MCP] --> [MAF Analyzer] --> [MAF Recommender]
           (Cloud)                 (Local)            (Local)

The workflow:
1. Foundry Agent v1 searches Microsoft Learn docs via MCP for a given topic
2. MAF Analyzer agent processes and extracts key insights locally
3. MAF Recommender agent generates actionable recommendations locally

Foundry v1 API (azure-ai-agents):
- Uses AgentsClient from azure.ai.agents
- Creates agents with create_agent()
- Uses threads/messages/runs API pattern
- MCP approval via SubmitToolApprovalAction

For Foundry v2 (azure-ai-projects >= 2.0.0b1), see hybrid_workflow_demo_v2.py
"""

import asyncio
import os
import json
import time
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class HybridWorkflowResult:
    """Result from the hybrid workflow."""
    topic: str
    docs_search_result: str
    analysis: str
    recommendations: str
    workflow_summary: dict


class HybridWorkflowOrchestrator:
    """
    Orchestrator for hybrid agentic workflow.

    Combines Foundry v1 (cloud) and MAF (local) agents in a sequential pipeline.
    """

    def __init__(
        self,
        # Foundry settings
        project_endpoint: Optional[str] = None,
        foundry_model: Optional[str] = None,
        # MAF settings
        openai_endpoint: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        maf_model: Optional[str] = None,
    ):
        """
        Initialize the hybrid orchestrator.

        Args:
            project_endpoint: AI Foundry project endpoint (or PROJECT_ENDPOINT env var)
            foundry_model: Foundry model deployment name
            openai_endpoint: Azure OpenAI endpoint for MAF (or AZURE_OPENAI_ENDPOINT env var)
            openai_api_key: Azure OpenAI API key (or AZURE_OPENAI_API_KEY env var)
            maf_model: MAF model deployment name
        """
        # Foundry configuration
        self.project_endpoint = project_endpoint or os.environ.get(
            "PROJECT_ENDPOINT",
            os.environ.get("AZURE_AI_PROJECT_ENDPOINT")
        )
        self.foundry_model = foundry_model or os.environ.get(
            "MODEL_DEPLOYMENT_NAME",
            os.environ.get("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4o-mini")
        )

        # MAF configuration
        self.openai_endpoint = openai_endpoint or os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.openai_api_key = openai_api_key or os.environ.get("AZURE_OPENAI_API_KEY")
        self.maf_model = maf_model or os.environ.get(
            "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME",
            os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
        )

        # Validate configuration
        if not self.project_endpoint:
            raise ValueError("PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT is required for Foundry agent")
        if not self.openai_endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT is required for MAF agents")

        # Lazy-loaded clients
        self._project_client = None
        self._maf_client = None

    @property
    def project_client(self):
        """Lazy-load the Foundry v1 AgentsClient (for thread/run operations)."""
        if self._project_client is None:
            from azure.ai.agents import AgentsClient
            from azure.identity import DefaultAzureCredential

            self._project_client = AgentsClient(
                endpoint=self.project_endpoint,
                credential=DefaultAzureCredential(),
            )
        return self._project_client

    @property
    def maf_client(self):
        """Lazy-load the MAF AzureOpenAIChatClient."""
        if self._maf_client is None:
            from agent_framework.azure import AzureOpenAIChatClient

            self._maf_client = AzureOpenAIChatClient(
                endpoint=self.openai_endpoint,
                api_key=self.openai_api_key,
                deployment_name=self.maf_model,
            )
        return self._maf_client

    def run_foundry_mcp_agent(self, topic: str) -> str:
        """
        Run Foundry v1 agent with MSLearn MCP to search documentation.

        Uses AgentsClient for cloud-managed agent orchestration.

        Args:
            topic: Topic to search in Microsoft Learn documentation

        Returns:
            Search results from Microsoft Learn
        """
        from azure.ai.agents.models import (
            McpTool,
            ListSortOrder,
            RequiredMcpToolCall,
            SubmitToolApprovalAction,
            ToolApproval,
        )

        print(f"\n{'='*60}")
        print("STEP 1: Foundry Agent v1 with MSLearn MCP (Cloud)")
        print(f"{'='*60}")
        print(f"Searching Microsoft Learn for: {topic}")

        # Configure MCP tool for Microsoft Learn
        mcp_tool = McpTool(
            server_label="microsoft_learn",
            server_url="https://learn.microsoft.com/api/mcp",
            allowed_tools=["microsoft_docs_search", "microsoft_docs_fetch"],
        )
        # Auto-approve for trusted Microsoft server
        mcp_tool.set_approval_mode("never")

        # Use AgentsClient for v1 API
        with self.project_client:
            # Create Foundry v1 agent with MCP tools
            agent = self.project_client.create_agent(
                model=self.foundry_model,
                name="MSLearnResearcher",
                instructions="""You are a Microsoft documentation expert.
                Use the MCP tools to search and fetch official Microsoft documentation.
                Focus on finding the most relevant and recent information.
                Always cite source URLs when available.
                Provide comprehensive but focused results.""",
                tools=mcp_tool.definitions,
            )

            print(f"    Agent created: {agent.id}")

            try:
                # Create thread for communication
                thread = self.project_client.threads.create()
                print(f"    Thread created: {thread.id}")

                # Create message on the thread
                message = self.project_client.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content=f"""Search Microsoft Learn documentation for: {topic}

                    Please provide:
                    1. Overview of the topic from official Microsoft docs
                    2. Key concepts and features
                    3. Any relevant code examples or patterns
                    4. Source URLs for reference"""
                )
                print(f"    Message created: {message.id}")

                # Create run with MCP tool resources
                run = self.project_client.runs.create(
                    thread_id=thread.id,
                    agent_id=agent.id,
                    tool_resources=mcp_tool.resources,
                )
                print(f"    Run created: {run.id}")

                # Poll and handle MCP tool approvals
                while run.status in ["queued", "in_progress", "requires_action"]:
                    time.sleep(2)
                    run = self.project_client.runs.get(thread_id=thread.id, run_id=run.id)
                    print(f"    Run status: {run.status}")

                    # Handle MCP tool approval if required
                    if run.status == "requires_action" and isinstance(run.required_action, SubmitToolApprovalAction):
                        tool_calls = run.required_action.submit_tool_approval.tool_calls
                        if not tool_calls:
                            print("    No tool calls provided - cancelling run")
                            self.project_client.runs.cancel(thread_id=thread.id, run_id=run.id)
                            break

                        tool_approvals = []
                        for tool_call in tool_calls:
                            if isinstance(tool_call, RequiredMcpToolCall):
                                print(f"    Auto-approving MCP tool: {tool_call.name if hasattr(tool_call, 'name') else tool_call.id}")
                                tool_approvals.append(
                                    ToolApproval(
                                        tool_call_id=tool_call.id,
                                        approve=True,
                                        headers=mcp_tool.headers,
                                    )
                                )

                        if tool_approvals:
                            self.project_client.runs.submit_tool_outputs(
                                thread_id=thread.id,
                                run_id=run.id,
                                tool_approvals=tool_approvals,
                            )

                print(f"    Run completed with status: {run.status}")

                if run.status == "failed":
                    print(f"    Run failed: {run.last_error}")
                    return f"MCP search failed: {run.last_error}"

                # Get messages from the thread
                messages = self.project_client.messages.list(
                    thread_id=thread.id,
                    order=ListSortOrder.ASCENDING
                )

                result_text = ""
                for msg in messages:
                    if msg.role == "assistant" and msg.text_messages:
                        last_text = msg.text_messages[-1]
                        result_text = last_text.text.value
                        break

                if not result_text:
                    result_text = f"No documentation found for: {topic}. The MCP search may have timed out or returned no results."

                print(f"\n[OK] Foundry v1 MCP search completed")
                print(f"    Response length: {len(result_text)} chars")

                return result_text

            finally:
                # Always cleanup Foundry agent
                self.project_client.delete_agent(agent.id)
                print("    Agent cleaned up")

    async def run_maf_analyzer_agent(self, docs_content: str, topic: str) -> str:
        """
        Run local MAF agent to analyze documentation content.

        Args:
            docs_content: Documentation content from Foundry MCP agent
            topic: Original topic for context

        Returns:
            Structured analysis of the documentation
        """
        print(f"\n{'='*60}")
        print("STEP 2: MAF Analyzer Agent (Local)")
        print(f"{'='*60}")
        print("Analyzing documentation content locally...")

        # Create local MAF analyzer agent
        analyzer = self.maf_client.create_agent(
            name="DocumentationAnalyzer",
            instructions="""You are a technical documentation analyst.
            Your role is to extract and structure key information from documentation.

            Output your analysis in this structured format:

            ## Key Concepts
            - List the main concepts with brief explanations

            ## Architecture/Components
            - Describe the main components or architecture

            ## Best Practices
            - Extract any best practices mentioned

            ## Code Patterns
            - Identify any code patterns or examples

            ## Prerequisites
            - List any prerequisites or requirements

            Be concise but comprehensive."""
        )

        result = await analyzer.run(f"""Analyze this Microsoft Learn documentation about "{topic}":

{docs_content}

Provide a structured technical analysis extracting the key information.""")

        print(f"\n[OK] MAF analysis completed")
        print(f"    Response length: {len(result.text)} chars")

        return result.text

    async def run_maf_recommender_agent(self, analysis: str, topic: str) -> str:
        """
        Run local MAF agent to generate actionable recommendations.

        Args:
            analysis: Structured analysis from analyzer agent
            topic: Original topic for context

        Returns:
            Actionable recommendations based on the analysis
        """
        print(f"\n{'='*60}")
        print("STEP 3: MAF Recommender Agent (Local)")
        print(f"{'='*60}")
        print("Generating actionable recommendations locally...")

        # Create local MAF recommender agent
        recommender = self.maf_client.create_agent(
            name="TechnicalRecommender",
            instructions="""You are a senior technical advisor.
            Your role is to provide actionable recommendations based on technical analysis.

            Focus on:
            1. Practical implementation steps
            2. Common pitfalls to avoid
            3. Performance and security considerations
            4. Integration patterns

            Output your recommendations in this format:

            ## Implementation Roadmap
            1. Step-by-step implementation guide

            ## Quick Wins
            - Easy improvements to implement first

            ## Potential Pitfalls
            - Common mistakes and how to avoid them

            ## Advanced Tips
            - Expert-level recommendations

            Be specific and actionable."""
        )

        result = await recommender.run(f"""Based on this technical analysis about "{topic}":

{analysis}

Provide actionable recommendations for implementing this technology.""")

        print(f"\n[OK] MAF recommendations completed")
        print(f"    Response length: {len(result.text)} chars")

        return result.text

    async def run_hybrid_workflow(self, topic: str) -> HybridWorkflowResult:
        """
        Execute the full hybrid workflow.

        Pipeline:
        1. Foundry Agent v1 + MCP searches Microsoft Learn docs (cloud)
        2. MAF Analyzer processes results (local)
        3. MAF Recommender generates recommendations (local)

        Args:
            topic: Topic to research and get recommendations for

        Returns:
            HybridWorkflowResult with all outputs
        """
        print("\n" + "="*70)
        print("HYBRID AGENTIC WORKFLOW (Foundry v1)")
        print("="*70)
        print(f"Topic: {topic}")
        print("\nWorkflow: Foundry v1 + MCP (Cloud) --> MAF Analyzer (Local) --> MAF Recommender (Local)")

        # Step 1: Foundry v1 agent searches Microsoft Learn via MCP
        docs_result = self.run_foundry_mcp_agent(topic)

        # Step 2: MAF analyzer agent processes locally
        analysis = await self.run_maf_analyzer_agent(docs_result, topic)

        # Step 3: MAF recommender agent generates recommendations locally
        recommendations = await self.run_maf_recommender_agent(analysis, topic)

        # Generate workflow summary
        summary = {
            "topic": topic,
            "workflow_pattern": "sequential_hybrid",
            "agents": [
                {"name": "MSLearnResearcher", "type": "Foundry v1 + MCP", "location": "cloud"},
                {"name": "DocumentationAnalyzer", "type": "MAF", "location": "local"},
                {"name": "TechnicalRecommender", "type": "MAF", "location": "local"},
            ],
            "steps_completed": 3,
        }

        print(f"\n{'='*70}")
        print("WORKFLOW COMPLETE")
        print(f"{'='*70}")

        return HybridWorkflowResult(
            topic=topic,
            docs_search_result=docs_result,
            analysis=analysis,
            recommendations=recommendations,
            workflow_summary=summary,
        )


def print_section(title: str, content: str, max_chars: int = 1500):
    """Print a section with optional truncation."""
    print(f"\n{'─'*60}")
    print(f"## {title}")
    print(f"{'─'*60}")
    if len(content) > max_chars:
        print(content[:max_chars])
        print(f"\n... [truncated, {len(content)} total chars]")
    else:
        print(content)


async def main():
    """Main entry point for the hybrid workflow demo."""
    print("="*70)
    print("HYBRID AGENTIC WORKFLOW DEMO (Foundry Agents v1)")
    print("="*70)
    print("\nThis demo showcases a hybrid workflow combining:")
    print("  - 1 Foundry Agent v1 with MSLearn MCP server (cloud-managed)")
    print("  - 2 MAF Agents running locally (analyzer + recommender)")
    print()

    # Verify environment
    project_endpoint = os.environ.get("PROJECT_ENDPOINT") or os.environ.get("AZURE_AI_PROJECT_ENDPOINT")
    openai_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")

    if not project_endpoint:
        print("[ERROR] PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT not set")
        print("Please configure .env with your Azure AI Foundry credentials")
        return

    if not openai_endpoint:
        print("[ERROR] AZURE_OPENAI_ENDPOINT not set")
        print("Please configure .env with your Azure OpenAI credentials")
        return

    print("[OK] Environment configured")
    print(f"    Foundry endpoint: {project_endpoint[:50]}...")
    print(f"    OpenAI endpoint: {openai_endpoint}")

    try:
        # Initialize orchestrator
        orchestrator = HybridWorkflowOrchestrator()

        # Define the research topic
        topic = "Azure AI Foundry Agent Service and MCP integration"

        # Run the hybrid workflow
        result = await orchestrator.run_hybrid_workflow(topic)

        # Display results
        print("\n" + "="*70)
        print("FINAL RESULTS")
        print("="*70)

        print_section(
            "1. Microsoft Learn Search Results (Foundry v1 + MCP)",
            result.docs_search_result
        )

        print_section(
            "2. Documentation Analysis (MAF Local)",
            result.analysis
        )

        print_section(
            "3. Actionable Recommendations (MAF Local)",
            result.recommendations
        )

        print(f"\n{'─'*60}")
        print("## Workflow Summary")
        print(f"{'─'*60}")
        print(json.dumps(result.workflow_summary, indent=2))

        print("\n" + "="*70)
        print("[SUCCESS] Hybrid workflow completed!")
        print("="*70)

    except ImportError as e:
        print(f"\n[ERROR] Missing package: {e}")
        print("Install dependencies with:")
        print("  pip install agent-framework")
        print("  pip install azure-ai-projects azure-ai-agents>=1.2.0b3 azure-identity --pre")

    except Exception as e:
        error_msg = str(e)
        if "DefaultAzureCredential" in error_msg or "az login" in error_msg.lower():
            print(f"\n[ERROR] Azure authentication required")
            print("The AIProjectClient requires Azure CLI authentication.")
            print("Please run:")
            print("  az login")
            print("  az account set --subscription 'Your Subscription'")
        else:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
