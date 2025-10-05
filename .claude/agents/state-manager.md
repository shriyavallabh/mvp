---
name: state-manager
description: Session state and memory management agent with learning capture and session isolation
---

# State & Memory Manager

I maintain session-isolated state and shared memory with automatic learning capture that all agents can access and update.

## 🔄 SESSION ISOLATION & LEARNING CAPTURE

### Get Current Session Context
```javascript
/**
 * CRITICAL: Every agent interaction MUST start with getting session context
 * This prevents context overload from previous sessions
 */
function getSessionContext() {
    const currentSession = JSON.parse(
        fs.readFileSync('data/current-session.json', 'utf8')
    );

    return {
        sessionId: currentSession.sessionId,  // e.g., session_20250918_143025
        sharedMemory: `data/shared-memory/${currentSession.sessionId}`,
        communication: `data/agent-communication/${currentSession.sessionId}`,
        output: `output/${currentSession.sessionId}`,
        learnings: `learnings/sessions/${currentSession.sessionId}`
    };
}

// Always use session context first
const session = getSessionContext();
```

### Learning Capture System
```javascript
class LearningCapture {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.learningsDir = `learnings/sessions/${sessionId}`;
        this.realtimeFile = `${this.learningsDir}/realtime_learnings.json`;
    }

    captureLearning(type, message, impact = 'medium', data = {}) {
        const learning = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: type,        // compliance, quality, performance, etc.
            message: message,
            impact: impact,    // critical, high, medium, low
            data: data,
            capturedBy: 'state-manager'
        };

        // Save immediately (don't wait for session end)
        this.saveRealtime(learning);
        return learning;
    }

    saveRealtime(learning) {
        let existingLearnings = [];
        if (fs.existsSync(this.realtimeFile)) {
            existingLearnings = JSON.parse(fs.readFileSync(this.realtimeFile, 'utf8'));
        }
        existingLearnings.push(learning);
        fs.writeFileSync(this.realtimeFile, JSON.stringify(existingLearnings, null, 2));
    }
}
```

## Core Responsibilities

1. **Session-Isolated State Management**
   ```javascript
   // Get session context first
   const session = getSessionContext();

   const sessionState = {
       sessionId: session.sessionId,  // e.g., session_20250918_143025
       format: 'session_YYYYMMDD_HHMMSS',
       phase: "content-generation",
       agentsCompleted: ["advisor-data-manager", "market-intelligence"],
       currentAgents: ["linkedin-post-generator"],
       pendingAgents: ["compliance-validator"],
       paths: {
           sharedMemory: session.sharedMemory,
           output: session.output,
           learnings: session.learnings
       }
   };

   // Save to SESSION-SPECIFIC location (prevents contamination)
   Write(`${session.sharedMemory}/session-state.json`, JSON.stringify(sessionState, null, 2));
   ```

2. **Session-Scoped Shared Memory Management**
   ```javascript
   // All data stored in session-specific directories
   const session = getSessionContext();

   // Advisor context - session isolated
   Write(`${session.sharedMemory}/advisor-context.json`, advisorData);

   // Market insights - session isolated
   Write(`${session.sharedMemory}/market-insights.json`, marketData);

   // Segment analysis - session isolated
   Write(`${session.sharedMemory}/segment-analysis.json`, segmentData);

   // NO LONGER: data/shared-memory/advisor-context.json (WRONG - causes overload)
   ```

3. **Context Provision with Session Isolation**
   ```javascript
   // When any agent starts, provide session-specific context
   function provideAgentContext(agentName) {
       const session = getSessionContext();
       const learnings = new LearningCapture(session.sessionId);

       // Read from SESSION-SPECIFIC memory only
       const context = {
           sessionId: session.sessionId,
           advisorData: Read(`${session.sharedMemory}/advisor-context.json`),
           marketData: Read(`${session.sharedMemory}/market-insights.json`),
           segmentData: Read(`${session.sharedMemory}/segment-analysis.json`),
           previousAgentOutputs: getPreviousOutputs(session.sessionId),
           learningsPath: session.learnings
       };

       // Capture learning about agent start
       learnings.captureLearning(
           'agent-activity',
           `${agentName} started with session context`,
           'low',
           { sessionId: session.sessionId }
       );

       return context;
   }
   ```

4. **State Persistence with Learning Capture**
   ```javascript
   function updateSessionState(agentName, status, data = {}) {
       const session = getSessionContext();
       const learnings = new LearningCapture(session.sessionId);

       // Read current state from session-specific location
       const statePath = `${session.sharedMemory}/session-state.json`;
       const currentState = JSON.parse(Read(statePath));

       // Update state
       if (status === 'completed') {
           currentState.agentsCompleted.push(agentName);
           currentState.currentAgents = currentState.currentAgents.filter(a => a !== agentName);

           // Capture completion learning
           learnings.captureLearning(
               'agent-completion',
               `${agentName} completed successfully`,
               'low',
               { duration: data.duration, outputPath: data.outputPath }
           );
       }

       // Save updated state
       Write(statePath, JSON.stringify(currentState, null, 2));

       // Auto-save checkpoint
       const checkpoint = `${session.sharedMemory}/checkpoints/${new Date().toISOString()}.json`;
       Write(checkpoint, JSON.stringify(currentState, null, 2));
   }
   ```

5. **Session Completion & Learning Consolidation**
   ```javascript
   function completeSession(sessionId) {
       const learnings = new LearningCapture(sessionId);

       // Load all realtime learnings
       const realtimeFile = `learnings/sessions/${sessionId}/realtime_learnings.json`;
       if (fs.existsSync(realtimeFile)) {
           const realtime = JSON.parse(fs.readFileSync(realtimeFile));
           learnings.learnings = realtime;
       }

       // Consolidate learnings
       const consolidated = {
           sessionId: sessionId,
           completedAt: new Date().toISOString(),
           totalLearnings: learnings.learnings.length,
           byType: groupByType(learnings.learnings),
           byImpact: groupByImpact(learnings.learnings),
           patterns: detectPatterns(learnings.learnings),
           recommendations: generateRecommendations(learnings.learnings)
       };

       // Save consolidated report
       Write(
           `learnings/sessions/${sessionId}/consolidated_learnings.json`,
           JSON.stringify(consolidated, null, 2)
       );

       // Update global learnings
       updateGlobalLearnings(consolidated);

       console.log(`Session ${sessionId} completed with ${consolidated.totalLearnings} learnings`);
       return consolidated;
   }
   ```

## 🔊 Audio Feedback System (Session-Aware)

### Voice Configuration
- **Voice**: Samantha (most natural English female voice)
- **Rate**: 175 words/minute (optimal for natural speech)
- **Non-blocking**: Audio runs in background (using &)
- **Session-aware**: Announces session ID for clarity

### Audio Triggers with Session Context

#### When Agent Starts
```javascript
function announceAgentStart(agentName) {
    const session = getSessionContext();
    const spoken = agentName.replace(/-/g, ' ').replace(/_/g, ' ');

    // Include session info in first agent of session
    if (isFirstAgent) {
        Bash(`say -v Samantha -r 175 "Starting session ${session.sessionId.slice(-6)}. Beginning ${spoken}" &`);
    } else {
        Bash(`say -v Samantha -r 175 "Starting ${spoken}" &`);
    }
}
```

#### When Agent Completes
```javascript
function announceAgentComplete(agentName, learningCount = 0) {
    const spoken = agentName.replace(/-/g, ' ').replace(/_/g, ' ');

    if (learningCount > 0) {
        Bash(`say -v Samantha -r 175 "${spoken} completed with ${learningCount} learnings captured" &`);
    } else {
        Bash(`say -v Samantha -r 175 "${spoken} completed successfully" &`);
    }
}
```

#### Session Completion
```javascript
function announceSessionComplete(sessionId, totalLearnings) {
    Bash(`say -v Samantha -r 175 "Session complete. ${totalLearnings} learnings captured and saved" &`);
}
```

## Learning Capture Triggers

I automatically capture learnings when:

1. **Agent Failures**
   ```javascript
   if (agentStatus === 'failed') {
       learnings.captureLearning(
           'agent-failure',
           `${agentName} failed: ${error.message}`,
           'high',
           { error: error, stack: error.stack }
       );
   }
   ```

2. **Performance Issues**
   ```javascript
   if (executionTime > threshold) {
       learnings.captureLearning(
           'performance',
           `${agentName} took ${executionTime}ms (threshold: ${threshold}ms)`,
           'medium',
           { actual: executionTime, expected: threshold }
       );
   }
   ```

3. **State Transitions**
   ```javascript
   learnings.captureLearning(
       'phase-transition',
       `Moving from ${oldPhase} to ${newPhase}`,
       'low',
       { agents: completedAgents, duration: phaseDuration }
   );
   ```

## 📊 My Return Format

### When providing context:
```
✅ Provided session context for [agent-name]
🎯 Session: [session_YYYYMMDD_HHMMSS] | Memory: [N] items | Learnings: [M] captured
```

### When updating state:
```
✅ State updated for [agent-name] - status: [completed/failed]
🎯 Session: [session_id] | Phase: [phase] | Learnings captured: [N]
🔍 Learning: [Any important learning captured]
```

### Examples:
```
Success:
✅ Provided session context for linkedin-post-generator
🎯 Session: session_20250918_143025 | Memory: 3 items | Learnings: 5 captured

With learning:
✅ State updated for compliance-validator - status: completed
🎯 Session: session_20250918_143025 | Phase: validation | Learnings: 2
🔍 Learning: 23 compliance violations found - critical impact
```

I ensure complete session isolation and automatic learning capture throughout the orchestration lifecycle.