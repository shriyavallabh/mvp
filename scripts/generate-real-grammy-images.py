#!/usr/bin/env python3
"""
REAL Gemini 2.5 Flash Image Preview - Grammy-Level Image Generation
Uses: gemini-2.5-flash-image-preview (ACTUAL image generation model)
"""

import os
import json
import sys
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import io

# Configuration
SESSION_DIR = "output/session_1759383378"
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    print("Run: export GEMINI_API_KEY='AIzaSyCUG910mCEcoY8sRZMvu4JGie925KZxRqY'")
    sys.exit(1)

# Configure Gemini with API key
genai.configure(api_key=GEMINI_API_KEY)

def create_silicon_valley_prompt(design_spec, advisor):
    """
    Create GRAMMY-LEVEL prompts for Gemini 2.5 Flash Image Preview
    World-class design standards from top Silicon Valley designers
    """

    headline = design_spec.get('viralHook', design_spec.get('contentLayout', {}).get('headline', 'Financial Advisory'))
    content_type = design_spec.get('contentType', 'professional_infographic')

    branding = design_spec.get('brandingElements', {})
    if isinstance(branding.get('colors'), dict):
        colors = [branding['colors'].get('primary', '#1B365D'), branding['colors'].get('accent', '#FFD700')]
    else:
        colors = ['#1B365D', '#FFD700']

    style = design_spec.get('visualStyle', 'professional modern')

    # Base prompt for all images
    base_prompt = f"""IMPORTANT: Create image in VERTICAL PORTRAIT 9:16 aspect ratio (1080 pixels wide × 1920 pixels tall).

Create a STUNNING, PROFESSIONAL WhatsApp Status image in VERTICAL PORTRAIT format (9:16 aspect ratio, 1080px wide × 1920px tall) for a financial advisor.

VISUAL QUALITY MANDATE:
- Grammy/Oscar-award worthy design
- Professional yet eye-catching
- Stop-scroll-worthy in thumbnail
- Clear on 5-inch mobile screens
- Comparable to Apple, Google, top fintech apps

DESIGN SPECIFICATIONS:
Main Headline: "{headline}"
Primary Color: {colors[0]}
Accent Color: {colors[1]}
Visual Style: {style}

COMPOSITION RULES:
1. Typography:
   - Hero text: "{headline}" - Bold, 96-120px, {colors[0]}
   - Supporting text: 48-64px, complementary
   - All text: Clean, professional fonts (Inter, Roboto, SF Pro style)
   - Crystal clear readability

2. Layout:
   - 80px safe padding from all edges (WhatsApp UI)
   - Golden ratio composition (1:1.618)
   - F-pattern reading flow
   - Focal point: Upper third

3. Visual Elements:
   - Geometric shapes for data
   - Subtle gradients ({colors[0]} to lighter)
   - Soft shadows (0-10px blur)
   - 1-2 minimal financial icons
   - 40% white space minimum

4. Color Psychology:
   - {colors[0]}: Trust, stability, expertise
   - {colors[1]}: Energy, growth, action
   - High contrast (4.5:1 minimum)
   - Professional color harmony

5. Brand Elements:
   - Logo placeholder: Bottom-right, 150x150px
   - Tagline: "{advisor['tagline']}" at bottom center, 32px
   - ARN: "{advisor['arn']}" at bottom-left, 24px, gray

"""

    # Content-specific directions
    specific_directions = {
        "tax_alert_infographic": """
SPECIFIC DESIGN FOR TAX ALERT:
- Create urgent yet premium tax visual
- Show countdown: "6 Months to March 31"
- Comparison chart: ₹1.5L vs ₹2L deductions
- Money symbols (₹) with impact
- Color scheme: Navy blue {colors[0]} + gold accents
- Style: Executive dashboard, clean data visualization
- Include: Progress bar or timeline showing urgency
- Visual hierarchy: Headline → Comparison → CTA
""",

        "sip_celebration_infographic": """
SPECIFIC DESIGN FOR SIP CELEBRATION:
- Inspirational success visual
- Show growth curve going up
- Display: "₹906 Crore DAILY" in huge text
- Celebration elements (subtle, professional)
- Color scheme: Forest green {colors[0]} + gold
- Style: Achievement unlock, modern
- Include: Upward trending arrow or graph
- Visual mood: Inspiring, validating, proud
""",

        "market_dashboard": """
SPECIFIC DESIGN FOR MARKET DASHBOARD:
- Professional market data display
- 3 metric cards showing:
  * GDP: 6.8% (with up arrow)
  * Inflation: 2.6% (with down arrow)
  * Repo Rate: 5.5% (held)
- Color scheme: Professional blue {colors[0]} + green accents
- Style: Bloomberg/Reuters quality dashboard
- Clean data visualization
- Corporate professional look
""",

        "educational_infographic": """
SPECIFIC DESIGN FOR EDUCATION:
- Step-by-step learning visual
- Numbered steps: 1 → 2 → 3
- Lightbulb moment icons (💡 style)
- Knowledge cards with info
- Color scheme: Warm brown {colors[0]} + orange
- Style: TED Talk presentation quality
- Clear progression flow
- Easy to understand at a glance
""",

        "comparison_infographic": """
SPECIFIC DESIGN FOR COMPARISON:
- Smart choice visual
- Two options side-by-side:
  * Left: iPhone (₹46,800)
  * Right: ELSS Investment (₹46,800 tax saved + returns)
- Pros/cons or value comparison
- Color scheme: Contrasting (green vs orange)
- Style: Clean infographic
- Clear winner indication
- ROI calculation shown
"""
    }

    specific = specific_directions.get(content_type,
        "Create a professional, eye-catching financial visual with clear hierarchy and modern minimalist design.")

    final_prompt = base_prompt + specific + f"""

TECHNICAL REQUIREMENTS:
- Exact resolution: 1080x1920 pixels (9:16 vertical)
- Format: High-quality PNG
- Safe zones: 80px padding
- Mobile-optimized
- Professional photography/design quality
- NO stock photos, NO clipart, NO amateur graphics
- Maximum 2 fonts
- Clean, modern, trustworthy aesthetic

OUTPUT: A Grammy-award-worthy financial marketing image that makes people STOP and READ immediately.
Style: Modern minimal, data-driven, trustworthy, aspirational"""

    return final_prompt

def generate_image_with_gemini(prompt, output_path, advisor_name):
    """Generate image using Gemini 2.5 Flash Image Preview"""
    try:
        print(f"   🎨 Generating with Gemini 2.5 Flash Image Preview...")

        # Use the CORRECT image generation model
        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')

        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.85,  # Balanced creativity
                'top_p': 0.95,
                'max_output_tokens': 8192
            }
        )

        # Check if response contains image
        if hasattr(response, 'parts'):
            for part in response.parts:
                if hasattr(part, 'inline_data'):
                    # Extract image data
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type

                    # Save image
                    if mime_type.startswith('image/'):
                        with open(output_path, 'wb') as f:
                            f.write(image_data)

                        # Verify image
                        img = Image.open(output_path)
                        print(f"   ✅ Image saved: {img.size[0]}x{img.size[1]}px")
                        return True

        # If no image in response, check text
        if response.text:
            print(f"   ⚠️  Model response (text): {response.text[:200]}...")

        return False

    except Exception as e:
        print(f"   ❌ Gemini error: {e}")
        return False

def main():
    print("\n🎨 GRAMMY-LEVEL IMAGE GENERATION (Gemini 2.5 Flash Image Preview)\n")
    print("═" * 70)

    # Load design specs
    specs_path = Path(SESSION_DIR) / "status-images" / "design-specifications.json"
    with open(specs_path) as f:
        design_data = json.load(f)

    # Load advisors
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    designs = design_data.get('designSpecifications', [])
    print(f"\n📊 Loaded {len(designs)} designs")
    print(f"   Model: gemini-2.5-flash-image-preview")
    print(f"   Quality: Grammy-level (Silicon Valley standard)\n")

    success_count = 0
    output_dir = Path(SESSION_DIR) / "status-images" / "generated-grammy"
    output_dir.mkdir(exist_ok=True)

    for idx, design in enumerate(designs, 1):
        advisor_id = design.get('advisorId', f'ADV{str(idx).zfill(3)}')

        # Find advisor
        advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
        if not advisor:
            continue

        advisor_info = {
            'name': advisor['personalInfo']['name'],
            'tagline': advisor['customization']['tagline'],
            'arn': advisor['personalInfo']['arn']
        }

        headline = design.get('viralHook', design.get('contentLayout', {}).get('headline', 'Financial Advisory'))
        visual_style = design.get('visualStyle', 'professional')

        print(f"\n📤 {advisor_info['name']} - Design {idx}")
        print(f"   {headline}")
        print(f"   Style: {visual_style}")

        # Create Grammy-level prompt
        prompt = create_silicon_valley_prompt(design, advisor_info)

        output_path = output_dir / f"GRAMMY_{advisor_id}_{str(idx).zfill(3)}.png"

        if generate_image_with_gemini(prompt, output_path, advisor_info['name']):
            success_count += 1
        else:
            print(f"   ⚠️  Generation failed, check API limits or model availability")

    print("\n═" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   Total designs: {len(designs)}")
    print(f"   Successfully generated: {success_count}")
    print(f"   Output: {output_dir}")

    if success_count > 0:
        print(f"\n✅ Grammy-level images ready!")
    else:
        print(f"\n⚠️  No images generated - check Gemini API access")

if __name__ == "__main__":
    main()
