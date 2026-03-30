"""
Multi-Agent Orchestration Patterns

Sequential, parallel, and hybrid orchestration for multi-agent workflows.
"""

import asyncio
import os
import json
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class OrchestrationResult:
    """Result from multi-agent orchestration."""
    final_output: str
    intermediate_results: Dict[str, str]
    pattern: str


class MultiAgentOrchestrator:
    """
    Orchestrator for multi-agent workflows.

    Supports sequential, parallel, and hybrid patterns.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        deployment: Optional[str] = None,
    ):
        """
        Initialize orchestrator.

        Args:
            endpoint: Azure OpenAI endpoint (or AZURE_OPENAI_ENDPOINT env var)
            deployment: Model deployment (or AZURE_OPENAI_CHAT_DEPLOYMENT_NAME env var)
        """
        self.endpoint = endpoint or os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.deployment = deployment or os.environ.get(
            "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME",
            os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
        )

        if not self.endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT is required")

        self._client = None

    @property
    def client(self):
        """Lazy-load the AzureOpenAIChatClient."""
        if self._client is None:
            from agent_framework.azure import AzureOpenAIChatClient
            from azure.identity import AzureCliCredential

            api_key = os.environ.get("AZURE_OPENAI_API_KEY")

            if api_key:
                self._client = AzureOpenAIChatClient(
                    endpoint=self.endpoint,
                    api_key=api_key,
                    deployment_name=self.deployment,
                )
            else:
                self._client = AzureOpenAIChatClient(
                    endpoint=self.endpoint,
                    credential=AzureCliCredential(),
                    deployment_name=self.deployment,
                )

        return self._client

    async def sequential_pipeline(
        self,
        topic: str,
        stages: Optional[List[Dict[str, str]]] = None,
    ) -> OrchestrationResult:
        """
        Execute a sequential multi-agent pipeline.

        Default stages: Research → Analysis → Summary

        Args:
            topic: The topic to process through the pipeline
            stages: Optional custom stages with name and instructions

        Returns:
            OrchestrationResult with final and intermediate outputs
        """
        if stages is None:
            stages = [
                {
                    "name": "Researcher",
                    "instructions": """You gather and organize raw information.
                    Output structured findings with clear sections and bullet points."""
                },
                {
                    "name": "Analyst",
                    "instructions": """You analyze research findings for insights and patterns.
                    Identify key trends, risks, and opportunities."""
                },
                {
                    "name": "Summarizer",
                    "instructions": """You create executive summaries.
                    Distill complex analysis into 3-5 key points with recommendations."""
                },
            ]

        intermediate_results = {}
        current_input = f"Topic: {topic}"

        for i, stage in enumerate(stages):
            agent = self.client.create_agent(
                name=stage["name"],
                instructions=stage["instructions"]
            )

            if i == 0:
                prompt = f"Research this topic: {current_input}"
            else:
                previous_name = stages[i - 1]["name"]
                prompt = f"Based on the {previous_name}'s output:\n\n{current_input}"

            result = await agent.run(prompt)
            intermediate_results[stage["name"]] = result.text
            current_input = result.text

        return OrchestrationResult(
            final_output=current_input,
            intermediate_results=intermediate_results,
            pattern="sequential",
        )

    async def parallel_analysis(
        self,
        scenario: str,
        perspectives: Optional[List[str]] = None,
    ) -> OrchestrationResult:
        """
        Execute parallel analysis from multiple perspectives (fan-out/fan-in).

        Args:
            scenario: The scenario to analyze
            perspectives: List of perspective names (default: technical, financial, compliance)

        Returns:
            OrchestrationResult with aggregated analysis
        """
        if perspectives is None:
            perspectives = ["technical", "financial", "compliance"]

        # Create specialized agents for each perspective
        agents = {}
        for perspective in perspectives:
            agents[perspective] = self.client.create_agent(
                name=f"{perspective.title()}Analyst",
                instructions=f"""Analyze from a {perspective} perspective.
                Output JSON with: perspective, risk_score (0-10), findings (list), recommendation."""
            )

        # Fan-out: Run all analyses in parallel
        async def analyze(name, agent):
            result = await agent.run(f"Analyze this scenario:\n\n{scenario}")
            return name, result.text

        tasks = [analyze(name, agent) for name, agent in agents.items()]
        parallel_results = await asyncio.gather(*tasks)

        intermediate_results = {name: result for name, result in parallel_results}

        # Fan-in: Aggregate results
        aggregator = self.client.create_agent(
            name="RiskAggregator",
            instructions="""You synthesize multiple risk assessments into a final decision.
            Consider all perspectives and provide a unified risk rating and recommendation."""
        )

        combined_input = "\n\n---\n\n".join([
            f"{name} Analysis:\n{result}"
            for name, result in intermediate_results.items()
        ])

        final_result = await aggregator.run(
            f"Synthesize these risk assessments into a final recommendation:\n\n{combined_input}"
        )

        intermediate_results["aggregated"] = final_result.text

        return OrchestrationResult(
            final_output=final_result.text,
            intermediate_results=intermediate_results,
            pattern="parallel",
        )

    async def hybrid_workflow(
        self,
        customer_query: str,
        local_tool: Optional[Callable] = None,
    ) -> OrchestrationResult:
        """
        Execute hybrid cloud-local workflow.

        Local agent handles sensitive data, cloud agent handles reasoning.

        Args:
            customer_query: Customer query to process
            local_tool: Optional local tool for PII handling

        Returns:
            OrchestrationResult with combined output
        """
        from agent_framework import ai_function
        from typing import Annotated
        from pydantic import Field

        # Default local tool for demonstration
        if local_tool is None:
            @ai_function(name="process_pii", description="Process PII data locally")
            def process_pii(
                customer_id: Annotated[str, Field(description="Customer identifier")],
                data_type: Annotated[str, Field(description="Type of PII to retrieve")]
            ) -> str:
                """Process sensitive PII data locally - data never sent to cloud."""
                local_data = {
                    "CUST001": {"name": "John Doe", "ssn_last4": "1234", "balance": 15420.50},
                    "CUST002": {"name": "Jane Smith", "ssn_last4": "5678", "balance": 28750.00},
                }

                customer = local_data.get(customer_id, {})
                if data_type == "balance":
                    return json.dumps({"customer_id": customer_id, "balance": customer.get("balance", 0)})
                elif data_type == "identity":
                    return json.dumps({
                        "customer_id": customer_id,
                        "name": customer.get("name", "Unknown"),
                        "ssn_masked": f"***-**-{customer.get('ssn_last4', '0000')}"
                    })
                return json.dumps({"error": "Invalid data type"})

            local_tool = process_pii

        intermediate_results = {}

        # Step 1: Local agent retrieves/processes PII
        local_agent = self.client.create_agent(
            name="LocalDataProcessor",
            instructions="""You handle sensitive customer data queries.
            Use the process_pii tool to retrieve customer information securely.
            Never expose full SSN or sensitive identifiers.""",
            tools=[local_tool]
        )

        local_result = await local_agent.run(customer_query)
        intermediate_results["local"] = local_result.text

        # Step 2: Cloud agent provides recommendations (no PII in prompt)
        cloud_agent = self.client.create_agent(
            name="CloudAdvisor",
            instructions="""You are a financial advisor providing recommendations.
            You receive anonymized/masked customer data summaries.
            Provide personalized financial advice based on the data provided."""
        )

        cloud_result = await cloud_agent.run(
            f"""Based on this customer profile, provide investment recommendations:

            Customer Data (anonymized):
            {local_result.text}

            Provide 3 specific recommendations based on the customer's profile."""
        )
        intermediate_results["cloud"] = cloud_result.text

        return OrchestrationResult(
            final_output=cloud_result.text,
            intermediate_results=intermediate_results,
            pattern="hybrid",
        )

    async def custom_pipeline(
        self,
        initial_input: str,
        pipeline: List[Dict[str, Any]],
    ) -> OrchestrationResult:
        """
        Execute a custom pipeline with specified agents.

        Args:
            initial_input: Starting input for the pipeline
            pipeline: List of pipeline stages with agent configs

        Returns:
            OrchestrationResult
        """
        intermediate_results = {}
        current_input = initial_input

        for stage in pipeline:
            agent = self.client.create_agent(
                name=stage["name"],
                instructions=stage["instructions"],
                tools=stage.get("tools"),
            )

            prompt_template = stage.get("prompt_template", "{input}")
            prompt = prompt_template.format(input=current_input)

            result = await agent.run(prompt)
            intermediate_results[stage["name"]] = result.text
            current_input = result.text

        return OrchestrationResult(
            final_output=current_input,
            intermediate_results=intermediate_results,
            pattern="custom",
        )


if __name__ == "__main__":
    print("=" * 60)
    print("Multi-Agent Orchestration - Test")
    print("=" * 60)

    async def test_orchestration():
        if not os.environ.get("AZURE_OPENAI_ENDPOINT"):
            print("\n[ERROR] AZURE_OPENAI_ENDPOINT not set")
            print("Please configure .env with your Azure OpenAI credentials")
            return

        try:
            orchestrator = MultiAgentOrchestrator()
            print(f"\n[OK] Orchestrator initialized")
            print(f"    Endpoint: {orchestrator.endpoint}")
            print(f"    Deployment: {orchestrator.deployment}")

            # Test sequential pipeline
            print("\n--- Testing Sequential Pipeline ---")
            result = await orchestrator.sequential_pipeline(
                "Impact of AI agents on enterprise software development"
            )
            print(f"[OK] Pattern: {result.pattern}")
            print(f"    Stages: {list(result.intermediate_results.keys())}")
            print(f"\n    Final Summary (first 300 chars):")
            print(f"    {result.final_output[:300]}...")

            # Test parallel analysis
            print("\n--- Testing Parallel Analysis ---")
            result = await orchestrator.parallel_analysis(
                scenario="""Proposal: Migrate customer data processing to a new cloud-based AI service.
                - Involves processing 10M customer records
                - Uses third-party AI models for analysis
                - Estimated 40% cost reduction
                - 6-month implementation timeline""",
                perspectives=["technical", "financial"]
            )
            print(f"[OK] Pattern: {result.pattern}")
            print(f"    Perspectives analyzed: {list(result.intermediate_results.keys())}")
            print(f"\n    Aggregated Output (first 300 chars):")
            print(f"    {result.final_output[:300]}...")

            print("\n" + "=" * 60)
            print("[SUCCESS] Orchestration working!")
            print("=" * 60)

        except ImportError as e:
            print(f"\n[ERROR] Missing package: {e}")
            print("Install with: pip install agent-framework --pre")

        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()

    asyncio.run(test_orchestration())
