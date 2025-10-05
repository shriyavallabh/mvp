---
description: Route messages between agents for bidirectional communication
---

# Communication Bus Command

Enable inter-agent messaging and feedback loops.

## Message Routing Capabilities

### Send Message
```
/communication-bus send from [agent1] to [agent2]: [message]
```

### Check Messages
```
/communication-bus check for [agent-name]
```

### Broadcast Message
```
/communication-bus broadcast from [agent]: [message]
```

## Message Types Supported

1. **feedback** - Quality/compliance feedback requiring action
2. **request** - Request for data or regeneration
3. **notify** - Status notifications
4. **query** - Information requests
5. **broadcast** - Multi-agent announcements

## Example Communications

### Quality Feedback Loop
```
Task(subagent_type: "communication-bus",
     prompt: "Send from quality-scorer to linkedin-post-generator: Score 0.65, please enhance engagement")
```

### Compliance Correction
```
Task(subagent_type: "communication-bus",
     prompt: "Send from compliance-validator to whatsapp-message-creator: Add SEBI disclaimer to all messages")
```

### Content Variation Request
```
Task(subagent_type: "communication-bus",
     prompt: "Send from fatigue-checker to all content agents: Similar content detected, increase variation")
```

### Status Notification
```
Task(subagent_type: "communication-bus",
     prompt: "Broadcast from distribution-controller: Distribution completed for all advisors")
```

## How Agents Use This

Any agent can invoke the communication bus:

```python
# In linkedin-post-generator
if quality_score < 0.8:
    Task(subagent_type: "communication-bus",
         prompt: "Send from linkedin-post-generator to quality-scorer: Requesting feedback for improvement")
```

## Message Queue Management

Messages are stored in `data/communication-queue.json`:

```json
{
  "messages": [
    {
      "id": "msg_001",
      "from": "quality-scorer",
      "to": "linkedin-post-generator",
      "message": "Enhance engagement hooks",
      "priority": "high",
      "timestamp": "2025-09-17T21:08:34Z",
      "status": "pending"
    }
  ]
}
```

## Priority Handling

- **high**: Triggers immediate recipient execution
- **medium**: Queued for next agent cycle
- **low**: Informational only

## Output

- Updates data/communication-queue.json
- Logs to data/communication-log.json
- Returns delivery confirmation