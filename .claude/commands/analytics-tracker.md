---
command: analytics-tracker
description: Tracks comprehensive metrics for content performance, delivery success, engagement rates, and provides actionable insights
icon: 📈
---

# Analytics Tracker Command

When you run `/analytics-tracker`, I will:

1. **Collect performance metrics** from all delivered content
2. **Track engagement rates** for LinkedIn and WhatsApp
3. **Monitor delivery success** rates
4. **Generate analytics report** with actionable insights
5. **Save metrics** to `data/analytics-report.json`

## Expected Output

- Creates: `data/analytics-report.json`
- Contains: Performance metrics, engagement data, delivery stats, recommendations

## Prerequisites

- Content must be generated and distributed
- `data/distribution-report.json` should exist

## Usage

```bash
/analytics-tracker
```

This agent provides comprehensive analytics to optimize future content strategies.