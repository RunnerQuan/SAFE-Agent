# Product Requirements Document: Hybrid Agents Skill

## Document Information
| Field | Value |
|-------|-------|
| Skill Name | Hybrid Agents |
| Version | 1.0 |
| Last Updated | January 2026 |
| Status | Building Block |

---

## 1. Overview

### 1.1 Purpose
The Hybrid Agents skill provides reusable building blocks for creating production-ready multi-agent systems combining Microsoft Agent Framework (MAF) for client-side orchestration with Azure AI Foundry Agent Service for cloud-managed execution. This skill enables MCP integration and various multi-agent orchestration patterns.

### 1.2 Scope
This skill covers:
- Microsoft Agent Framework (MAF) client-side agents
- Azure AI Foundry Agent Service cloud-managed agents
- MCP (Model Context Protocol) tool integration
- Multi-agent orchestration patterns (sequential, parallel, hybrid)
- Production patterns (retry, circuit breaker, checkpointing)

### 1.3 Building Block Nature
**This skill is a building block, not a complete product.** Integrators should:
- Design their own agent workflows and personas
- Implement business-specific tool functions
- Build their own orchestration logic
- Add application-specific error handling
- Handle their own authentication and deployment

---

## 2. Functional Requirements

### 2.1 Core Capabilities

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-1 | MAF Agent Creation | P0 | Create client-side agents with Microsoft Agent Framework |
| FR-2 | Foundry Agent Creation | P0 | Create cloud-managed agents with Azure AI Foundry |
| FR-3 | Agent Thread Management | P0 | Maintain conversation state across interactions |
| FR-4 | Function Tool Definition | P0 | Define custom tools for agent execution |
| FR-5 | MCP Tool Integration | P1 | Connect to MCP servers for external tool access |
| FR-6 | Sequential Orchestration | P1 | Chain agents in sequential pipelines |
| FR-7 | Parallel Orchestration | P1 | Execute multiple agents concurrently (fan-out/fan-in) |
| FR-8 | Hybrid Cloud-Local | P2 | Combine local and cloud agents for privacy/performance |
| FR-9 | Retry with Backoff | P2 | Implement exponential backoff for resilience |
| FR-10 | Circuit Breaker | P2 | Prevent cascade failures with circuit breaker pattern |
| FR-11 | Workflow Checkpointing | P2 | Save and resume workflows from checkpoints |

### 2.2 Framework Comparison

| Aspect | Microsoft Agent Framework (MAF) | Azure AI Foundry Agent Service |
|--------|-------------------------------|-------------------------------|
| Execution | Client-side | Cloud-managed |
| State | Stateless (use AgentThread) | Server-side persistence |
| Control | Full control over execution | Managed execution |
| Best For | Local tools, PII handling | Complex reasoning, scaling |
| Authentication | API key or Azure CLI | Azure CLI required |

### 2.3 Orchestration Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Sequential | Chain agents A → B → C | Research → Analysis → Summary |
| Parallel | Fan-out/Fan-in multiple agents | Multiple perspectives on same input |
| Hybrid | Local + Cloud combination | PII handling locally, reasoning in cloud |
| Supervisor | Manager agent delegates to specialists | Complex multi-domain tasks |

### 2.4 Integration Points

| Integration Point | Description | Required By Integrator |
|-------------------|-------------|----------------------|
| Agent Personas | Instructions and behaviors | Yes - MUST define |
| Custom Tools | Domain-specific functions | Yes - MUST implement |
| Workflow Logic | Orchestration decisions | Yes - MUST implement |
| State Management | Session/thread persistence | Yes - MUST implement |
| Error Recovery | Application-specific handling | Yes - MUST implement |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Requirement |
|--------|-------------|
| MAF Agent Response | Depends on model latency |
| Foundry Agent Response | Additional cloud overhead (~100-500ms) |
| Parallel Agent Execution | Concurrent with asyncio.gather |
| MCP Tool Invocation | Network-dependent |

### 3.2 Reliability

| Pattern | Configuration |
|---------|---------------|
| Retry | 3 retries with exponential backoff (2s base) |
| Circuit Breaker | 5 failures before open, 60s reset timeout |
| Checkpointing | Save state before each workflow step |

### 3.3 Security

- **Azure CLI Auth**: Required for Foundry Agent Service
- **API Keys**: MAF supports API key authentication
- **PII Handling**: Use local (MAF) agents for sensitive data
- **MCP Approval**: Configure `always` or `never` based on trust

---

## 4. Technical Constraints

### 4.1 Azure Service Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| Azure OpenAI | Model deployment for MAF | Yes (for MAF) |
| Azure AI Foundry | Agent Service hosting | Yes (for Foundry) |
| Azure Identity | DefaultAzureCredential | Yes (for Foundry) |

### 4.2 Authentication Requirements

| Framework | Auth Method | Notes |
|-----------|-------------|-------|
| MAF | API key OR AzureCliCredential | Flexible |
| Foundry Agent Service | DefaultAzureCredential only | Requires `az login` |

**Critical**: Azure AI Foundry Agent Service does NOT support API key authentication. You must run `az login` before using Foundry agents.

### 4.3 Package Requirements

```bash
# Microsoft Agent Framework (preview)
pip install agent-framework --pre
pip install agent-framework-core --pre
pip install agent-framework-azure-ai --pre

# Azure AI Foundry
pip install azure-ai-agents
pip install azure-ai-projects
pip install azure-identity
```

---

## 5. User Stories (For Integrators)

### 5.1 Application Developer Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-1 | As a developer, I want to create a conversational agent | Agent responds to messages with context |
| US-2 | As a developer, I want to add custom tools | Agent can call my functions |
| US-3 | As a developer, I want multi-agent workflows | Agents collaborate to complete tasks |
| US-4 | As a developer, I want resilient agent calls | Retries and circuit breakers work |

### 5.2 End User Stories (When Integrated)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| EU-1 | As a user, I want the AI to complete complex tasks | Multi-step workflows execute correctly |
| EU-2 | As a user, I want my data handled securely | PII processed locally only |
| EU-3 | As a user, I want consistent responses | Agent maintains conversation context |

---

## 6. Available Building Blocks

### 6.1 Python Scripts

| Script | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `maf_client.py` | MAF client with AgentThread | `create_maf_agent`, `run_with_thread` |
| `foundry_agent.py` | Foundry agent with ToolSet | `create_foundry_agent`, `process_run` |
| `mcp_integration.py` | MCP tool integration | `McpTool`, approval modes |
| `orchestration.py` | Multi-agent patterns | `sequential_pipeline`, `parallel_fanout` |
| `error_handling.py` | Production patterns | `with_retry`, `CircuitBreaker`, `CheckpointManager` |

### 6.2 Key Code Patterns

#### MAF Agent Creation
```python
from agent_framework.azure import AzureOpenAIChatClient

client = AzureOpenAIChatClient(
    credential=AzureCliCredential(),
    endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    deployment_name=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
)
agent = client.create_agent(name="Assistant", instructions="...")
result = await agent.run("Message")
```

#### Foundry Agent Creation
```python
from azure.ai.projects import AIProjectClient

project_client = AIProjectClient(
    endpoint=os.environ["PROJECT_ENDPOINT"],
    credential=DefaultAzureCredential(),
)
agent = project_client.agents.create_agent(
    model=os.environ["MODEL_DEPLOYMENT_NAME"],
    name="Assistant",
    instructions="...",
)
```

#### MCP Tool Integration
```python
from azure.ai.agents.models import McpTool

mcp_tool = McpTool(
    server_label="microsoft_learn",
    server_url="https://learn.microsoft.com/api/mcp",
    allowed_tools=["microsoft_docs_search"]
)
mcp_tool.set_approval_mode("never")  # Auto-approve for trusted servers
```

---

## 7. Integration Checklist

### 7.1 Before Integration

- [ ] Azure subscription with OpenAI and AI Foundry access
- [ ] Model deployment created (e.g., gpt-4o-mini)
- [ ] Azure CLI installed and logged in (`az login`)
- [ ] Project endpoint obtained from AI Foundry Portal
- [ ] Preview packages installed with `--pre` flag

### 7.2 During Integration

- [ ] Environment variables configured (see `.env.sample`)
- [ ] Agent personas and instructions defined
- [ ] Custom tools implemented with proper docstrings
- [ ] Orchestration pattern selected and implemented
- [ ] Error handling and retry logic added

### 7.3 Testing

- [ ] Single agent responds correctly
- [ ] Multi-turn conversations maintain context
- [ ] Custom tools execute successfully
- [ ] Multi-agent workflows complete
- [ ] Error recovery works as expected
- [ ] Foundry agents cleaned up after use

---

## 8. Limitations & Constraints

### 8.1 Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Foundry requires az login | No API key auth | Run `az login` before execution |
| MAF agents stateless | No built-in memory | Use AgentThread for persistence |
| Preview packages | Breaking changes possible | Pin versions in requirements |
| MCP approval per-call | Can slow workflows | Use `never` for trusted servers |

### 8.2 Out of Scope

The following are NOT provided by this skill:
- Agent UI/chat interface
- Conversation history storage
- User authentication
- Agent deployment infrastructure
- Cost management and budgeting

---

## 9. Orchestration Pattern Guidelines

### 9.1 When to Use Each Pattern

| Pattern | Use When | Example |
|---------|----------|---------|
| Sequential | Tasks have dependencies | Research → Write → Review |
| Parallel | Tasks are independent | Multiple analysts on same topic |
| Hybrid Local-Cloud | PII concerns or latency needs | Mask data locally, reason in cloud |
| Supervisor | Dynamic task routing needed | Manager assigns to specialists |

### 9.2 Pattern Selection Criteria

| Criteria | Sequential | Parallel | Hybrid |
|----------|------------|----------|--------|
| Data Privacy Needs | Low | Low | High |
| Latency Sensitivity | Low | Medium | High |
| Task Independence | Low | High | Varies |
| Complexity | Low | Medium | High |

---

## 10. Production Readiness Guidelines

### 10.1 Error Handling

| Pattern | When to Use | Configuration |
|---------|-------------|---------------|
| Retry | Transient failures | 3 retries, 2s base delay |
| Circuit Breaker | Repeated failures | 5 failures, 60s reset |
| Checkpointing | Long workflows | Save before each step |

### 10.2 Resource Cleanup

**Critical**: Always delete Foundry agents after use:
```python
try:
    # Use agent...
finally:
    project_client.agents.delete_agent(agent.id)
```

### 10.3 MCP Server Trust

| Server | Trust Level | Approval Mode |
|--------|-------------|---------------|
| Microsoft Learn | Trusted | `never` |
| Internal servers | Trusted | `never` |
| Third-party | Untrusted | `always` |

---

## 11. Success Metrics (For Integrators to Define)

Suggested metrics for integrated applications:

| Metric | Description | Target (Example) |
|--------|-------------|------------------|
| Agent Response Accuracy | % correct completions | > 90% |
| Workflow Success Rate | % workflows completing | > 95% |
| Average Latency | End-to-end response time | < 5s (single agent) |
| Retry Rate | % calls requiring retry | < 10% |
| Circuit Breaker Opens | Failure events per day | < 5 |

---

## 12. References

- [SKILL.md](./SKILL.md) - Detailed technical documentation
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)
- [Agent Framework Samples](https://github.com/microsoft/Agent-Framework-Samples)
- [Azure AI Foundry Agents](https://learn.microsoft.com/azure/ai-foundry/agents/overview)
- [AI Agent Design Patterns](https://learn.microsoft.com/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [MCP Server Docs](https://github.com/MicrosoftDocs/mcp)
