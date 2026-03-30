"""
Hybrid Agentic Workflow Demo - Foundry Agents v2

Demonstrates a hybrid workflow combining:
- 1 Foundry Agent v2 (PromptAgentDefinition) with MSLearn MCP server (cloud-managed)
- 2 MAF Agents running locally (analyzer and recommender)

Architecture:
    [Foundry Agent v2 + MCP] --> [MAF Analyzer] --> [MAF Recommender]
           (Cloud)                 (Local)            (Local)

The workflow:
1. Foundry Agent v2 searches Microsoft Learn docs via MCP for a given topic
2. MAF Analyzer agent processes and extracts key insights locally
3. MAF Recommender agent generates actionable recommendations locally

Foundry v2 API Patterns (azure-ai-projects >= 2.0.0b1):
- Uses AIProjectClient with get_openai_client()
- Creates agents with create_version() and PromptAgentDefinition
- Uses MCPTool from azure.ai.projects.models
- Uses OpenAI conversations/responses API
- References agents by name in extra_body

Based on samples:
- sample_agent_basic.py
- sample_agent_mcp.py
"""

import asyncio
import os
import json
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


class HybridWorkflowOrchestratorV2:
    """
    Orchestrator for hybrid agentic workflow using Foundry Agents v2.

    Combines Foundry v2 (cloud) and MAF (local) agents in a sequential pipeline.

    Foundry v2 key differences:
    - Uses PromptAgentDefinition instead of simple create_agent()
    - Uses OpenAI-compatible conversations API via get_openai_client()
    - Creates versioned agents with create_version()
    - MCP approval via McpApprovalResponse
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
        Initialize the hybrid orchestrator for Foundry v2.

        Args:
            project_endpoint: AI Foundry project endpoint
            foundry_model: Foundry model deployment name
            openai_endpoint: Azure OpenAI endpoint for MAF
            openai_api_key: Azure OpenAI API key
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
            raise ValueError("PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT is required")
        if not self.openai_endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT is required for MAF agents")

        # Lazy-loaded MAF client
        self._maf_client = None

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

    def run_foundry_v2_mcp_agent(self, topic: str) -> str:
        """
        Run Foundry v2 agent with MSLearn MCP to search documentation.

        Uses the v2 API with:
        - AIProjectClient context manager
        - get_openai_client() for OpenAI-compatible API
        - PromptAgentDefinition for agent definition
        - MCPTool from azure.ai.projects.models
        - conversations/responses API

        Args:
            topic: Topic to search in Microsoft Learn documentation

        Returns:
            Search results from Microsoft Learn
        """
        from azure.identity import DefaultAzureCredential
        from azure.ai.projects import AIProjectClient
        from azure.ai.projects.models import PromptAgentDefinition, MCPTool
        from openai.types.responses.response_input_param import McpApprovalResponse

        print(f"\n{'='*60}")
        print("STEP 1: Foundry Agent v2 with MSLearn MCP (Cloud)")
        print(f"{'='*60}")
        print(f"Searching Microsoft Learn for: {topic}")

        # Use v2 context manager pattern
        with (
            DefaultAzureCredential() as credential,
            AIProjectClient(endpoint=self.project_endpoint, credential=credential) as project_client,
            project_client.get_openai_client() as openai_client,
        ):
            # Configure MCP tool for Microsoft Learn (v2 style)
            mcp_tool = MCPTool(
                server_label="microsoft_learn",
                server_url="https://learn.microsoft.com/api/mcp",
                require_approval="always",  # We'll auto-approve
            )

            # Create versioned agent with PromptAgentDefinition (v2 pattern)
            agent = project_client.agents.create_version(
                agent_name="MSLearnResearcherV2",
                definition=PromptAgentDefinition(
                    model=self.foundry_model,
                    instructions="""You are a Microsoft documentation expert.
                    Use the MCP tools to search and fetch official Microsoft documentation.
                    Focus on finding the most relevant and recent information.
                    Always cite source URLs when available.
                    Provide comprehensive but focused results.""",
                    tools=[mcp_tool],
                ),
            )
            print(f"    Agent created (name: {agent.name}, version: {agent.version})")

            try:
                # Create conversation (v2 pattern - OpenAI compatible)
                conversation = openai_client.conversations.create()
                print(f"    Conversation created: {conversation.id}")

                # Send initial request that will trigger MCP tool
                response = openai_client.responses.create(
                    conversation=conversation.id,
                    input=f"""Search Microsoft Learn documentation for: {topic}

                    Please provide:
                    1. Overview of the topic from official Microsoft docs
                    2. Key concepts and features
                    3. Any relevant code examples or patterns
                    4. Source URLs for reference""",
                    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
                )

                # Process MCP approval requests (v2 pattern)
                input_list = []
                for item in response.output:
                    if item.type == "mcp_approval_request":
                        if item.server_label == "microsoft_learn" and item.id:
                            print(f"    Auto-approving MCP tool: {item.server_label}")
                            input_list.append(
                                McpApprovalResponse(
                                    type="mcp_approval_response",
                                    approve=True,
                                    approval_request_id=item.id,
                                )
                            )

                # If we have approvals, send them back to continue
                if input_list:
                    print(f"    Sending {len(input_list)} approval(s)...")
                    response = openai_client.responses.create(
                        input=input_list,
                        previous_response_id=response.id,
                        extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
                    )

                result_text = response.output_text or ""

                if not result_text:
                    result_text = f"No documentation found for: {topic}. The MCP search may have returned no results."

                print(f"\n[OK] Foundry v2 MCP search completed")
                print(f"    Response length: {len(result_text)} chars")

                # Cleanup conversation
                openai_client.conversations.delete(conversation_id=conversation.id)

                return result_text

            finally:
                # Always cleanup Foundry v2 agent version
                # project_client.agents.delete_version(
                #     agent_name=agent.name,
                #     agent_version=agent.version
                # )
                print("    Agent version deleted")

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
        Execute the full hybrid workflow with Foundry v2.

        Pipeline:
        1. Foundry Agent v2 + MCP searches Microsoft Learn docs (cloud)
        2. MAF Analyzer processes results (local)
        3. MAF Recommender generates recommendations (local)

        Args:
            topic: Topic to research and get recommendations for

        Returns:
            HybridWorkflowResult with all outputs
        """
        print("\n" + "="*70)
        print("HYBRID AGENTIC WORKFLOW (Foundry v2 - PromptAgentDefinition)")
        print("="*70)
        print(f"Topic: {topic}")
        print("\nWorkflow: Foundry v2 + MCP (Cloud) --> MAF Analyzer (Local) --> MAF Recommender (Local)")

        # Step 1: Foundry v2 agent searches Microsoft Learn via MCP
        docs_result = self.run_foundry_v2_mcp_agent(topic)

        # Step 2: MAF analyzer agent processes locally
        analysis = await self.run_maf_analyzer_agent(docs_result, topic)

        # Step 3: MAF recommender agent generates recommendations locally
        recommendations = await self.run_maf_recommender_agent(analysis, topic)

        # Generate workflow summary
        summary = {
            "topic": topic,
            "workflow_pattern": "sequential_hybrid",
            "foundry_version": "v2 (PromptAgentDefinition)",
            "agents": [
                {"name": "MSLearnResearcherV2", "type": "Foundry v2 + MCP", "location": "cloud", "api": "conversations/responses"},
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
    """Main entry point for the hybrid workflow demo with Foundry v2."""
    print("="*70)
    print("HYBRID AGENTIC WORKFLOW DEMO (Foundry Agents v2)")
    print("="*70)
    print("\nThis demo showcases a hybrid workflow combining:")
    print("  - 1 Foundry Agent v2 (PromptAgentDefinition + MCPTool)")
    print("  - 2 MAF Agents running locally (analyzer + recommender)")
    print()
    print("Foundry v2 API features:")
    print("  - Uses AIProjectClient with get_openai_client()")
    print("  - Creates versioned agents with create_version()")
    print("  - Uses OpenAI conversations/responses API")
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
        orchestrator = HybridWorkflowOrchestratorV2()

        # Define the research topic
        topic = "Azure AI Foundry Agent Service and MCP integration"

        # Run the hybrid workflow
        result = await orchestrator.run_hybrid_workflow(topic)

        # Display results
        print("\n" + "="*70)
        print("FINAL RESULTS")
        print("="*70)

        print_section(
            "1. Microsoft Learn Search Results (Foundry v2 + MCP)",
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
        print("[SUCCESS] Hybrid workflow with Foundry v2 completed!")
        print("="*70)

    except ImportError as e:
        print(f"\n[ERROR] Missing package: {e}")
        print("Install dependencies with:")
        print("  pip install agent-framework")
        print("  pip install 'azure-ai-projects>=2.0.0b1' azure-identity python-dotenv")

    except Exception as e:
        error_msg = str(e)
        if "DefaultAzureCredential" in error_msg or "az login" in error_msg.lower():
            print(f"\n[ERROR] Azure authentication required")
            print("Please run:")
            print("  az login")
            print("  az account set --subscription 'Your Subscription'")
        else:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
