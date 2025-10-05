---
description: FinAdvise Content Engine orchestration - complete multi-agent flow with learning system
---

# FinAdvise Content Engine Orchestration

Execute the complete FinAdvise content generation pipeline with automatic learning extraction:

## Agents Executed
1. **Advisor Data Manager**: Fetch advisor data from Google Sheets
2. **Market Intelligence**: Gather real-time market data and trends
3. **Segment Analyzer**: Analyze advisor segments for content customization
4. **LinkedIn Post Generator**: Create compelling LinkedIn posts (1200+ chars)
5. **WhatsApp Message Creator**: Generate engaging WhatsApp messages (300-400 chars)
6. **Status Image Designer**: Design WhatsApp Status images (research-based)
7. **Gemini Image Generator**: Generate professional images using Gemini 2.5 Flash
8. **Brand Customizer**: Apply advisor branding (logos, colors, taglines)
9. **Compliance Validator**: Validate content against SEBI guidelines
10. **Quality Scorer**: Score content quality for engagement and value
11. **Fatigue Checker**: Ensure content freshness (30-day lookback)
12. **Distribution Controller**: Manage multi-channel content distribution
13. **Analytics Tracker**: Track content performance metrics
14. **Feedback Processor**: Process and apply feedback for improvements

## Learning System
After execution, the system automatically:
- Extracts learnings from the session
- Identifies failures and improvement opportunities
- Creates timestamped learning documents in `learnings/` folder
- Enables application of learnings to improve future sessions

## Output Structure
```
output/
└── session_YYYY-MM-DDTHH-MM-SS-000Z/
    ├── advisor_data.json
    ├── market_intelligence.json
    ├── ADV_XXX_linkedin_*.txt
    ├── ADV_XXX_whatsapp_*.txt
    └── ADV_XXX_image_*.png

learnings/
└── learning_session_YYYY-MM-DDTHH-MM-SS-000Z.md
```

## Commands
- `/finadvise` - Run complete orchestration
- `python3 scripts/extract-learnings.py` - Extract learnings from session
- `python3 scripts/apply-learnings.py` - Apply learnings interactively
- `/learning-agent apply <session>` - Apply specific learning
- `/learning-agent review` - Review all pending learnings

## Learning Document Format
Each learning document contains:
- Session metadata and success rate
- Performance metrics
- Failures detected with root causes
- Improvement opportunities
- Action items for next session
- Status tracking (NOT_DONE/DONE)

The learning system ensures continuous improvement by:
1. Capturing session-specific insights
2. Identifying patterns across sessions
3. Automatically updating agent prompts
4. Creating feedback loops for optimization