# /o-with-audio - Complete Agent Orchestration WITH Audio Announcements

Execute the full 14-agent FinAdvise pipeline with professional female voice announcements for every agent.

## How This Works

This command wraps each Task tool call with audio announcements:

```javascript
// Before each agent
say -v Samantha "Market Intelligence is gathering latest market data"

// Execute agent
Task(market-intelligence)

// After agent completes
say -v Samantha "Market Intelligence has completed market analysis"
```

## What You'll Hear

- **Before Agent Starts**: "Market Intelligence is gathering latest market data"
- **After Agent Completes**: "Market Intelligence has completed market analysis"

For all 14 agents:
1. Advisor Data Manager
2. Market Intelligence
3. Segment Analyzer
4. LinkedIn Post Generator
5. WhatsApp Message Creator
6. Status Image Designer
7. Gemini Image Generator
8. Brand Customizer
9. Compliance Validator
10. Quality Scorer
11. Fatigue Checker
12. Distribution Controller
13. Analytics Tracker (optional)
14. Feedback Processor (optional)

## Audio Control

**Enable Audio**:
```bash
./orchestration/hooks/audio-control.sh on
```

**Disable Audio**:
```bash
./orchestration/hooks/audio-control.sh off
```

**Test Audio**:
```bash
./orchestration/hooks/audio-control.sh test
```

## Execution

When you run `/o-with-audio`, I will:

1. **Check audio status** from `orchestration/hooks/audio-config.json`
2. **If enabled**: Announce each agent before/after execution
3. **If disabled**: Run silently (same as `/o`)
4. Execute all 14 agents in sequence
5. Generate Grammy-level content (8.5+ virality)
6. Present distribution menu

## Audio Configuration

Voice: **Samantha** (Professional US English Female)
Rate: **200 words/minute** (clear, not rushed)
Volume: **0.8** (80%)

Customizable in: `orchestration/hooks/audio-config.json`

## Example Session

```
🔊 "Advisor Data Manager is loading advisor information"
   [Agent executes for 30 seconds]
🔊 "Advisor Data Manager has loaded all advisor profiles"

🔊 "Market Intelligence is gathering latest market data"
   [Agent executes for 45 seconds]
🔊 "Market Intelligence has completed market analysis"

... [continues for all 14 agents]
```

Total audio announcements: **28** (14 start + 14 complete)
Total execution time: **8-10 minutes** (same as `/o`)

## Comparison with `/o`

| Feature | `/o` | `/o-with-audio` |
|---------|------|-----------------|
| Agents Executed | 14 | 14 |
| Content Quality | 8.5+ | 8.5+ |
| Execution Time | 8-10 min | 8-10 min |
| Audio Feedback | ❌ None | ✅ Every agent |
| Progress Visibility | Console only | Audio + Console |

## When to Use This

**Use `/o-with-audio` when**:
- You want real-time progress updates
- Working on important production runs
- Demoing the system to stakeholders
- Need to walk away and monitor by sound
- Testing new agents or configurations

**Use `/o` when**:
- Running in background/automated
- Silent execution preferred
- Multiple parallel sessions
- CI/CD pipelines

## Technical Implementation

The audio system works by:

1. Reading `orchestration/hooks/audio-config.json` for enabled status
2. Loading agent-specific announcements from config
3. Using macOS `say` command with Samantha voice
4. Announcing before Task tool call
5. Announcing after Task tool returns

No hooks dependency - works directly with Task tool!
