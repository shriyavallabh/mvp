---
command: feedback-processor
description: Processes admin and advisor feedback to improve content quality, handles revision requests, and learns from preferences
icon: 💬
---

# Feedback Processor Command

When you run `/feedback-processor`, I will:

1. **Collect feedback** from admins and advisors
2. **Analyze feedback patterns** for improvements
3. **Process revision requests** for content
4. **Update preferences** based on feedback
5. **Learn and adapt** content strategies
6. **Save feedback analysis** to `data/feedback-analysis.json`

## Expected Output

- Creates: `data/feedback-analysis.json`
- Contains: Feedback summary, improvement suggestions, preference updates
- Updates: Advisor preferences in `data/advisor-data.json`

## Prerequisites

- Content must be generated and distributed
- Feedback data available (manual input or from system)

## Usage

```bash
/feedback-processor
```

This agent continuously improves content quality based on real feedback.