# State Synchronization Guide for FinAdvise Agents

## Session: session_2025-09-17T21-35-00-000Z

### How Agents Access Shared State

#### 1. Context Reading (Agent Initialization)
```
Task(subagent_type: "state-manager", prompt: "Get context for [agent-name]")
```

**State Manager Response Format:**
```
✅ Provided context for [agent-name] with [N] data sources
🎯 Session: [X]/14 complete | Phase: [phase-name] | Time elapsed: [X]m
```

**What You Receive:**
- Relevant outputs from completed agents
- Current session state and dependencies
- Shared memory context
- Historical learnings (if applicable)

#### 2. State Updates (Agent Completion)
```
Task(subagent_type: "state-manager", prompt: "Update state: [agent-name] completed with [output-summary]
Learning: [Optional learning text if issue occurred]")
```

**State Manager Response Format:**
```
✅ Updated state for [agent-name] - [action completed]
🎯 Progress: [X]/14 agents | Next: [agent-name] | Est. remaining: [Y]m
[🔍 Learning: [Issue detected] - Impact: [level] | Pattern count: [N]]
```

### State Files Structure

1. **Session State**: `/Users/shriyavallabh/Desktop/mvp/data/session-state.json`
   - Current session progress
   - Agent dependencies
   - Phase tracking

2. **Shared Context**: `/Users/shriyavallabh/Desktop/mvp/data/shared-memory/shared-context.json`
   - Cross-agent data sharing
   - Generated content storage
   - Media assets registry

3. **Agent Outputs**: `/Users/shriyavallabh/Desktop/mvp/data/orchestration-state/agent-outputs.json`
   - Individual agent results
   - Status tracking
   - Completion timestamps

4. **Learning Patterns**: `/Users/shriyavallabh/Desktop/mvp/data/session-learnings.json`
   - Real-time issue capture
   - Pattern detection
   - Improvement recommendations

### Session Output Directory
`/Users/shriyavallabh/Desktop/mvp/output/session_2025-09-17T21-35-00-000Z/`

### Audio Feedback System
- Automatic announcements for agent start/completion
- Voice: Samantha, Rate: 175 WPM
- Non-blocking execution

### Learning & Pattern Detection
- Automatic pattern detection after 3+ similar issues
- Critical issue tracking for compliance/performance
- Real-time learning capture and aggregation

### State Persistence
- Auto-save after each agent completion
- Recovery capabilities for interrupted sessions
- Traceability across all interactions

---
**Ready for orchestration execution**