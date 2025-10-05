---
description: Manage session state and shared memory across all agents
---

# State Manager Command

Maintain persistent state and memory for cross-agent context sharing.

## Core Functions

### Get Context for Agent
```
/state-manager get context for [agent-name]
```
Returns relevant context including:
- Previous agent outputs
- Current session state
- Pending communications
- Shared memory data

### Update State
```
/state-manager update [agent-name] completed with [output-summary]
```
Updates:
- Agent completion status
- Session progress
- Shared memory
- Output references

### Initialize Session
```
/state-manager init session
```
Creates:
- Session ID with timestamp
- Output directory structure
- Initial state files

## State Structure

### Session State (data/session-state.json)
```json
{
  "sessionId": "session_2025-09-17T21-08-34-000Z",
  "phase": "content-generation",
  "currentTimestamp": "2025-09-17T21:08:34Z",
  "agents": {
    "completed": ["advisor-data-manager", "market-intelligence"],
    "inProgress": ["linkedin-post-generator"],
    "pending": ["compliance-validator", "quality-scorer"]
  },
  "outputs": {
    "advisor-data-manager": "data/advisors.json",
    "market-intelligence": "data/market-intelligence.json"
  }
}
```

### Shared Context (data/shared-context.json)
```json
{
  "sessionId": "session_2025-09-17T21-08-34-000Z",
  "advisorCount": 3,
  "marketData": {
    "sensex": 82690,
    "topSector": "Realty +48%"
  },
  "segmentAnalysis": {
    "premium": "sophisticated",
    "gold": "educational",
    "silver": "simple"
  }
}
```

## How Agents Use State Manager

### At Agent Start
```
Task(subagent_type: "state-manager",
     prompt: "Get context for linkedin-post-generator")

Returns:
- Advisor data from advisor-data-manager
- Market insights from market-intelligence
- Segment analysis from segment-analyzer
- Any pending messages
```

### After Agent Completion
```
Task(subagent_type: "state-manager",
     prompt: "Update state: linkedin-post-generator completed. Generated 3 posts at output/session_*/linkedin/")

Updates:
- Marks agent as completed
- Saves output location
- Updates shared context
- Notifies dependent agents
```

## Memory Types

### Immediate Memory
- Current session data
- Real-time updates
- File: data/shared-context.json

### Working Memory
- Agent outputs
- Cross-references
- Directory: data/agent-outputs/

### Long-term Memory
- Historical learnings
- Applied improvements
- Directory: learnings/

## State Transitions

1. **Initialization** → Session setup
2. **Data Collection** → Advisors + Market data
3. **Analysis** → Segments analyzed
4. **Content Generation** → Posts created
5. **Enhancement** → Branding applied
6. **Validation** → Compliance checked
7. **Distribution** → Content sent
8. **Completion** → Metrics tracked

## Recovery Support

If session interrupted:
```
/state-manager recover session [session-id]
```
- Loads previous state
- Identifies incomplete agents
- Resumes from last checkpoint

## Output

- Updates data/session-state.json
- Updates data/shared-context.json
- Maintains data/agent-outputs/
- Returns requested context or confirmation