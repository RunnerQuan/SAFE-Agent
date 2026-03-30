"""
Azure AI Foundry Agent Client (v1 and v2)

Cloud-managed agent orchestration with server-side state.
Supports ToolSet with automatic function execution.

v1 API (azure-ai-agents):
- Uses AgentsClient from azure.ai.agents
- Creates agents with create_agent()
- Uses threads/messages/runs API pattern

v2 API (azure-ai-projects >= 2.0.0b1):
- Uses AIProjectClient with get_openai_client()
- Creates agents with create_version() and PromptAgentDefinition
- Uses OpenAI conversations/responses API
"""

import os
import json
from typing import List, Dict, Any, Optional, Callable, Set
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class FoundryAgentResult:
    """Result from a Foundry v1 agent execution."""
    messages: List[Dict[str, str]]
    agent_id: str
    thread_id: str
    run_status: str


@dataclass
class FoundryAgentResultV2:
    """Result from a Foundry v2 agent execution."""
    messages: List[Dict[str, str]]
    agent_name: str
    agent_version: str
    conversation_id: str


class FoundryAgentClient:
    """
    Azure AI Foundry Agent Service client (v1).

    Uses AgentsClient for cloud-managed agent orchestration.
    Uses threads/messages/runs API pattern.

    For v2 (azure-ai-projects >= 2.0.0b1), use FoundryAgentClientV2.
    """

    def __init__(
        self,
        project_endpoint: Optional[str] = None,
        model_deployment: Optional[str] = None,
    ):
        """
        Initialize Foundry client.

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

    def run_agent(
        self,
        name: str,
        instructions: str,
        message: str,
        tools: Optional[Set[Callable]] = None,
        cleanup: bool = True,
    ) -> FoundryAgentResult:
        """
        Create and run a Foundry agent.

        Args:
            name: Agent name
            instructions: System instructions
            message: User message
            tools: Optional set of tool functions (with proper docstrings)
            cleanup: Whether to delete the agent after completion

        Returns:
            FoundryAgentResult with messages and metadata
        """
        # Configure toolset if provided
        create_kwargs = {
            "model": self.model_deployment,
            "name": name,
            "instructions": instructions,
        }

        if tools:
            from azure.ai.agents.models import FunctionTool, ToolSet

            functions = FunctionTool(tools)
            toolset = ToolSet()
            toolset.add(functions)

            # Enable auto function calls BEFORE creating agent
            self.client.enable_auto_function_calls(toolset)
            create_kwargs["toolset"] = toolset

        # Create agent
        agent = self.client.create_agent(**create_kwargs)

        # Use create_thread_and_process_run for simple execution
        run = self.client.create_thread_and_process_run(
            agent_id=agent.id,
            body={"messages": [{"role": "user", "content": message}]}
        )

        # Get messages from the thread
        messages_response = self.client.messages.list(thread_id=run.thread_id)

        result_messages = []
        for msg in messages_response:
            if hasattr(msg, 'text_messages') and msg.text_messages:
                result_messages.append({
                    "role": msg.role,
                    "content": msg.text_messages[-1].text.value
                })
            elif hasattr(msg, 'content') and msg.content:
                # Handle different message format
                for content_item in msg.content:
                    if hasattr(content_item, 'text') and hasattr(content_item.text, 'value'):
                        result_messages.append({
                            "role": msg.role,
                            "content": content_item.text.value
                        })
                        break

        result = FoundryAgentResult(
            messages=result_messages,
            agent_id=agent.id,
            thread_id=run.thread_id,
            run_status=run.status,
        )

        # Cleanup
        if cleanup:
            self.client.delete_agent(agent.id)

        return result

    def run_streaming_agent(
        self,
        name: str,
        instructions: str,
        message: str,
        on_token: Optional[Callable[[str], None]] = None,
    ) -> FoundryAgentResult:
        """
        Run agent with streaming response.

        Args:
            name: Agent name
            instructions: System instructions
            message: User message
            on_token: Callback for each token received

        Returns:
            FoundryAgentResult with complete response
        """
        from azure.ai.agents.models import MessageDeltaChunk, ThreadRun, AgentStreamEvent

        agent = self.client.create_agent(
            model=self.model_deployment,
            name=name,
            instructions=instructions
        )

        # Create thread and run with streaming
        thread_run = self.client.create_thread_and_run(
            agent_id=agent.id,
            body={"messages": [{"role": "user", "content": message}]}
        )

        full_response = []

        # Stream is available via runs.stream
        with self.client.runs.stream(thread_id=thread_run.thread_id, run_id=thread_run.id) as stream:
            for event_type, event_data, _ in stream:
                if isinstance(event_data, MessageDeltaChunk):
                    token = event_data.text if hasattr(event_data, 'text') else str(event_data)
                    full_response.append(token)
                    if on_token:
                        on_token(token)
                elif isinstance(event_data, ThreadRun):
                    if event_data.status == "completed":
                        break
                elif event_type == AgentStreamEvent.DONE:
                    break

        self.client.delete_agent(agent.id)

        return FoundryAgentResult(
            messages=[
                {"role": "user", "content": message},
                {"role": "assistant", "content": "".join(full_response)}
            ],
            agent_id=agent.id,
            thread_id=thread_run.thread_id,
            run_status="completed",
        )


class FoundryAgentClientV2:
    """
    Azure AI Foundry Agent Service client (v2).

    Uses AIProjectClient with get_openai_client() for OpenAI-compatible API.
    Uses conversations/responses API with PromptAgentDefinition.

    Requires: azure-ai-projects >= 2.0.0b1
    """

    def __init__(
        self,
        project_endpoint: Optional[str] = None,
        model_deployment: Optional[str] = None,
    ):
        """
        Initialize Foundry v2 client.

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

    def run_agent(
        self,
        name: str,
        instructions: str,
        message: str,
        cleanup: bool = True,
    ) -> FoundryAgentResultV2:
        """
        Create and run a Foundry v2 agent.

        Uses PromptAgentDefinition with conversations/responses API.

        Args:
            name: Agent name
            instructions: System instructions
            message: User message
            cleanup: Whether to delete the agent version after completion

        Returns:
            FoundryAgentResultV2 with messages and metadata
        """
        from azure.identity import DefaultAzureCredential
        from azure.ai.projects import AIProjectClient
        from azure.ai.projects.models import PromptAgentDefinition

        with (
            DefaultAzureCredential() as credential,
            AIProjectClient(endpoint=self.project_endpoint, credential=credential) as project_client,
            project_client.get_openai_client() as openai_client,
        ):
            # Create versioned agent with PromptAgentDefinition
            agent = project_client.agents.create_version(
                agent_name=name,
                definition=PromptAgentDefinition(
                    model=self.model_deployment,
                    instructions=instructions,
                ),
            )

            try:
                # Create conversation (OpenAI-compatible API)
                conversation = openai_client.conversations.create()

                # Send request
                response = openai_client.responses.create(
                    conversation=conversation.id,
                    input=message,
                    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
                )

                result_text = response.output_text or ""

                result_messages = [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": result_text}
                ]

                # Cleanup conversation
                openai_client.conversations.delete(conversation_id=conversation.id)

                return FoundryAgentResultV2(
                    messages=result_messages,
                    agent_name=agent.name,
                    agent_version=agent.version,
                    conversation_id=conversation.id,
                )

            finally:
                # Always cleanup agent version
                if cleanup:
                    project_client.agents.delete_version(
                        agent_name=agent.name,
                        agent_version=agent.version
                    )

    def run_agent_with_tools(
        self,
        name: str,
        instructions: str,
        message: str,
        tools: List[Any],
        cleanup: bool = True,
    ) -> FoundryAgentResultV2:
        """
        Create and run a Foundry v2 agent with tools.

        Args:
            name: Agent name
            instructions: System instructions
            message: User message
            tools: List of tool definitions (e.g., MCPTool instances)
            cleanup: Whether to delete the agent version after completion

        Returns:
            FoundryAgentResultV2 with messages and metadata
        """
        from azure.identity import DefaultAzureCredential
        from azure.ai.projects import AIProjectClient
        from azure.ai.projects.models import PromptAgentDefinition

        with (
            DefaultAzureCredential() as credential,
            AIProjectClient(endpoint=self.project_endpoint, credential=credential) as project_client,
            project_client.get_openai_client() as openai_client,
        ):
            # Create versioned agent with tools
            agent = project_client.agents.create_version(
                agent_name=name,
                definition=PromptAgentDefinition(
                    model=self.model_deployment,
                    instructions=instructions,
                    tools=tools,
                ),
            )

            try:
                # Create conversation
                conversation = openai_client.conversations.create()

                # Send request
                response = openai_client.responses.create(
                    conversation=conversation.id,
                    input=message,
                    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
                )

                result_text = response.output_text or ""

                result_messages = [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": result_text}
                ]

                # Cleanup conversation
                openai_client.conversations.delete(conversation_id=conversation.id)

                return FoundryAgentResultV2(
                    messages=result_messages,
                    agent_name=agent.name,
                    agent_version=agent.version,
                    conversation_id=conversation.id,
                )

            finally:
                if cleanup:
                    project_client.agents.delete_version(
                        agent_name=agent.name,
                        agent_version=agent.version
                    )


def create_mortgage_tools():
    """Create sample mortgage tools for testing."""

    def calculate_mortgage(
        principal: float,
        annual_rate: float,
        years: int
    ) -> str:
        """
        Calculate monthly mortgage payment.

        :param principal: The loan amount in dollars.
        :param annual_rate: Annual interest rate as percentage (e.g., 6.5 for 6.5%).
        :param years: Loan term in years.
        :return: JSON string with payment details.
        :rtype: str
        """
        monthly_rate = (annual_rate / 100) / 12
        num_payments = years * 12

        if monthly_rate == 0:
            monthly_payment = principal / num_payments
        else:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)

        total_paid = monthly_payment * num_payments
        total_interest = total_paid - principal

        return json.dumps({
            "monthly_payment": round(monthly_payment, 2),
            "total_paid": round(total_paid, 2),
            "total_interest": round(total_interest, 2),
            "loan_term_months": num_payments
        })

    def get_property_value(address: str) -> str:
        """
        Get estimated property value for an address.

        :param address: The property address to evaluate.
        :return: JSON string with property valuation.
        :rtype: str
        """
        estimates = {
            "123 Main St, Seattle": {"value": 750000, "trend": "+5.2%"},
            "456 Oak Ave, Portland": {"value": 520000, "trend": "+3.1%"},
        }
        data = estimates.get(address, {"value": 500000, "trend": "N/A"})
        return json.dumps({"address": address, **data})

    return {calculate_mortgage, get_property_value}


if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("Azure AI Foundry Agent Client - Test (v1 and v2)")
    print("=" * 60)

    # Check environment
    endpoint = os.environ.get("PROJECT_ENDPOINT") or os.environ.get("AZURE_AI_PROJECT_ENDPOINT")
    if not endpoint:
        print("\n[ERROR] PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT not set")
        print("Please configure .env with your Azure AI Foundry credentials")
        exit(1)

    # Parse command line args
    test_v1 = "--v1" in sys.argv or len(sys.argv) == 1
    test_v2 = "--v2" in sys.argv or len(sys.argv) == 1

    try:
        # Test v1 API
        if test_v1:
            print("\n" + "=" * 60)
            print("Testing Foundry Agent v1 (AgentsClient)")
            print("=" * 60)

            client = FoundryAgentClient()
            print(f"\n[OK] v1 Client initialized")
            print(f"    Endpoint: {client.project_endpoint}")
            print(f"    Model: {client.model_deployment}")

            # Test basic agent
            print("\n--- v1: Testing Basic Agent ---")
            result = client.run_agent(
                name="TestAgentV1",
                instructions="You are a helpful assistant. Be concise.",
                message="What is the capital of France? Reply with just the city name."
            )
            print(f"[OK] Status: {result.run_status}")
            for msg in result.messages:
                print(f"    {msg['role'].upper()}: {msg['content'][:100]}...")

            # Test agent with tools
            print("\n--- v1: Testing Agent with Tools ---")
            tools = create_mortgage_tools()
            result = client.run_agent(
                name="MortgageAdvisorV1",
                instructions="You are a mortgage advisor. Use the tools to help calculate payments.",
                message="What would be my monthly payment for a $500,000 loan at 6% for 30 years?",
                tools=tools,
            )
            print(f"[OK] Status: {result.run_status}")
            for msg in result.messages:
                if msg['role'] == 'assistant':
                    print(f"    Response: {msg['content'][:200]}...")

            print("\n[SUCCESS] Foundry Agent v1 working!")

        # Test v2 API
        if test_v2:
            print("\n" + "=" * 60)
            print("Testing Foundry Agent v2 (AIProjectClient)")
            print("=" * 60)

            client_v2 = FoundryAgentClientV2()
            print(f"\n[OK] v2 Client initialized")
            print(f"    Endpoint: {client_v2.project_endpoint}")
            print(f"    Model: {client_v2.model_deployment}")

            # Test basic agent
            print("\n--- v2: Testing Basic Agent ---")
            result = client_v2.run_agent(
                name="TestAgentV2",
                instructions="You are a helpful assistant. Be concise.",
                message="What is the capital of France? Reply with just the city name."
            )
            print(f"[OK] Agent: {result.agent_name} (version: {result.agent_version})")
            for msg in result.messages:
                print(f"    {msg['role'].upper()}: {msg['content'][:100]}...")

            print("\n[SUCCESS] Foundry Agent v2 working!")

        print("\n" + "=" * 60)
        print("[SUCCESS] All tests completed!")
        print("=" * 60)

    except ImportError as e:
        print(f"\n[ERROR] Missing package: {e}")
        print("Install with:")
        print("  v1: pip install azure-ai-agents azure-identity")
        print("  v2: pip install 'azure-ai-projects>=2.0.0b1' azure-identity")

    except Exception as e:
        error_msg = str(e)
        if "DefaultAzureCredential" in error_msg or "az login" in error_msg.lower():
            print(f"\n[ERROR] Azure authentication required")
            print("Please run: az login")
            print("Then: az account set --subscription 'Your Subscription'")
        else:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()
