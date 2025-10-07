# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JarvisDaily** (jarvisdaily.com) - WhatsApp-based Grammy-level viral content distribution system for financial advisors. Generates 9.0+ virality content using optimized AI agents and delivers via Meta WhatsApp Direct API.

**Official Domain**: jarvisdaily.com
**WhatsApp Provider**: Meta Direct API (saves ₹28,788/year vs AiSensy)
**Content Standard**: Grammy/Oscar-level (minimum 9.0/10 virality score)
**Content Strategy**: **1 asset per advisor per day** (Option A with quality regeneration)
**Current Status**: 14-agent pipeline with auto-regeneration, emergency templates ready

## Core Commands

### Primary Execution
```bash
node run-finadvise-mvp.js        # Quick MVP test run
node execute-finadvise-mvp.js    # Full orchestration with image generation
python3 orchestrate-finadvise.py # Python orchestration with session management
/o                               # Slash command for viral content generation
```

### WhatsApp Delivery (Meta Direct - No AiSensy)
```bash
node create-template-meta-direct.js  # Create utility template via Meta API
node send-via-meta-direct.js         # Send daily messages via Meta API (saves ₹28K/year!)
node check-meta-limits.js            # Check Meta account limits and tiers
vercel logs --follow                 # Monitor webhook events
```

### Setup & Documentation
```bash
START-HERE.md                    # Read this first for WhatsApp setup
STEP-BY-STEP-META-SETUP.md      # Complete Meta API setup guide (30-45 min)
QUICK-CHECKLIST.md               # Progress tracking checklist
AISENSY-VS-META-DIRECT.md        # Cost comparison (save ₹28,788/year)
```

### Deployment (Vercel)
```bash
npm run dev     # Local development server
vercel --prod   # Deploy to production
vercel logs     # View production logs
```

## Architecture

### Three-Layer System
```
1. Content Generation Pipeline (14 Agents):
   Infrastructure → Data → Analysis → Generation → Enhancement → Validation → Distribution

2. WhatsApp Delivery Flow:
   Utility Template → Button Click → Webhook Handler → Content Package Delivery

3. Session Management:
   Isolated sessions with shared memory, communication bus, and learning extraction
```

### Critical Files
```
/api/webhook.js                  - Vercel serverless webhook (handles button clicks)
/orchestrate-finadvise.py        - Python orchestration with full agent coordination
/.claude/commands/o.md           - Viral content command (Grammy-level only)
/data/advisors.json             - Advisor configurations
/.env                           - Environment variables (Meta, Gemini, Twilio APIs)
```

### Agent System (14 Agents)
```
Infrastructure: mcp-coordinator, state-manager, communication-bus
Data Layer: advisor-data-manager, market-intelligence
Analysis: segment-analyzer
Content: linkedin-post-generator-enhanced, whatsapp-message-creator, status-image-designer
Enhancement: gemini-image-generator, brand-customizer
Validation: compliance-validator, quality-scorer, fatigue-checker
Distribution: distribution-controller
Monitoring: analytics-tracker, feedback-processor
```

## Environment Configuration

### Required Variables
```bash
WHATSAPP_PHONE_NUMBER_ID=574744175733556    # Meta Business phone ID
WHATSAPP_ACCESS_TOKEN=<token>               # Meta Business API token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<verify>      # Webhook verification
GEMINI_API_KEY=<key>                        # Google Gemini for images
TWILIO_ACCOUNT_SID=<sid>                    # Alternative WhatsApp provider
```

## Implementation Requirements

### WhatsApp API Patterns
- Use Meta Business API v17.0+
- Phone format: Include country code (919765071249)
- Message structure: `messaging_product: "whatsapp"` required
- Button messages: Use `interactive` type with `reply` buttons
- App Secret Proof required for secure API calls

### Viral Content Standards (Option A: 1 Asset Per Advisor)
- **Minimum Score**: 9.0/10 virality (raised from 8.0 for single-asset quality)
- **Formula**: (Hook × Story × Emotion) + (Specificity × Simplicity) + CTA²
- **Proven Strategies**: Warikoo stories, Ranade analogies, Shrivastava data
- **Character Limit**: 300-400 for WhatsApp, 2500-3000 for LinkedIn
- **Output Format**: Both JSON and TEXT files (never just JSON)
- **Quality Regeneration**:
  - If asset scores <9.0/10, auto-regenerate with specific improvements
  - Max 2 regeneration attempts per asset
  - Emergency fallback: Use curated template (9.5+/10) if regeneration fails
- **Asset Count**: 1 LinkedIn + 1 WhatsApp + 1 Status image per advisor per day
- **Cost Savings**: Option A saves ₹126,000/year on WhatsApp delivery (vs 3 assets/advisor)

### Image Generation (Gemini 2.5 Flash Image Preview)
- **Model**: `gemini-2.5-flash-image-preview`
- **Critical**: Use **reference image technique** for aspect ratio control
- **WhatsApp Status Format**: 1080×1920 pixels (9:16 vertical portrait)
- **Generation Process**:
  1. Create 1080×1920 reference image
  2. Upload reference to Gemini API
  3. Generate with reference + detailed prompt
  4. Upscale if needed (768×1344 → 1080×1920)
- **Quality Control (MANDATORY)**:
  1. AI visual validation (Gemini Vision)
  2. Auto-reject if: debug text, duplicate text, alignment issues, stretching
  3. Auto-regenerate failed images with specific fixes
  4. Re-validate until 100% pass rate (max 3 attempts)
- **Scripts**:
  - `scripts/gemini-with-reference-image.py` - Generate with reference
  - `scripts/visual-quality-validator.py` - AI visual quality auditor
  - `scripts/auto-regenerate-failed-images.py` - Auto-fix failed images
  - `scripts/quality-control-pipeline.py` - Complete automated pipeline
- **Key Learnings**:
  - Gemini API adopts aspect ratio from reference image, NOT text prompts
  - Visual validation is CRITICAL - catches debug text, duplication, typos, stretching
  - Automated regeneration with specific feedback improves success rate to near 100%

### Session Architecture
```javascript
sessionId: session_${timestamp}
outputDir: /output/session_*/
sharedMemory: /data/shared-memory.json
messageBus: /data/communication-channels/
learnings: /learnings/learning_${sessionId}.md
```

## Deployment Strategy

### Vercel Setup
1. Deploy to Vercel (Meta can't reach localhost)
2. Set environment variables in Vercel dashboard
3. Verify webhook at `/webhook` endpoint
4. Routes configured in `vercel.json`

### Testing Protocol
1. Test with single advisor first
2. Verify webhook receives button clicks
3. Check actual WhatsApp delivery (not just API response)
4. Monitor `/output/session_*/` for generated content

## File Management Rules

**CRITICAL**: Avoid creating garbage files in root directory!

### Allowed in Root
- Core config files: package.json, .env, vercel.json, tsconfig.json
- Main orchestration: orchestrate-*.js, run-*.js, execute-*.js
- Core agents: agents/*.js
- Documentation: CLAUDE.md, README.md (if needed)

### NEVER in Root
- Temporary test files
- Debugging scripts (send-*, test-*, check-*, debug-*)
- Setup/troubleshooting scripts
- Duplicate functionality files

### Cleanup Protocol
**Before creating ANY file in root:**
1. Check if functionality already exists
2. If temporary/debug: Put in `/archive/troubleshooting/`
3. If test: Put in `/archive/testing/`
4. If permanent: Use proper directory structure
5. Document in CLAUDE.md if file needs deletion later

**Temporary Files Created (TO BE REMOVED AFTER USE):**
- (None currently - keep it that way!)

## Common Issues & Solutions

### Webhook Not Receiving
- Verify Vercel deployment is live
- Check Meta webhook configuration points to Vercel URL
- Confirm verify token matches in both Meta and .env

### Content Not Viral Enough
- Check quality-scorer output (must be ≥8.0/10)
- Verify using proven viral formulas
- Review fatigue-checker for content freshness

### Missing Files
- Create `/data/advisors.json` if missing
- Ensure `/data/market-intelligence.json` exists
- Initialize shared memory files in `/data/`

## Agent Execution Patterns

### Slash Command `/o`
Executes 14-agent pipeline with interactive distribution decision:
1. Phase 0: Infrastructure setup
2. Phase 1: Data loading
3. Phase 2: Segment analysis
4. Phase 3: Viral content generation
5. Phase 4: Enhancement & branding
6. Phase 5: Validation & scoring
7. Phase 6: Interactive distribution menu

### Python Orchestration
```python
orchestrator = FinAdviseOrchestrator()
orchestrator.execute_pipeline()  # Runs all 14 agents
# Creates session_*, shared memory, communication logs
```

### Individual Agent Testing
Agents can run standalone for debugging:
```bash
python3 linkedin-viral-generator.py
node execute-finadvise-mvp.js --agent=quality-scorer
```