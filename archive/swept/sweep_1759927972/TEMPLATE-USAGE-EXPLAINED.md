# Emergency Templates - How They Work

## What We Have Now

**3 Templates Created** (all for `premium_professional` segment):

1. **LinkedIn Template**: `data/emergency-templates/linkedin/premium_professional.json`
2. **WhatsApp Template**: `data/emergency-templates/whatsapp/premium_professional.json`
3. **Status Image Template**: `data/emergency-templates/status-images/premium_professional.json`

---

## Template Structure

### LinkedIn/WhatsApp Templates (Text Content)

```json
{
  "title": "HNI Portfolio Rebalancing - Market Volatility",
  "segment": "premium_professional",
  "content_type": "linkedin",
  "virality_score": 9.6,
  "last_updated": "2025-10-07",
  "content": "A client called yesterday...",  // ← ACTUAL READY-TO-USE CONTENT
  "metadata": {
    "hook_type": "client_story",
    "emotional_trigger": "fear_to_confidence",
    "cta_type": "thought_leadership"
  },
  "placeholders": {
    "[TAGLINE]": "advisor.tagline",    // ← Gets replaced with real data
    "[ARN_NUMBER]": "advisor.arn"      // ← Gets replaced with real data
  },
  "usage_count": 0,
  "last_used": null
}
```

**Key Point**: The `content` field contains **ACTUAL COMPLETE CONTENT**, not a prompt!

### Status Image Templates (Design Specifications)

```json
{
  "title": "HNI Wealth Protection Quote",
  "segment": "premium_professional",
  "content_type": "status_image",
  "virality_score": 9.5,
  "design_spec": {                    // ← DESIGN INSTRUCTIONS (not content)
    "dimensions": "1080x1920",
    "background": "Navy gradient",
    "headline": {
      "text": "Wealth isn't built\nin bull markets",  // ← Actual text to display
      "font_size": "110px",
      "color": "#FFFFFF"
    },
    "branding": {
      "logo": "[LOGO_PATH]",          // ← Placeholder for advisor logo
      "tagline": "[TAGLINE]",
      "arn": "ARN: [ARN_NUMBER]"
    }
  }
}
```

**Key Point**: Contains **DESIGN SPECIFICATIONS**, not actual image. Image generator uses these specs.

---

## How Templates Are Used

### Scenario: Content Generation Fails

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Generate LinkedIn Post for ADV001               │
│         (Premium Professional advisor)                   │
└─────────────────────────────────────────────────────────┘
                         ↓
                   AI generates post
                         ↓
                  Quality Scorer runs
                         ↓
                 Score: 7.3/10 ❌ (below 9.0)
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Quality Regeneration Loop Triggered             │
│         - Identify weaknesses: emotion (6.2), CTA (7.0) │
│         - Generate improvement prompt                    │
│         - Regenerate content (Attempt 1)                │
└─────────────────────────────────────────────────────────┘
                         ↓
                  Re-score content
                         ↓
                 Score: 8.2/10 ❌ (still below 9.0)
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Try Again (Attempt 2)                           │
│         - Regenerate with stronger improvements         │
└─────────────────────────────────────────────────────────┘
                         ↓
                  Re-score content
                         ↓
                 Score: 8.7/10 ❌ (STILL below 9.0)
                         ↓
                Max attempts reached (2)
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: EMERGENCY FALLBACK TEMPLATE                     │
│                                                          │
│ 1. Identify advisor segment: "premium_professional"     │
│ 2. Load template:                                        │
│    data/emergency-templates/linkedin/                    │
│    premium_professional.json                             │
│                                                          │
│ 3. Read template content:                               │
│    "A client called yesterday.                          │
│    'Should I move everything to gold?'..."              │
│                                                          │
│ 4. Replace placeholders:                                │
│    [TAGLINE] → "Building Wealth, Creating Trust"        │
│    [ARN_NUMBER] → "ARN-125847"                          │
│                                                          │
│ 5. Final content (9.6/10 guaranteed):                   │
│    "A client called yesterday.                          │
│    'Should I move everything to gold?'...               │
│    Building Wealth, Creating Trust                      │
│    ARN-125847"                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
              ✅ APPROVED FOR DISTRIBUTION
```

---

## Templates Are NOT Prompts - They Are Ready Content

### ❌ Templates Are NOT Like This (Prompts):
```json
{
  "prompt": "Generate a LinkedIn post about market volatility for HNI advisors",
  "instructions": "Include client story, use authoritative tone..."
}
```

### ✅ Templates ARE Like This (Actual Content):
```json
{
  "content": "A client called yesterday.\n\n\"Should I move everything to gold?\"\n\nMarkets down 3%. Portfolio value: ₹47 lakhs...",
  "virality_score": 9.6
}
```

**The difference**:
- **Prompts** need AI to generate content → unpredictable quality
- **Templates** are pre-written, pre-validated content → guaranteed 9.5+/10

---

## How Template Selection Works

### Code Flow in `quality-regeneration-loop.py`:

```python
# Step 1: Asset fails quality check after 2 regeneration attempts
if attempts >= 2 and score < 9.0:

    # Step 2: Identify advisor segment
    advisor_segment = "premium_professional"  # From advisor data
    content_type = "linkedin"                  # From asset type

    # Step 3: Load template
    template = load_fallback_template(
        content_type="linkedin",
        advisor_segment="premium_professional"
    )

    # Step 4: Template loaded
    # File: data/emergency-templates/linkedin/premium_professional.json
    template = {
        "content": "A client called yesterday...",
        "virality_score": 9.6,
        "placeholders": {
            "[TAGLINE]": "advisor.tagline",
            "[ARN_NUMBER]": "advisor.arn"
        }
    }

    # Step 5: Replace placeholders with real advisor data
    final_content = template['content']
    final_content = final_content.replace("[TAGLINE]", advisor.tagline)
    final_content = final_content.replace("[ARN_NUMBER]", advisor.arn)

    # Step 6: Save as final approved content
    save_to_distribution(final_content)  # Guaranteed 9.6/10
```

---

## Example: Complete Flow

### ADV001 (Shruti Petkar - Premium Professional)

**Generated Content** (AI attempt):
```
Markets are volatile today.

Consider your portfolio allocation.

Contact me for advice.

ARN-125847
```
**Score**: 6.5/10 ❌
- Weak hook (4.0)
- No story (3.0)
- Low emotion (2.0)
- Generic CTA (5.0)

**After 2 Regeneration Attempts**:
```
Market correction of 3% today.

HNI portfolios need strategic rebalancing.
Tax-loss harvesting opportunities available.

Review your allocation strategy.

Building Wealth, Creating Trust
ARN-125847
```
**Score**: 8.4/10 ❌ (better, but still below 9.0)

**Emergency Template Applied**:
```
A client called yesterday.

"Should I move everything to gold?"

Markets down 3%. Portfolio value: ₹47 lakhs.

Here's what I told him:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Panic selling in volatile markets is how wealth gets destroyed.

Not by market corrections.
By emotional decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What we did instead:

1. Reviewed his 10-year goals (unchanged)
2. Analyzed asset allocation (still optimal)
3. Identified tax-loss harvesting opportunities
4. Rebalanced to target ratios

Result: Portfolio stronger. Emotions calmer. Strategy intact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For HNI portfolios (₹50L+):

✓ Volatility is opportunity (not risk)
✓ Rebalancing > Panic selling
✓ Tax efficiency > Emotional comfort
✓ Strategy > Market timing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your wealth isn't built in bull markets.

It's protected in corrections.

Building Wealth, Creating Trust
ARN-125847

#WealthManagement #HNIInvesting #PortfolioStrategy

Mutual fund investments are subject to market risks.
```
**Score**: 9.6/10 ✅ **APPROVED**

---

## Why We Need 9 More Templates

### Current Coverage: 1/4 Segments

| Segment | LinkedIn | WhatsApp | Status Image | Total |
|---------|----------|----------|--------------|-------|
| Premium Professional | ✅ | ✅ | ✅ | **3/3** |
| Gold Analytical | ❌ | ❌ | ❌ | **0/3** |
| Premium Educational | ❌ | ❌ | ❌ | **0/3** |
| Silver Modern | ❌ | ❌ | ❌ | **0/3** |

**Problem**: If ADV002 (Gold Analytical) or ADV004 (Silver Modern) need emergency fallback, we have **no appropriate template**!

### What Happens Without Templates?

**Option 1: Use wrong segment template**
- ADV004 (beginner advisor) gets HNI template
- Content talks about "₹47 lakh portfolios"
- Advisor's clients have ₹10K portfolios
- **Result**: Completely irrelevant, loses trust

**Option 2: Use generic fallback** (hardcoded in code)
```python
def _get_generic_template(self, content_type):
    return {
        'content': 'Market volatility teaches us one truth...',
        'virality_score': 9.5
    }
```
- Generic, not personalized
- Doesn't match advisor tone
- **Result**: Safe but bland

**Option 3: Fail distribution**
- Don't send anything
- **Result**: Advisor gets no content that day ❌

---

## Template Design Philosophy

### They Are Pre-Written, High-Quality Content

**Like having a backup generator**:
- Primary power (AI generation): Fast, customized, usually works
- Backup generator (templates): Slower to set up, but reliable when needed
- You maintain the backup even if rarely used

### Quality Standards

All templates must be:
1. **Pre-validated**: Manually reviewed, scored 9.5+/10
2. **Segment-appropriate**: Tone matches advisor persona
3. **SEBI compliant**: ARN, disclaimers, no guarantees
4. **Evergreen**: Works in any market condition
5. **Placeholder-ready**: [TAGLINE], [ARN_NUMBER] replaced dynamically

### When Templates Are Used

**Frequency estimate** (based on 9.0/10 threshold):
- 1st generation success rate: ~80% (8 of 10 advisors)
- After 1st regeneration: ~90% (9 of 10 advisors)
- After 2nd regeneration: ~95% (19 of 20 advisors)
- **Template usage**: ~5% (1 in 20 advisors per day)

**For 500 advisors**:
- Daily template usage: ~25 advisors (5%)
- Monthly: ~750 times
- **Templates are rare but critical safety net**

---

## Summary

### What Templates Are
✅ Pre-written, ready-to-use content (9.5+/10 quality)
✅ Segment-specific (matches advisor persona)
✅ Emergency fallback (when AI fails)

### What Templates Are NOT
❌ NOT prompts for AI to generate from
❌ NOT low-quality placeholder text
❌ NOT the primary content source

### Why We Need 9 More
- We have 4 advisor segments
- Currently only 1 segment covered (premium_professional)
- Need 3 templates per segment (LinkedIn, WhatsApp, Status)
- **3 segments × 3 templates = 9 more needed**

### Current Status
- **Created**: 3 templates (premium_professional only)
- **Needed**: 9 more (gold_analytical, premium_educational, silver_modern)
- **Total**: 12 templates for complete coverage

---

**Do you want me to create the remaining 9 templates now, or test with what we have first?**
