"""
Hybrid Agents Building Blocks

Microsoft Agent Framework and Azure AI Foundry integration scripts.

Components:
- MAFClient: Microsoft Agent Framework client with AzureOpenAIChatClient
- FoundryAgentClient: Azure AI Foundry v1 (AgentsClient with threads/messages/runs)
- FoundryAgentClientV2: Azure AI Foundry v2 (AIProjectClient with conversations/responses)
- MCPAgentClient: MCP tool integration with manual/auto approval modes
- MultiAgentOrchestrator: Sequential, parallel, and hybrid orchestration patterns
- Error handling: with_retry decorator, CircuitBreaker, CheckpointManager
"""

from .maf_client import MAFClient
from .foundry_agent import FoundryAgentClient, FoundryAgentClientV2, FoundryAgentResult, FoundryAgentResultV2
from .mcp_integration import MCPAgentClient
from .orchestration import MultiAgentOrchestrator
from .error_handling import with_retry, CircuitBreaker, CheckpointManager, WorkflowCheckpoint

__all__ = [
    # Microsoft Agent Framework
    "MAFClient",
    # Azure AI Foundry v1 (AgentsClient)
    "FoundryAgentClient",
    "FoundryAgentResult",
    # Azure AI Foundry v2 (AIProjectClient)
    "FoundryAgentClientV2",
    "FoundryAgentResultV2",
    # MCP Integration
    "MCPAgentClient",
    # Orchestration
    "MultiAgentOrchestrator",
    # Error Handling
    "with_retry",
    "CircuitBreaker",
    "CheckpointManager",
    "WorkflowCheckpoint",
]
