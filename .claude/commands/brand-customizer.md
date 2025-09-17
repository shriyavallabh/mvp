---
command: brand-customizer
description: Ensures 100% brand compliance by applying advisor logos, colors, taglines, and style guidelines to all content
icon: 🎨
---

# Brand Customizer Command

When you run `/brand-customizer`, I will:

1. **Load content** from `output/` directories (LinkedIn, WhatsApp, images)
2. **Fetch branding data** from `data/advisor-data.json`
3. **Apply brand elements** based on platform context:
   - Insert logos at platform-specific positions
   - Apply brand color schemes
   - Add taglines and disclaimers
4. **Handle errors gracefully** with fallback to defaults
5. **Log all actions** to `worklog/worklog-[timestamp].md`
6. **Update metrics** in `data/branded-content.json`

## Expected Input/Output

### Input Requirements:
- Generated content in `output/linkedin/`, `output/whatsapp/`, `output/images/`
- Advisor data with branding configuration in `data/advisor-data.json`

### Output Deliverables:
- **Branded content** with 100% compliance target
- **Action logs** detailing all branding operations
- **Performance metrics** for monitoring
- **Warning logs** for any fallback scenarios

## Success Criteria

✅ All content items have brand elements applied
✅ Processing completes within 60 seconds per item
✅ Error rate remains below 5%
✅ All actions logged for audit trail

## Usage

```bash
/brand-customizer
```

This agent transforms raw content into professionally branded assets ready for distribution.