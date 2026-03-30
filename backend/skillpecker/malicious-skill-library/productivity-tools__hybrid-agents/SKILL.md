---
name: hybrid-agents
description: Hybrid Agentic Workflows - Build production-ready multi-agent systems with Microsoft Agent Framework (client-side) and Azure AI Foundry Agent Service (cloud-managed). Supports MCP integration and multi-agent orchestration patterns.
version: 1.0.0
triggers:
  - microsoft agent framework
  - maf agent
  - azure ai foundry agent
  - ai project client
  - agents client
  - mcp integration
  - multi-agent orchestration
  - hybrid workflow
  - agent framework
  - agentic workflow
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'agent', 'memory', 'todo', 'pw/*', 'c7/*']
model: Claude Opus 4.5 (copilot)
---

# Hybrid Agentic Workflows Skill

## Folder Contents

| File | Type | Description |
|------|------|-------------|
| `SKILL.md` | Documentation | Main skill documentation with architecture comparison, API patterns, and orchestration patterns |
| `PRD.md` | Documentation | Product Requirements Document for the skill |
| `.env.sample` | Configuration | Sample environment variables for Azure OpenAI and Foundry |
| `requirements.txt` | Dependencies | Python package dependencies (agent-framework, azure-ai-agents, azure-ai-projects) |
| **scripts/** | | |
| `scripts/__init__.py` | Module | Package initializer with exports for all clients and utilities |
| `scripts/maf_client.py` | Client | MAFClient for Microsoft Agent Framework with AzureOpenAIChatClient integration |
| `scripts/foundry_agent.py` | Client | FoundryAgentClient (v1 with AgentsClient) and FoundryAgentClientV2 (AIProjectClient) |
| `scripts/mcp_integration.py` | Integration | MCPAgentClient for MCP tool integration with manual/auto approval modes |
| `scripts/orchestration.py` | Orchestrator | MultiAgentOrchestrator with sequential, parallel, and hybrid patterns |
| `scripts/error_handling.py` | Utilities | with_retry decorator, CircuitBreaker, and CheckpointManager for production resilience |
| `scripts/hybrid_workflow_demo.py` | Demo | Complete hybrid workflow demo using Foundry v1 + MAF agents |
| `scripts/hybrid_workflow_demo_v2.py` | Demo | Complete hybrid workflow demo using Foundry v2 (PromptAgentDefinition) + MAF agents |

---

## CRITICAL: No Mock Functionality

**ALL implementations must be real and fully connected to Azure services.**

- NO mock agent responses
- NO fake tool execution results
- NO simulated MCP server connections
- NO placeholder multi-agent outputs
- NO hardcoded workflow results

**Everything must connect to real Azure OpenAI and Azure AI Foundry services and return real results.**

If any functionality cannot be implemented with real connections (e.g., missing credentials, models not deployed), **STOP and confirm with the user** before proceeding.

---

## Overview

This skill teaches you to build hybrid agentic workflows combining:
- **Microsoft Agent Framework (MAF)** - Client-side agent orchestration with full control
- **Azure AI Foundry Agent Service** - Cloud-managed agents with server-side state management
- **MCP (Model Context Protocol)** - Standardized tool integration for external services
- **Multi-Agent Patterns** - Sequential, parallel, and hybrid orchestration

## Architecture Comparison

| Aspect | Agent Framework (MAF) | Foundry Agent v1 | Foundry Agent v2 |
|--------|----------------------|------------------|------------------|
| **Execution** | Client-side | Cloud-managed | Cloud-managed |
| **State** | Stateless (use AgentThread) | Server-side (threads) | Server-side (conversations) |
| **API Pattern** | Direct calls | threads/messages/runs | conversations/responses |
| **Agent Definition** | `create_agent()` | `create_agent()` | `PromptAgentDefinition` |
| **Best For** | Local tools, PII handling | Simple cloud agents | Advanced features, MCP |
| **Package** | `agent-framework --pre` | `azure-ai-agents` | `azure-ai-projects>=2.0.0b1` |

## Environment Variables

```bash
# Azure OpenAI (for Agent Framework)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Azure AI Foundry (for Agent Service)
PROJECT_ENDPOINT=https://your-ai-services.services.ai.azure.com/api/projects/your-project
MODEL_DEPLOYMENT_NAME=gpt-4o-mini
```

Find your `PROJECT_ENDPOINT` in Azure AI Foundry Portal → Project Overview → "Project details" or Libraries > Foundry.

## Building Block Scripts

| Script | Purpose |
|--------|---------|
| `maf_client.py` | Microsoft Agent Framework client with AgentThread support |
| `foundry_agent.py` | Azure AI Foundry agent client (supports both v1 and v2) |
| `mcp_integration.py` | MCP tool integration with manual/auto approval |
| `orchestration.py` | Multi-agent patterns (sequential, parallel, hybrid) |
| `error_handling.py` | Production patterns (retry, circuit breaker, checkpointing) |
| `hybrid_workflow_demo.py` | Hybrid workflow demo using Foundry v1 + MAF |
| `hybrid_workflow_demo_v2.py` | Hybrid workflow demo using Foundry v2 + MAF |

## Quick Start

### 1. Microsoft Agent Framework - Basic Agent

```python
import asyncio
from agent_framework.azure import AzureOpenAIChatClient
from azure.identity import AzureCliCredential

async def basic_agent():
    client = AzureOpenAIChatClient(
        credential=AzureCliCredential(),
        endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
        deployment_name=os.environ.get("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"),
    )

    agent = client.create_agent(
        name="ResearchAssistant",
        instructions="You are a helpful research assistant."
    )

    result = await agent.run("What are the key benefits of agentic AI?")
    print(result.text)

asyncio.run(basic_agent())
```

### 2. Azure AI Foundry Agent Service (v1)

Uses `AgentsClient` with threads/messages/runs API pattern.

```python
from azure.ai.agents import AgentsClient
from azure.identity import DefaultAzureCredential

def foundry_agent_v1():
    client = AgentsClient(
        endpoint=os.environ["PROJECT_ENDPOINT"],
        credential=DefaultAzureCredential(),
    )

    with client:
        agent = client.create_agent(
            model=os.environ["MODEL_DEPLOYMENT_NAME"],
            name="FoundryAssistantV1",
            instructions="You are a helpful assistant.",
        )

        thread = client.threads.create()

        client.messages.create(
            thread_id=thread.id,
            role="user",
            content="Explain microservices architecture."
        )

        run = client.runs.create_and_process(
            thread_id=thread.id,
            agent_id=agent.id
        )

        # Cleanup
        client.delete_agent(agent.id)

foundry_agent_v1()
```

### 3. Azure AI Foundry Agent Service (v2)

Uses `AIProjectClient` with conversations/responses API (requires `azure-ai-projects >= 2.0.0b1`).

```python
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition
from azure.identity import DefaultAzureCredential

def foundry_agent_v2():
    with (
        DefaultAzureCredential() as credential,
        AIProjectClient(endpoint=os.environ["PROJECT_ENDPOINT"], credential=credential) as project_client,
        project_client.get_openai_client() as openai_client,
    ):
        # Create versioned agent with PromptAgentDefinition
        agent = project_client.agents.create_version(
            agent_name="FoundryAssistantV2",
            definition=PromptAgentDefinition(
                model=os.environ["MODEL_DEPLOYMENT_NAME"],
                instructions="You are a helpful assistant.",
            ),
        )

        try:
            # Create conversation (OpenAI-compatible API)
            conversation = openai_client.conversations.create()

            # Send request with agent reference
            response = openai_client.responses.create(
                conversation=conversation.id,
                input="Explain microservices architecture.",
                extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
            )

            print(response.output_text)

            # Cleanup conversation
            openai_client.conversations.delete(conversation_id=conversation.id)

        finally:
            # Cleanup agent version
            project_client.agents.delete_version(
                agent_name=agent.name,
                agent_version=agent.version
            )

foundry_agent_v2()
```

### 4. MCP Tool Integration

#### v1: McpTool with AgentsClient

```python
from azure.ai.agents.models import McpTool

# Microsoft Learn MCP (free, no auth required)
mcp_tool = McpTool(
    server_label="microsoft_learn",
    server_url="https://learn.microsoft.com/api/mcp",
    allowed_tools=["microsoft_docs_search", "microsoft_docs_fetch"]
)

# Auto-approve for trusted servers
mcp_tool.set_approval_mode("never")

agent = client.create_agent(
    model=os.environ["MODEL_DEPLOYMENT_NAME"],
    name="DocsResearcher",
    instructions="Search Microsoft documentation to answer questions.",
    tools=mcp_tool.definitions,
)
```

#### v2: MCPTool with AIProjectClient

```python
from azure.ai.projects.models import MCPTool, PromptAgentDefinition
from openai.types.responses.response_input_param import McpApprovalResponse

# Microsoft Learn MCP (free, no auth required)
mcp_tool = MCPTool(
    server_label="microsoft_learn",
    server_url="https://learn.microsoft.com/api/mcp",
    require_approval="always",  # or "never" for auto-approval
)

agent = project_client.agents.create_version(
    agent_name="DocsResearcherV2",
    definition=PromptAgentDefinition(
        model=os.environ["MODEL_DEPLOYMENT_NAME"],
        instructions="Search Microsoft documentation to answer questions.",
        tools=[mcp_tool],
    ),
)

# Handle MCP approval requests in v2
response = openai_client.responses.create(
    conversation=conversation.id,
    input="Search for Azure Functions documentation",
    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
)

# Process approval requests
input_list = []
for item in response.output:
    if item.type == "mcp_approval_request":
        input_list.append(McpApprovalResponse(
            type="mcp_approval_response",
            approve=True,
            approval_request_id=item.id,
        ))

# Continue with approvals
if input_list:
    response = openai_client.responses.create(
        input=input_list,
        previous_response_id=response.id,
        extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
    )
```

## Orchestration Patterns

### Sequential Pipeline
```python
# Research → Analysis → Summary
research_result = await researcher.run(topic)
analysis_result = await analyst.run(f"Analyze: {research_result.text}")
summary_result = await summarizer.run(f"Summarize: {analysis_result.text}")
```

### Parallel (Fan-out/Fan-in)
```python
# Multiple perspectives in parallel
results = await asyncio.gather(
    technical_agent.run(scenario),
    financial_agent.run(scenario),
    compliance_agent.run(scenario),
)
final = await aggregator.run(f"Synthesize: {results}")
```

### Hybrid Cloud-Local
```python
# Local agent for PII, cloud agent for reasoning
local_result = await local_agent.run("Get masked customer data")
cloud_result = await cloud_agent.run(f"Recommend based on: {local_result.text}")
```

## Production Patterns

### Retry with Exponential Backoff
```python
from error_handling import with_retry

@with_retry(max_retries=3, base_delay=2.0)
async def resilient_call(agent, message):
    return await agent.run(message)
```

### Circuit Breaker
```python
from error_handling import CircuitBreaker

circuit = CircuitBreaker(failure_threshold=5, reset_timeout=60.0)
result = await circuit.call(agent.run, message)
```

### Workflow Checkpointing
```python
from error_handling import CheckpointManager, WorkflowCheckpoint

checkpoint_mgr = CheckpointManager()

# Save checkpoint before each step
checkpoint = WorkflowCheckpoint(
    workflow_id="my-workflow",
    current_step="analysis",
    completed_steps=["research"],
    intermediate_results={"research": result}
)
await checkpoint_mgr.save(checkpoint)

# Recover from checkpoint on failure
existing = await checkpoint_mgr.load("my-workflow")
if existing:
    print(f"Resuming from: {existing.current_step}")
```

## MCP Server Reference

| Server | URL | Auth |
|--------|-----|------|
| Microsoft Learn | `https://learn.microsoft.com/api/mcp` | None |
| GitHub Copilot | `https://api.githubcopilot.com/mcp/` | PAT/OAuth |
| GitHub (read-only) | `https://api.githubcopilot.com/mcp/readonly` | PAT/OAuth |

## Key Imports

```python
# Microsoft Agent Framework
from agent_framework import ChatAgent, ai_function, MCPStdioTool
from agent_framework.azure import AzureOpenAIChatClient
from azure.identity import AzureCliCredential

# Azure AI Foundry v1 (azure-ai-agents)
from azure.ai.agents import AgentsClient
from azure.ai.agents.models import (
    FunctionTool, ToolSet, McpTool,
    ListSortOrder, RequiredMcpToolCall,
    SubmitToolApprovalAction, ToolApproval
)

# Azure AI Foundry v2 (azure-ai-projects >= 2.0.0b1)
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, MCPTool
from openai.types.responses.response_input_param import McpApprovalResponse

# Common
from azure.identity import DefaultAzureCredential
```

## Azure Authentication Setup

```bash
# Login to Azure (required for DefaultAzureCredential)
az login
az account set --subscription "Your Subscription Name"
```

## Dependencies

### For v1 (AgentsClient)
```
agent-framework --pre
azure-ai-agents>=1.2.0b5
azure-identity
python-dotenv
```

### For v2 (AIProjectClient)
```
agent-framework --pre
azure-ai-projects>=2.0.0b1
azure-identity
python-dotenv
```

### Full Installation
```bash
pip install agent-framework --pre
pip install azure-ai-agents>=1.2.0b5 azure-identity python-dotenv
pip install 'azure-ai-projects>=2.0.0b1'
```

## Lessons Learned

### Azure Authentication Requirements
**Azure AI Foundry Agent Service requires `az login`** - it uses `DefaultAzureCredential` which needs Azure CLI authentication. API key authentication is not supported by the AgentsClient.

```bash
# Required before running Foundry/MCP scripts
az login
az account set --subscription "Your Subscription Name"
```

The `error_handling.py` script works without Azure login as it only tests local patterns.

### Package Installation
Agent Framework requires `--pre` flag for preview packages:
```bash
pip install agent-framework --pre
```

### Agent Thread Serialization
MAF agents are stateless - use `AgentThread` for multi-turn conversations:
```python
thread = agent.get_new_thread()
result = await agent.run("Message", thread=thread)
serialized = await thread.serialize()  # Save for later
```

### Foundry Agent Cleanup

#### v1: Delete agent by ID
```python
client.delete_agent(agent.id)
```

#### v2: Delete agent version
```python
project_client.agents.delete_version(
    agent_name=agent.name,
    agent_version=agent.version
)
# Also cleanup conversation
openai_client.conversations.delete(conversation_id=conversation.id)
```

### MCP Approval Modes
- `"always"` - Require manual approval for each tool call
- `"never"` - Auto-approve (for trusted servers only)

### Function Tool Docstrings
Foundry `FunctionTool` requires docstrings with `:param` and `:return:` for parameter parsing:
```python
def my_tool(param: str) -> str:
    """
    Tool description.

    :param param: Parameter description.
    :return: Return description.
    :rtype: str
    """
```

### ToolSet Registration Order (v1 only)
Call `enable_auto_function_calls(toolset)` BEFORE `create_agent()`:
```python
client.enable_auto_function_calls(toolset)
agent = client.create_agent(..., toolset=toolset)
```

### v1 vs v2 API Key Differences

| Aspect | v1 (AgentsClient) | v2 (AIProjectClient) |
|--------|------------------|---------------------|
| **Package** | `azure-ai-agents` | `azure-ai-projects>=2.0.0b1` |
| **Agent Creation** | `create_agent()` | `agents.create_version()` with `PromptAgentDefinition` |
| **Conversation** | `threads.create()` | `openai_client.conversations.create()` |
| **Messages** | `messages.create()` | `openai_client.responses.create()` |
| **Agent Reference** | `agent_id=agent.id` | `extra_body={"agent": {"name": agent.name, "type": "agent_reference"}}` |
| **MCP Tool** | `McpTool` from `azure.ai.agents.models` | `MCPTool` from `azure.ai.projects.models` |
| **MCP Approval** | `ToolApproval` | `McpApprovalResponse` from openai types |
| **Cleanup** | `delete_agent(agent.id)` | `delete_version(agent_name, agent_version)` |

## References

- [Microsoft Agent Framework GitHub](https://github.com/microsoft/agent-framework)
- [Agent Framework Samples](https://github.com/microsoft/Agent-Framework-Samples)
- [Azure AI Travel Agents](https://github.com/Azure-Samples/azure-ai-travel-agents)
- [Agent Framework Docs](https://learn.microsoft.com/en-us/agent-framework/)
- [Azure AI Foundry Agents](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview)
- [MCP Server Docs](https://github.com/MicrosoftDocs/mcp)
- [AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
