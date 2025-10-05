---
description: Initialize MCP environment and communication infrastructure
---

# MCP Coordinator Command

Initialize the MCP infrastructure for agent communication and state management.

## What This Does

1. **Creates Communication Channels**
   - Sets up data/communication-queue.json for message passing
   - Initializes data/agent-registry.json with agent capabilities
   - Creates bidirectional communication paths

2. **Initializes Shared Memory**
   - Creates data/shared-context.json for cross-agent context
   - Sets up data/orchestration-state/ directory
   - Initializes session management structures

3. **Configures MCP Environment**
   - Checks if MCP server is available
   - Falls back to file-based approach if not
   - Sets up hooks integration points

4. **Registers Agent Capabilities**
   ```json
   {
     "agents": {
       "linkedin-post-generator": {
         "canReceive": ["feedback", "quality", "compliance"],
         "canSend": ["completion", "request", "status"],
         "dependencies": ["advisor-data-manager", "market-intelligence"]
       }
     }
   }
   ```

## Usage

Can be called:
- Directly: `/mcp-coordinator`
- Via Task tool: `Task(subagent_type: "mcp-coordinator", prompt: "Initialize MCP environment")`
- Automatically by `/o` command in Phase 0

## Output

Creates and initializes:
- data/shared-context.json
- data/communication-queue.json
- data/agent-registry.json
- data/orchestration-state/
- Returns confirmation of setup completion

## Important

This is NOT an orchestrator - it only sets up infrastructure and returns control.