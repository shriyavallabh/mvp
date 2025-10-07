---
description: Execute 14 real Claude AI agents to generate Grammy-level viral content (2-3 min execution)
---

# /o - Complete Agent Orchestration with Audio

## What This Does

When you run `/o`, Claude Code will:
1. Create a new session (e.g., `session_1759290000000`)
2. Execute **14 separate Claude AI agents** using the Task tool
3. Each agent **generates unique content** using AI (not templates!)
4. Takes **2-3 minutes** because actual AI content generation happens
5. Outputs organized files in `output/session_*/`
6. **🔊 Audio announcements** for each agent (if enabled in config)

## Audio Control

**Check audio status**:
```bash
./orchestration/hooks/audio-control.sh status
```

**Enable audio** (hear each agent announced):
```bash
./orchestration/hooks/audio-control.sh on
```

**Disable audio** (silent execution):
```bash
./orchestration/hooks/audio-control.sh off
```

**Test audio** (verify it works):
```bash
./orchestration/hooks/audio-control.sh test
```

When audio is enabled, you'll hear:
- 🔊 "Advisor Data Manager is loading advisor information"
- 🔊 "Advisor Data Manager has loaded all advisor profiles"
- 🔊 "Market Intelligence is gathering latest market data"
- 🔊 "Market Intelligence has completed market analysis"
- ... (continues for all 14 agents)

## Execution Plan

I (Claude Code) will execute these Task tool calls **with audio announcements**:

### Phase 1: Data Loading

**Before each agent, I will**:
1. Check `orchestration/hooks/audio-config.json` for `enabled: true`
2. If enabled: Execute `node orchestration/hooks/agent-audio-announcer.js start <agent-name>`
3. Execute the Task tool call
4. If enabled: Execute `node orchestration/hooks/agent-audio-announcer.js complete <agent-name>`

**Agents in this phase**:
- `Task(advisor-data-manager)` - Load 4 advisors from data/advisors.json
  - 🔊 Audio: "Advisor Data Manager is loading advisor information"
- `Task(market-intelligence)` - Fetch current Sensex, Nifty, IT sector data
  - 🔊 Audio: "Market Intelligence is gathering latest market data"

### Phase 2: Content Generation
- `Task(segment-analyzer)` - Analyze advisor segments for personalized strategies
  - 🔊 Audio: "Segment Analyzer is analyzing audience segments"
- `Task(linkedin-post-generator-enhanced)` - Generate 1 viral LinkedIn post per advisor (9.0+/10 virality minimum)
  - 🔊 Audio: "LinkedIn Post Generator is creating viral content"
  - **Quality Regeneration**: If score <9.0, auto-regenerate with improvements (max 2 attempts)
- `Task(whatsapp-message-creator)` - Generate 1 WhatsApp message per advisor (300-400 chars, 9.0+/10)
  - 🔊 Audio: "WhatsApp Message Creator is crafting messages"
  - **Quality Regeneration**: If score <9.0, auto-regenerate with improvements (max 2 attempts)
- `Task(status-image-designer)` - Design 1 WhatsApp Status image per advisor (1080x1920px, 9.0+/10)
  - 🔊 Audio: "Status Image Designer is designing visual content"
  - **Quality Regeneration**: If score <9.0, auto-regenerate with improvements (max 2 attempts)

### Phase 3: Image Generation + Quality Control (NEW)
```bash
# WhatsApp Status Images (1080×1920)
python3 scripts/gemini-with-reference-image.py
python3 scripts/visual-quality-validator.py
python3 scripts/auto-regenerate-failed-images.py
# Loop until 100% validated

# WhatsApp Media Images (1200×628) - NEW
python3 scripts/whatsapp-media-image-generator.py
python3 scripts/whatsapp-media-validator.py
# Loop until 100% validated

# Output: Only validated images proceed
```

### Phase 3: Image Generation
- `Task(gemini-image-generator)` - Generate 1 branded image per advisor using Gemini 2.5 Flash
  - 🔊 Audio: "Gemini Image Generator is generating branded images"
  - **Quality Validation**: AI visual validation with auto-regeneration if issues detected

### Phase 4: Brand Customization
- `Task(brand-customizer)` - Apply advisor logos, colors, taglines to all images
  - 🔊 Audio: "Brand Customizer is applying advisor branding"

### Phase 5: Final Validation
- `Task(compliance-validator)` - Validate SEBI compliance for all content
  - 🔊 Audio: "Compliance Validator is checking SEBI compliance"
- `Task(quality-scorer)` - Score all content (minimum 9.0/10 required, triggers regeneration if below)
  - 🔊 Audio: "Quality Scorer is evaluating content quality"
  - **Auto-Regeneration**: If any asset <9.0/10, regenerate with specific improvements
  - **Emergency Fallback**: Use curated template if 2 regeneration attempts fail
- `Task(fatigue-checker)` - Check content freshness (last 30 days)
  - 🔊 Audio: "Fatigue Checker is analyzing content freshness"

### Phase 6: Pre-Distribution Quality Gate (NEW)
```bash
# Check all outputs validated:
if [ $(find session_*/status-images/validated -name "*.png" | wc -l) -eq 0 ]; then
    echo "❌ Status images failed validation"
    exit 1
fi

if [ $(find session_*/whatsapp-media-validated -name "*.png" | wc -l) -eq 0 ]; then
    echo "❌ WhatsApp media images failed validation"
    exit 1
fi

# Only proceed if 100% validated
```

### Phase 6: Distribution
- `Task(distribution-controller)` - Present interactive menu
  - 🔊 Audio: "Distribution Controller is preparing content delivery"

  **Menu Options**:
  1. Send NOW to all advisors
  2. Send to TEST group (5 advisors)
  3. Schedule for 9:00 AM tomorrow
  4. Schedule for custom time
  5. Review content first
  6. Cancel distribution

## Expected Output (1 Asset Per Advisor)

```
output/session_1759290000000/
├── linkedin/
│   ├── text/       # N .txt files (1 per advisor, copy-paste ready)
│   └── json/       # Structured data
├── whatsapp/
│   ├── text/       # N .txt files (1 per advisor, ready to send)
│   └── json/       # Structured data
├── images/
│   └── status/     # N images (1 per advisor, 1080x1920px)
└── notifications.json  # N WhatsApp notifications (1 per advisor)
```

**Example for 4 advisors**: 4 LinkedIn posts, 4 WhatsApp messages, 4 Status images = 12 total assets
**Example for 500 advisors**: 500 LinkedIn posts, 500 WhatsApp messages, 500 Status images = 1,500 total assets

## Quality Guarantee

- ✅ All LinkedIn posts: 9.0+/10 virality minimum (Grammy-level or regenerate)
- ✅ All WhatsApp messages: 9.0+/10 virality minimum (Grammy-level or regenerate)
- ✅ All Status images: 9.0+/10 visual impact (validated or regenerate)
- ✅ SEBI compliant (ARN included, disclaimers present)
- ✅ Fresh content (no repetition from last 30 days)
- ✅ Dynamically generated each run (not templates)
- ✅ **Auto-Regeneration**: Up to 2 attempts if quality <9.0
- ✅ **Emergency Fallback**: Curated templates (9.5+/10) if regeneration fails

## How It's Different from Before

❌ **Old approach** (orchestrate-complete.js):
- Used hardcoded templates
- Completed in 5 seconds
- Same content every run
- No real AI generation

✅ **New approach** (/o command):
- Triggers 14 real Claude AI agents
- Takes 2-3 minutes
- Unique content every run
- Real AI-generated viral posts
