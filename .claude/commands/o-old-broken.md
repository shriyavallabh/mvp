---
description: REAL 14-agent orchestration with Claude AI - dynamically generated viral content (8.0+/10 guaranteed)
---

# 🚀 COMPLETE END-TO-END ORCHESTRATION

## 🎯 HOW IT WORKS
When you run `/o`, the system will:
1. Execute complete orchestration (orchestrate-complete.js)
2. Generate viral content with auto-quality checks (8.0+/10 guaranteed)
3. Create organized output files (text + JSON)
4. Generate image specifications (Silicon Valley quality)
5. Prepare advisor notifications
6. Create comprehensive summary with all file locations

## ✅ WHAT YOU GET
- LinkedIn posts: `output/session_*/linkedin/text/*.txt` (ready to copy-paste)
- WhatsApp messages: `output/session_*/whatsapp/text/*.txt` (ready to send)
- Images: `output/session_*/images/*/` (LinkedIn, WhatsApp, Status)
- Notifications: `output/session_*/notifications.json` (prepared messages)
- Summary: `output/session_*/summary.json` (all locations)

## ⚠️ CRITICAL REQUIREMENTS - NO EXCEPTIONS
1. **NO GENERIC CONTENT ALLOWED** - Every message must be viral-worthy
2. **Viral Formula**: (Hook × Story × Emotion) + (Specificity × Simplicity) + CTA²
3. **Minimum Quality**: 8.0/10 virality score or content gets rejected
4. **Proven Strategies Only**: Warikoo stories, Ranade analogies, Shrivastava contrarian data, Sharan pop culture
5. **Output Format**: BOTH JSON and TEXT files (not trapped in JSON)

### Examples of BANNED Generic Content:
❌ "Good morning! Markets are up today"
❌ "Consider reviewing your portfolio"
❌ "Happy investing!"

### Examples of REQUIRED Viral Content:
✅ "I lost ₹15 lakhs in 2008. Here's why I'm grateful."
✅ "Your ₹200 coffee = ₹67 LAKHS gone. Calculate yours."
✅ "Auto driver → Crorepati. ₹500 SIP. True story."

Execute complete end-to-end orchestration with real implementations:

## 🤖 EXECUTION INSTRUCTIONS FOR CLAUDE CODE

When `/o` is run, Claude Code MUST:

1. **Create session ID**: `session_${Date.now()}`
2. **Execute 14 Task tool calls** in sequence (respecting dependencies)
3. **Each agent generates REAL content** using Claude AI (not templates)
4. **Takes 2-3 minutes** (not 5 seconds) due to AI generation
5. **Content changes every run** (dynamically generated)

## IMPLEMENTATION

Execute these 14 agents using Task tool:

### PHASE 1: Infrastructure (Run first - parallel)
```javascript
// Agent 1: MCP Coordinator
Task({
  subagent_type: "mcp-coordinator",
  description: "Initialize MCP infrastructure",
  prompt: "Initialize communication channels and state management for session ${sessionId}"
});

Task({
  subagent_type: "state-manager",
  description: "Setup session state",
  prompt: "Create session ${sessionId} and initialize shared memory"
});

Task({
  subagent_type: "communication-bus",
  description: "Enable agent messaging",
  prompt: "Set up message routing for 14 agents in session ${sessionId}"
});

// PHASE 2: Data Collection (2 agents - parallel)
Task({
  subagent_type: "advisor-data-manager",
  description: "Load advisor data",
  prompt: "Load 4 advisors from data/advisors.json into shared memory for session ${sessionId}"
});

Task({
  subagent_type: "market-intelligence",
  description: "Fetch market data",
  prompt: "Fetch current market data (Sensex, Nifty, IT sector) and save to shared memory for session ${sessionId}"
});

// PHASE 3: Analysis (1 agent)
Task({
  subagent_type: "segment-analyzer",
  description: "Analyze segments",
  prompt: "Analyze Premium/Gold/Silver advisor segments and create content strategies for session ${sessionId}"
});

// PHASE 4: Content Generation (3 agents - parallel)
Task({
  subagent_type: "linkedin-post-generator-enhanced",
  description: "Generate LinkedIn posts",
  prompt: "Generate 3 viral LinkedIn posts (8.0+/10 virality) for each advisor. Use Warikoo/Ranade/Shrivastava formulas. Save as BOTH JSON and TEXT files in output/${sessionId}/linkedin/"
});

Task({
  subagent_type: "whatsapp-message-creator",
  description: "Generate WhatsApp messages",
  prompt: "Generate 3 WhatsApp messages (300-400 chars, 8.0+/10 virality) for each advisor. Save as BOTH JSON and TEXT files in output/${sessionId}/whatsapp/"
});

Task({
  subagent_type: "status-image-designer",
  description: "Design Status images",
  prompt: "Design 3 WhatsApp Status images (1080x1920) for each advisor with diverse formats (educational, animations, infographics)"
});

// PHASE 5: Enhancement (2 agents - parallel)
Task({
  subagent_type: "gemini-image-generator",
  description: "Generate marketing images",
  prompt: "Generate LinkedIn (1200x628), WhatsApp (1080x1080), and Status (1080x1920) images using Gemini API with Silicon Valley designer-level prompts for session ${sessionId}"
});

Task({
  subagent_type: "brand-customizer",
  description: "Apply branding",
  prompt: "Apply advisor logos, colors, and taglines to all content and images for session ${sessionId}"
});

// PHASE 6: Validation (3 agents - sequential)
Task({
  subagent_type: "compliance-validator",
  description: "Validate compliance",
  prompt: "Validate all content against SEBI guidelines and WhatsApp policies. Zero tolerance for violations. Reject if non-compliant."
});

Task({
  subagent_type: "quality-scorer",
  description: "Score content quality",
  prompt: "Score all LinkedIn and WhatsApp content. Minimum 8.0/10 virality required. Reject and request regeneration if below threshold."
});

Task({
  subagent_type: "fatigue-checker",
  description: "Check content freshness",
  prompt: "Check last 30 days of content for each advisor. Flag if new content too similar. Suggest diversification."
});

// PHASE 7: Distribution (1 agent)
Task({
  subagent_type: "distribution-controller",
  description: "Distribute content",
  prompt: "Present interactive distribution menu with 6 options: (1) Send NOW, (2) Test group, (3) Schedule 9AM, (4) Custom time, (5) Review first, (6) Cancel"
});
```

This triggers all phases with real AI agents:

### Phase 0: Infrastructure Setup
- Create session directories
- Initialize shared memory
- Set current session context

### Phase 1: Data Loading (Real Data Only)
- Load advisors from data/advisors.json (NO MOCK DATA)
- Load market intelligence from data/market-intelligence.json
- Save to session-specific shared memory

### Phase 2: Segment Analysis
- Analyze Premium/Gold/Silver segments
- Count advisors per segment
- Save analysis to shared memory

### Phase 3: Content Generation (Real Implementation)
- LinkedIn posts: Creates 3 posts per advisor
  - Saves to: linkedin/text/*.txt (copy-paste ready)
  - Saves to: linkedin/json/*.json (structured data)
  - Uses viral formulas: Personal loss, underdog story, contrarian data
  - All scored 8.0+/10 (Grammy-level guaranteed)

- WhatsApp messages: Creates 3 messages per advisor
  - Saves to: whatsapp/text/*.txt (ready to send)
  - Saves to: whatsapp/json/*.json (structured data)
  - 300-400 characters each
  - Viral hooks: Shocking numbers, pattern interrupt, urgency
  - All scored 8.0+/10

### Phase 4: Image Generation (Silicon Valley Quality)
- Creates specs for LinkedIn images (1200x628px)
- Creates specs for WhatsApp images (1080x1080px)
- Creates specs for Status images (1080x1920px)
- Uses extraordinary designer-level prompts (Apple + Stripe + Figma)
- Saves prompts to: images/prompts/*.json
- Creates placeholder specs until API available

### Phase 5: Validation & Quality Check
- Checks LinkedIn average score (must be 8.0+)
- Checks WhatsApp average score (must be 8.0+)
- Validates all content meets Grammy-level standards
- Reports quality scores in summary

### Phase 6: Advisor Notifications
- Creates notification message for each advisor
- Includes session ID and file locations
- Saves to: notifications.json
- Messages prepared (requires WhatsApp Business API to send)

### Phase 7: Summary & Completion
- Creates master summary.json with all file locations
- Reports total duration
- Shows quick access paths for all content

```
📱 WHATSAPP DISTRIBUTION READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [X] viral messages created
✅ Quality score: [8.5/10]
✅ Compliance: PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose distribution option:
1️⃣ Send NOW to all advisors
2️⃣ Send to TEST group first (5 advisors)
3️⃣ Schedule for 9:00 AM tomorrow
4️⃣ Schedule for custom time
5️⃣ Review content first
6️⃣ Cancel distribution

Enter choice (1-6): _
```

### IMPLEMENTATION:
After Phase 5 validation completes, execute:
```bash
node /Users/shriyavallabh/Desktop/mvp/interactive-distribution.js
```

This will:
1. Display content statistics and quality scores
2. Present the 6 distribution options to the user
3. Wait for user input (1-6)
4. Execute chosen action:
   - **Options 1-4**: Trigger **distribution-controller** with parameters
   - **Option 5**: Show content samples, then re-display menu
   - **Option 6**: Save and exit without sending

### Distribution Execution:
- **Option 1**: `distribution-controller --mode=production --send-all`
- **Option 2**: `distribution-controller --mode=test --limit=5`
- **Option 3**: `distribution-controller --schedule="09:00" --next-day`
- **Option 4**: `distribution-controller --schedule="[user-time]"`

### Post-Distribution (automatic if distributed):
- **analytics-tracker**: Tracks engagement metrics in background
- **feedback-processor**: Monitors WhatsApp responses automatically

## Communication Throughout & Viral Quality Enforcement
- **communication-bus**: Available to all agents for messaging
- Agents can trigger it anytime for cross-agent communication
- **MANDATORY FEEDBACK LOOP**: When content scores < 8.0 virality:
  1. quality-scorer REJECTS content
  2. communication-bus notifies content creators
  3. Agents MUST regenerate with HIGHER creativity
  4. Process repeats until virality >= 8.0
- **Viral Strategy Rotation**: Each day uses different creator formula
  - Monday: Warikoo personal stories
  - Tuesday: Ranade simple analogies
  - Wednesday: Shrivastava contrarian data
  - Thursday: Sharan pop culture hooks
  - Friday: Case studies with proof

## Key Features & Viral Content Guarantee
✅ Real Task tool invocations (not simulation)
✅ Infrastructure agents enable communication
✅ State persistence across agents
✅ Bidirectional messaging via communication-bus
✅ Session-specific timestamped outputs
✅ **VIRAL CONTENT ONLY** - No generic messages ever
✅ **8.0+ Virality Score** - Enforced by quality-scorer
✅ **Nobel-Level Writing** - Warikoo, Ranade, Shrivastava methods
✅ **TEXT + JSON Output** - Content ready for immediate use
✅ **Automatic Regeneration** - Until Grammy-worthy quality achieved