---
command: geminiimagegenerator
description: Generates professional marketing images using Google's Gemini 2.5 Flash API with automatic branding and fallback mechanisms
icon: 🖼️
---

# Gemini Image Generator Command

When you run `/geminiimagegenerator`, I will:

1. **Create Python script** at runtime in `temp-unused-files/temp-scripts/`
2. **Execute script** using Gemini API for image generation
3. **Apply advisor branding** including logos, colors, taglines, and ARN numbers
4. **Generate multiple formats**:
   - WhatsApp Marketing (1200x628px)
   - WhatsApp Status (1080x1920px)
   - LinkedIn Post (1200x627px)
5. **Implement fallbacks** if API fails (PIL-based generation)
6. **Save images** to `output/images/` directory
7. **Log execution** to `worklog/worklog-[timestamp].md`

## Expected Input/Output

### Input Requirements:
- Structured image specification with prompt and dimensions
- Advisor data from `data/advisor-data.json` including branding elements
- Valid `GEMINI_API_KEY` environment variable

### Output Deliverables:
- **Branded images** in PNG format with correct dimensions
- **Execution logs** with detailed generation process
- **JSON response** with file paths and success metrics
- **Script archive** in `temp-unused-files/executed-scripts/`

## Success Criteria

✅ Images generated within 15 seconds (API) or 5 seconds (fallback)
✅ All branding elements applied (logo, colors, ARN)
✅ Files saved with pattern: `[advisor_id]_[type].png`
✅ 95% success rate including fallback mechanisms
✅ Complete audit trail in worklog

## Execution Guardrails

- **Timeout**: 30 seconds per generation attempt
- **Max Retries**: 3 attempts per fallback level
- **Security**: API keys via environment variables only
- **Cleanup**: Scripts moved to executed-scripts after completion

## Usage

```bash
/geminiimagegenerator
```

This agent ensures reliable image generation with professional branding, using AI when available and intelligent fallbacks when needed.