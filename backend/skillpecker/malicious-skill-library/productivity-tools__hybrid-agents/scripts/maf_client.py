"""
Microsoft Agent Framework Client

Client-side agent orchestration with Azure OpenAI.
Supports multi-turn conversations via AgentThread and custom tools.
"""

import asyncio
import os
import json
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class AgentResult:
    """Result from an agent execution."""
    text: str
    tool_calls: List[Dict[str, Any]]
    raw_response: Any


class MAFClient:
    """
    Microsoft Agent Framework client for Azure OpenAI.

    Uses AzureOpenAIChatClient for client-side agent orchestration.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment_name: Optional[str] = None,
    ):
        """
        Initialize MAF client.

        Args:
            endpoint: Azure OpenAI endpoint (or AZURE_OPENAI_ENDPOINT env var)
            api_key: API key (or AZURE_OPENAI_API_KEY env var)
            deployment_name: Model deployment (or AZURE_OPENAI_CHAT_DEPLOYMENT_NAME env var)
        """
        self.endpoint = endpoint or os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.api_key = api_key or os.environ.get("AZURE_OPENAI_API_KEY")
        self.deployment_name = deployment_name or os.environ.get(
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

            # Try API key first, fall back to CLI credential
            if self.api_key:
                self._client = AzureOpenAIChatClient(
                    endpoint=self.endpoint,
                    api_key=self.api_key,
                    deployment_name=self.deployment_name,
                )
            else:
                self._client = AzureOpenAIChatClient(
                    endpoint=self.endpoint,
                    credential=AzureCliCredential(),
                    deployment_name=self.deployment_name,
                )

        return self._client

    async def create_agent(
        self,
        name: str,
        instructions: str,
        tools: Optional[List[Callable]] = None,
    ):
        """
        Create an agent with the specified configuration.

        Args:
            name: Agent name
            instructions: System instructions for the agent
            tools: Optional list of tool functions decorated with @ai_function

        Returns:
            Agent instance
        """
        kwargs = {
            "name": name,
            "instructions": instructions,
        }

        if tools:
            kwargs["tools"] = tools

        return self.client.create_agent(**kwargs)

    async def run_single_turn(
        self,
        name: str,
        instructions: str,
        message: str,
        tools: Optional[List[Callable]] = None,
    ) -> AgentResult:
        """
        Execute a single-turn agent conversation.

        Args:
            name: Agent name
            instructions: System instructions
            message: User message
            tools: Optional tools

        Returns:
            AgentResult with response text and tool calls
        """
        agent = await self.create_agent(name, instructions, tools)
        result = await agent.run(message)

        return AgentResult(
            text=result.text,
            tool_calls=getattr(result, "tool_calls", []),
            raw_response=result,
        )

    async def run_multi_turn(
        self,
        name: str,
        instructions: str,
        messages: List[str],
        tools: Optional[List[Callable]] = None,
    ) -> List[AgentResult]:
        """
        Execute a multi-turn conversation using AgentThread.

        Args:
            name: Agent name
            instructions: System instructions
            messages: List of user messages for the conversation
            tools: Optional tools

        Returns:
            List of AgentResult for each turn
        """
        agent = await self.create_agent(name, instructions, tools)
        thread = agent.get_new_thread()

        results = []
        for message in messages:
            result = await agent.run(message, thread=thread)
            results.append(AgentResult(
                text=result.text,
                tool_calls=getattr(result, "tool_calls", []),
                raw_response=result,
            ))

        return results

    async def serialize_thread(self, agent, thread) -> str:
        """
        Serialize a thread for persistence.

        Args:
            agent: The agent instance
            thread: The thread to serialize

        Returns:
            Serialized thread string
        """
        return await thread.serialize()

    async def deserialize_thread(self, agent, serialized: str):
        """
        Restore a thread from serialized state.

        Args:
            agent: The agent instance
            serialized: Serialized thread string

        Returns:
            Restored thread
        """
        return await agent.deserialize_thread(serialized)


def create_weather_tool():
    """Create a sample weather tool for testing."""
    from typing import Annotated
    from pydantic import Field
    from agent_framework import ai_function

    @ai_function(name="get_weather", description="Get current weather for a location")
    def get_weather(
        location: Annotated[str, Field(description="City name, e.g., 'Seattle, WA'")],
        units: Annotated[str, Field(description="Temperature units: 'celsius' or 'fahrenheit'")] = "celsius"
    ) -> str:
        """Fetch weather data for the specified location."""
        weather_data = {
            "Seattle, WA": {"temp": 12, "condition": "Cloudy", "humidity": 78},
            "Tokyo, Japan": {"temp": 18, "condition": "Sunny", "humidity": 45},
            "London, UK": {"temp": 9, "condition": "Rainy", "humidity": 85},
        }
        data = weather_data.get(location, {"temp": 20, "condition": "Unknown", "humidity": 50})

        if units == "fahrenheit":
            data["temp"] = int(data["temp"] * 9/5 + 32)

        return json.dumps({"location": location, **data, "units": units})

    return get_weather


if __name__ == "__main__":
    print("=" * 60)
    print("Microsoft Agent Framework Client - Test")
    print("=" * 60)

    async def test_maf_client():
        # Check environment
        if not os.environ.get("AZURE_OPENAI_ENDPOINT"):
            print("\n[ERROR] AZURE_OPENAI_ENDPOINT not set")
            print("Please configure .env with your Azure OpenAI credentials")
            return

        try:
            client = MAFClient()
            print(f"\n[OK] Client initialized")
            print(f"    Endpoint: {client.endpoint}")
            print(f"    Deployment: {client.deployment_name}")

            # Test single-turn
            print("\n--- Testing Single-Turn Agent ---")
            result = await client.run_single_turn(
                name="TestAgent",
                instructions="You are a helpful assistant. Be concise.",
                message="What is 2 + 2? Reply with just the number."
            )
            print(f"[OK] Response: {result.text}")

            # Test multi-turn
            print("\n--- Testing Multi-Turn Agent ---")
            results = await client.run_multi_turn(
                name="ConversationAgent",
                instructions="You are a helpful assistant tracking our conversation.",
                messages=[
                    "My name is Alice",
                    "What is my name?"
                ]
            )
            for i, r in enumerate(results, 1):
                print(f"[OK] Turn {i}: {r.text[:100]}...")

            print("\n" + "=" * 60)
            print("[SUCCESS] MAF Client working!")
            print("=" * 60)

        except ImportError as e:
            print(f"\n[ERROR] Missing package: {e}")
            print("Install with: pip install agent-framework --pre")

        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()

    asyncio.run(test_maf_client())
