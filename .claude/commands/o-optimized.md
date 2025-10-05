# Optimized FinAdvise Orchestration Command

Execute complete FinAdvise orchestration with CORRECT flow and real advisor data:

## Phase 0: Infrastructure Setup
1. **mcp-coordinator**: Initialize MCP environment
2. **state-manager**: Setup session state

## Phase 1: Data Foundation (PARALLEL)
- **advisor-data-manager**: Fetch REAL advisor data from Google Sheets
- **market-intelligence**: Gather market insights

## Phase 2: Analysis
- **segment-analyzer**: Analyze segments based on REAL advisor data

## Phase 3: Content Generation (PARALLEL)
- **linkedin-post-generator**: Create posts for REAL advisors
- **whatsapp-message-creator**: Create messages for REAL advisors
- **status-image-designer**: Design images for REAL advisors

## Phase 4: Enhancement (PARALLEL)
- **gemini-image-generator**: Generate images
- **brand-customizer**: Apply advisor-specific branding

## Phase 5: Validation (PARALLEL)
- **compliance-validator**: Check compliance
- **quality-scorer**: Score quality
- **fatigue-checker**: Check freshness

## Phase 6: Distribution (FINAL - MUST BE LAST)
- **distribution-controller**: Show distribution options and execute

## Phase 7: Post-Distribution Analytics (OPTIONAL - After user selects)
- **analytics-tracker**: Track metrics AFTER distribution
- **feedback-processor**: Process feedback for next run

## KEY REQUIREMENTS
✅ Use REAL advisor data from Google Sheets (not test data)
✅ Distribution controller MUST be the LAST agent before user interaction
✅ Analytics and feedback are OPTIONAL and run AFTER distribution
✅ Show clear distribution options at the END:
   1. Send Now
   2. Schedule at 5 AM IST
   3. Custom Schedule
   4. Cancel
✅ When user selects an option, actually send to real advisor phone numbers