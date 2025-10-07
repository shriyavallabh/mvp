# Emergency Template Library

## Purpose

High-quality curated templates (9.5+/10 virality) used as fallback when:
1. Content generation fails
2. Quality regeneration fails after 2 attempts
3. Emergency content needed immediately

## Structure

```
emergency-templates/
├── linkedin/
│   ├── premium_professional.json    (HNI/Ultra-HNI segment)
│   ├── gold_analytical.json         (Affluent professionals)
│   ├── premium_educational.json     (HNI seeking empowerment)
│   └── silver_modern.json           (Mass affluent beginners)
│
├── whatsapp/
│   ├── premium_professional.json
│   ├── gold_analytical.json
│   ├── premium_educational.json
│   └── silver_modern.json
│
└── status-images/
    ├── premium_professional.json
    ├── gold_analytical.json
    ├── premium_educational.json
    └── silver_modern.json
```

## Template Requirements

Each template JSON must include:
```json
{
  "title": "Template Name",
  "segment": "premium_professional",
  "content_type": "linkedin",
  "virality_score": 9.5,
  "last_updated": "2025-10-07",
  "content": "...",
  "metadata": {
    "hook_type": "shocking_statistic",
    "emotional_trigger": "aspiration",
    "cta_type": "engagement"
  },
  "usage_count": 0,
  "last_used": null
}
```

## Quality Standards

- **Minimum virality**: 9.5/10
- **SEBI compliant**: ARN placeholders, disclaimers included
- **Evergreen content**: Market-agnostic (or use placeholders)
- **Segment-appropriate**: Tone matches advisor persona
- **Tested**: Pre-validated by humans before adding

## Usage Tracking

- Track usage_count to rotate templates
- Never use same template twice within 30 days
- Update last_used timestamp on each use

## Maintenance

- Review quarterly (Jan, Apr, Jul, Oct)
- Update with new market trends
- Replace low-performers
- Add new segments as business grows

## Current Status

**Created**: October 7, 2025
**Templates**: 0 (TO BE ADDED)
**Target**: 12 templates (4 segments × 3 content types)

## TODO

1. Create 4 LinkedIn templates (1 per segment)
2. Create 4 WhatsApp templates (1 per segment)
3. Create 4 Status image templates (1 per segment)
4. Test each template with real advisors
5. Validate virality scores
6. Integrate with quality-regeneration-loop.py
