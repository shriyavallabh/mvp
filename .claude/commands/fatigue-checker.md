---
command: fatigue-checker
description: Prevents content repetition by tracking historical content and ensuring fresh, diverse messaging across a 14-30 day window
icon: 🔄
---

# Fatigue Checker Command

When you run `/fatigue-checker`, I will:

1. **Load content history** from past 30 days
2. **Analyze current content** for similarity
3. **Check for repetitive themes** or messages
4. **Flag duplicate content** that's too similar
5. **Suggest alternatives** for flagged content
6. **Save fatigue analysis** to `data/fatigue-analysis.json`

## Expected Output

- Creates: `data/fatigue-analysis.json`
- Contains: Similarity scores, duplicate flags, freshness metrics
- Provides: Alternative content suggestions if needed

## Prerequisites

- Content must be generated (LinkedIn, WhatsApp)
- Historical content data (if available)

## Usage

```bash
/fatigue-checker
```

This agent ensures advisors' audiences receive fresh, engaging content without repetition.