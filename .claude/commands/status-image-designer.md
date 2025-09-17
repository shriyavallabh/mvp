---
command: status-image-designer
description: Designs diverse WhatsApp Status images (1080x1920) including educational content, animations, infographics, and market updates
icon: 🖼️
---

# Status Image Designer Command

When you run `/status-image-designer`, I will:

1. **Analyze trending topics** and market events
2. **Select appropriate content type** (educational, motivational, market update)
3. **Design status image specifications** (1080x1920 vertical)
4. **Create design prompts** for image generation
5. **Save specifications** to `data/status-image-designs.json`
6. **Trigger image generation** via execute-image-generation.js

## Expected Output

- Creates: `data/status-image-designs.json`
- Contains: Image specifications, prompts, dimensions, content types
- Triggers: Actual image generation in `output/images/`

## Prerequisites

- `data/advisor-data.json` must exist
- `data/market-intelligence.json` for market-based designs

## Usage

```bash
/status-image-designer
```

This agent creates engaging vertical images optimized for WhatsApp Status viewing.