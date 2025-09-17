---
description: Execute FinAdvise Master Orchestrator - Complete End-to-End Content Generation
---

# 🚀 MASTER ORCHESTRATOR - Complete Pipeline

## IMPORTANT: This invokes the FULL master agent
The actual master agent at `.claude/agents/master.md` contains 200+ lines of detailed instructions and will execute everything end-to-end.

## What the Master Agent Does:

### 🎯 CRITICAL: It will NOT STOP until complete
The master agent has explicit instructions to continue monitoring until every advisor has received their content.

### Complete Workflow:
1. **Phase 1: Data Collection**
   - Load all advisors from Google Sheets with customization
   - Fetch real-time market intelligence
   - Analyze advisor segments

2. **Phase 2: Content Generation**
   - Generate LinkedIn posts (1200+ characters)
   - Create WhatsApp messages (300-400 characters)
   - Design status images (1080x1920px)

3. **Phase 3: Image Creation**
   - Generate WhatsApp images (1200x628px) using Gemini
   - Apply advisor branding (logo, colors)
   - Create all visual assets

4. **Phase 4: Validation**
   - Check SEBI compliance (must pass)
   - Score quality (must be > 0.8)
   - Verify no content repetition

5. **Phase 5: Distribution**
   - Package all content
   - Prepare for distribution
   - Track completion

## The master coordinates ALL 14 agents:
advisor-data-manager → market-intelligence → segment-analyzer → linkedin-post-generator → whatsapp-message-creator → status-image-designer → gemini-image-generator → brand-customizer → compliance-validator → quality-scorer → fatigue-checker → distribution-controller → analytics-tracker → feedback-processor

## 📤 DISTRIBUTION OPTIONS AFTER GENERATION:
After content generation completes, you will be asked:

### **"Send now or schedule for 5 AM?"**

- **Option 1: Send Now** → Executes `webhook-utility-complete.js` or `send-utility-template.js` immediately
- **Option 2: Schedule for 5 AM** → Sets up PM2/cron job for 5:00 AM IST daily distribution

## 🔧 EXISTING SCRIPTS TO USE:
**IMPORTANT: DO NOT recreate these scripts - they already exist and work:**
- `webhook-utility-complete.js` - Main webhook handler (port 3000)
- `send-utility-template.js` - Sends utility messages
- `test-and-send-utility.js` - Test utility flow

## 📌 TO RUN WITH DISTRIBUTION:
```bash
node master-content-with-distribution.js
```

This will:
1. Generate all content
2. Ask if you want to send now or schedule
3. Use the EXISTING working scripts (no recreation needed!)

---
**This command executes the comprehensive master orchestrator from .claude/agents/master.md**