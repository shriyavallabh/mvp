---
name: orchestrate
description: Execute the complete FinAdvise content generation pipeline with all 14 agents
---

# Complete FinAdvise Orchestration Command

When this command is executed, I will orchestrate all 14 agents in the proper sequence with bidirectional feedback loops.

## Phase 1: Data Collection & Analysis
I will call these agents using the Task tool:

### 🔵 advisor-data-manager
**Task**: Load advisor data from Google Sheets
**Prompt**: Load all advisor data from data/advisor-data.json. Extract name, contact details, ARN codes, preferences, segments, and branding information. Save structured data to data/advisors.json.

### 🟣 market-intelligence
**Task**: Gather real-time market data
**Prompt**: Fetch latest market trends, news, insights for Indian markets (NSE, BSE) and mutual fund industry. Save to data/market-intelligence.json.

### 🟠 segment-analyzer
**Task**: Analyze advisor segments
**Prompt**: Analyze advisor client segments (Gold, Premium, Silver) for targeted content strategy. Save analysis to data/segment-analysis.json.

## Phase 2: Content Generation
I will call these agents using the Task tool:

### 🟦 linkedin-post-generator
**Task**: Generate LinkedIn posts
**Prompt**: Create 1200+ character LinkedIn posts for each advisor based on their segment, brand voice, and market insights. Save to data/linkedin-posts.json.

### 🟩 whatsapp-message-creator
**Task**: Create WhatsApp messages
**Prompt**: Generate 300-400 character WhatsApp messages with emojis, CTAs, and segment-appropriate style. Save to data/whatsapp-messages.json.

### 🟨 status-image-designer
**Task**: Design status images
**Prompt**: Design WhatsApp Status images (1080x1920px) with brand colors, market data, and mobile optimization. Save specs to data/status-image-designs.json.

## Phase 3: Visual Content Creation
I will call these agents using the Task tool:

### 🔴 gemini-image-generator
**Task**: Generate marketing images
**Prompt**: Create marketing images using Gemini imagen3 API based on design specifications. Save details to data/generated-images.json.

### 🟪 brand-customizer
**Task**: Apply advisor branding
**Prompt**: Apply advisor-specific branding (colors, logos, taglines) to all content. Save to data/branded-content.json.

## Phase 4: Validation & Quality (WITH FEEDBACK LOOPS)
I will call these agents using the Task tool:

### 🔥 compliance-validator
**Task**: Validate SEBI compliance
**Prompt**: Check all content for SEBI compliance, disclaimers, ARN codes. If violations found, trigger feedback to regenerate content. Save to data/compliance-validation.json.

### 📊 quality-scorer
**Task**: Score content quality
**Prompt**: Score content on engagement, clarity, value proposition. If score < 0.8, trigger regeneration. Save to data/quality-scores.json.

### ⚡ fatigue-checker
**Task**: Check content uniqueness
**Prompt**: Detect content repetition and template fatigue. If repetition found, suggest alternatives and trigger regeneration. Save to data/fatigue-analysis.json.

### 🔄 feedback-processor
**Task**: Process feedback and regenerate
**Prompt**: If any validation agent detected issues, regenerate the failing content with specific fixes. Save regenerated content to data/regenerated-content.json.

## Phase 5: Distribution & Tracking
I will call these agents using the Task tool:

### 🚀 distribution-controller
**Task**: Manage content distribution
**Prompt**: Package all validated content for distribution with delivery tracking. Save to data/distribution-package.json.

### 📈 analytics-tracker
**Task**: Track performance metrics
**Prompt**: Initialize comprehensive analytics tracking for the entire pipeline. Save configuration to data/analytics-config.json.

## Execution Protocol

1. **I will call each agent sequentially** using the Task tool with proper subagent_type
2. **After each phase**, I will verify outputs and check for feedback triggers
3. **If validation fails**, I will automatically call feedback-processor to regenerate content
4. **I will continue until** all content is validated and distribution-ready
5. **Finally**, I will execute the content generation scripts:
   - `node execute-content-generation.js`
   - `node execute-image-generation.js`

## Success Criteria
- ✅ All 14 agents executed successfully
- ✅ All validation scores above thresholds
- ✅ Bidirectional feedback loops working
- ✅ Actual content files generated in output/ directory
- ✅ Distribution package ready

This command will show all the color-coded agent executions you want to see while maintaining the bidirectional feedback loops and automation you requested.