---
command: segment-analyzer
description: Analyzes advisor client segments to tailor content strategy, tone, complexity, and topics for maximum relevance and engagement
icon: 📊
---

# Segment Analyzer Command

When you run `/segment-analyzer`, I will:

1. **Read advisor data** from `data/advisor-data.json`
2. **Analyze client segments** (Premium, Gold, Silver)
3. **Determine content preferences** for each segment
4. **Create segment analysis report** in `data/segment-analysis.json`
5. **Provide content recommendations** based on segment characteristics

## Expected Output

- Creates: `data/segment-analysis.json`
- Contains: Segment-specific content strategies, tone preferences, topic recommendations

## Prerequisites

- `data/advisor-data.json` must exist (created by advisor-data-manager)

## Usage

```bash
/segment-analyzer
```

This agent helps tailor content to match the specific needs and preferences of different advisor segments.