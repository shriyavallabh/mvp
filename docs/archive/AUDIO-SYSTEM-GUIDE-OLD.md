# Audio Announcement System for FinAdvise Agents

## Overview

Professional female voice (Samantha) announces every agent trigger and completion during orchestration. Provides real-time audio feedback for all 14 agents in the FinAdvise pipeline.

## Quick Start

### Turn Audio ON
```bash
./orchestration/hooks/audio-control.sh on
```

### Turn Audio OFF
```bash
./orchestration/hooks/audio-control.sh off
```

### Check Status
```bash
./orchestration/hooks/audio-control.sh status
```

### Test Audio
```bash
./orchestration/hooks/audio-control.sh test
```

## How It Works

### Agent Triggers
When any agent is executed (via `/o`, `/finadvise`, or direct execution):

**Before Agent Starts:**
- 🔊 "Market Intelligence is gathering latest market data"

**After Agent Completes:**
- 🔊 "Market Intelligence has completed market analysis"

### All 14 Agents Supported

1. **MCP Coordinator** - Infrastructure initialization
2. **State Manager** - Session management setup
3. **Communication Bus** - Agent connection establishment
4. **Advisor Data Manager** - Advisor information loading
5. **Market Intelligence** - Market data gathering
6. **Segment Analyzer** - Audience segment analysis
7. **LinkedIn Post Generator** - Viral content creation
8. **WhatsApp Message Creator** - Message crafting
9. **Status Image Designer** - Visual content design
10. **Gemini Image Generator** - Branded image generation
11. **Brand Customizer** - Advisor branding application
12. **Compliance Validator** - SEBI compliance checking
13. **Quality Scorer** - Content quality evaluation
14. **Fatigue Checker** - Content freshness analysis

### Distribution agents also supported:
- **Distribution Controller** - Content delivery preparation
- **Analytics Tracker** - Performance metrics monitoring
- **Feedback Processor** - User feedback processing

## Configuration Files

### 1. Audio Configuration
**File:** `/orchestration/hooks/audio-config.json`

```json
{
  "enabled": true,  // Master switch
  "voice": {
    "type": "female",
    "engine": "say",
    "voice_name": "Samantha",
    "rate": 200,      // Words per minute
    "volume": 0.8     // Volume level
  }
}
```

### 2. Hooks Integration
**File:** `/.claude/hooks.yaml`

Audio hooks are integrated into:
- `pre-agent-execution` - Announces agent start
- `post-agent-execution` - Announces agent completion

```yaml
settings:
  audio:
    enabled: true  # Set to false to disable
    voice: "Samantha"
    rate: 200
```

## Control Methods

### Method 1: Command Line (Recommended)
```bash
# Enable
./orchestration/hooks/audio-control.sh on

# Disable
./orchestration/hooks/audio-control.sh off
```

### Method 2: Manual Configuration Edit
Edit `/orchestration/hooks/audio-config.json`:
```json
{
  "enabled": false  // Change to true/false
}
```

### Method 3: Hooks.yaml Edit
Edit `/.claude/hooks.yaml`:
```yaml
settings:
  audio:
    enabled: false  # Change to true/false
```

## Testing

### Test Full System
```bash
./orchestration/hooks/test-agent-audio.sh
```

This will:
1. Simulate 8 sample agent executions
2. Announce start and completion for each
3. Demonstrate real-time audio feedback

### Test Individual Agent
```bash
# Test market intelligence
./orchestration/hooks/universal-agent-hook.sh market-intelligence start
./orchestration/hooks/universal-agent-hook.sh market-intelligence complete
```

## Voice Customization

### Change Voice
Edit `/orchestration/hooks/audio-config.json`:

```json
{
  "voice": {
    "voice_name": "Samantha",  // Options: Samantha, Victoria, Karen, Moira
    "rate": 200,               // 150-250 recommended
    "volume": 0.8              // 0.0-1.0
  }
}
```

### Available Female Voices (macOS)
- **Samantha** (US English) - Professional, clear
- **Victoria** (US English) - Warm, friendly
- **Karen** (Australian English) - Clear, energetic
- **Moira** (Irish English) - Distinctive, pleasant

Test voices:
```bash
say -v Samantha "Testing Samantha voice"
say -v Victoria "Testing Victoria voice"
```

## Integration with Orchestration

### Slash Command `/o`
Audio automatically announces all 14 agents during execution.

### Python Orchestration
```bash
python3 orchestrate-finadvise.py
```
Audio announces each agent phase.

### Individual Agent Execution
Audio works with direct agent execution:
```bash
node execute-finadvise-mvp.js --agent=market-intelligence
```

## Troubleshooting

### No Audio Playing
1. Check status: `./orchestration/hooks/audio-control.sh status`
2. Ensure both configs show "ENABLED"
3. Test system: `./orchestration/hooks/audio-control.sh test`
4. Verify macOS `say` command works: `say "test"`

### Audio Too Fast/Slow
Edit rate in `/orchestration/hooks/audio-config.json`:
- Slower: `"rate": 150`
- Normal: `"rate": 200`
- Faster: `"rate": 250`

### Audio Too Quiet/Loud
Edit volume in `/orchestration/hooks/audio-config.json`:
- Quieter: `"volume": 0.5`
- Normal: `"volume": 0.8`
- Louder: `"volume": 1.0`

### Wrong Voice
1. List available voices: `say -v ?`
2. Update `voice_name` in config
3. Test: `./orchestration/hooks/audio-control.sh test`

## Architecture

```
Agent Execution Flow with Audio:
┌─────────────────────────────────────┐
│  Agent Trigger (Task tool)          │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  pre-agent-execution hook            │
│  ├─ universal-agent-hook.sh start   │
│  └─ 🔊 "Agent X is starting..."     │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Agent Executes                      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  post-agent-execution hook           │
│  ├─ universal-agent-hook.sh complete │
│  └─ 🔊 "Agent X has completed..."   │
└─────────────────────────────────────┘
```

## Files Created

```
/orchestration/hooks/
├── audio-config.json              # Master configuration
├── agent-audio-announcer.js       # Core audio engine
├── universal-agent-hook.sh        # Hook script
├── audio-control.sh               # Control script
└── test-agent-audio.sh            # Test script

/.claude/
└── hooks.yaml                     # Hook integration (updated)
```

## Best Practices

1. **Enable for Production Runs**
   - Provides real-time progress feedback
   - Helps identify stuck agents
   - Confirms pipeline execution

2. **Disable for Silent Execution**
   - Background jobs
   - Automated cron tasks
   - CI/CD pipelines

3. **Use Test Script**
   - Verify audio before important runs
   - Test after configuration changes
   - Demo for stakeholders

## Summary

### Enable Audio
```bash
./orchestration/hooks/audio-control.sh on
```

### Disable Audio
```bash
./orchestration/hooks/audio-control.sh off
```

### Run with Audio
```bash
# Any of these will trigger audio announcements:
/o
python3 orchestrate-finadvise.py
node execute-finadvise-mvp.js
```

Audio system is now fully integrated and ready to announce all agent executions! 🔊
