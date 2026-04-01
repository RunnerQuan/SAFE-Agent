# MTAtlas Static-Pure Report (demo_static_pure)

- Tools: 3
- Sink tools: 1
- Dependency edges: 8
- Candidate chains: 1
- Accepted chains: 1

## Chains

### chain_001
- Chain: get_email_content -> write_file -> run_terminal
- MCP Path: [Claude Post] get_email_content -> [Filesystem MCP] write_file -> [Shell MCP] run_terminal
- Sink: run_terminal (CMDi)
- User-source risk: True | `get_email_content` accepts user-controlled input through `account`, which can plausibly enter the chain from dialogue.
- Environment-source risk: True | `get_email_content` appears to ingest untrusted external content from `email_store`, which can plausibly propagate toward the sink.