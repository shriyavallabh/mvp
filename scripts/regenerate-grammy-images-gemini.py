#!/usr/bin/env python3
"""
REAL Gemini 2.5 Flash Image Generator - Grammy-Level Visuals
Regenerates pathetic placeholder images with actual AI-generated professional designs
"""

import os
import json
import sys
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import io
import base64

# Configuration
SESSION_DIR = "output/session_1759383378"
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in environment!")
    print("Run: export GEMINI_API_KEY='your_key_here'")
    sys.exit(1)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

def load_design_specs():
    """Load design specifications"""
    specs_path = Path(SESSION_DIR) / "status-images" / "design-specifications.json"
    with open(specs_path) as f:
        return json.load(f)

def create_grammy_level_prompt(design_spec, advisor):
    """
    Create GRAMMY-LEVEL visual prompts for Gemini
    Following world-class design principles from Silicon Valley designers
    """

    # Extract design elements
    headline = design_spec['content']['headline']
    virality_score = design_spec['virality_score']
    colors = design_spec['branding']['primary_colors']
    style = design_spec['visual_style']

    prompt = f"""Create an EXCEPTIONAL, GRAMMY-AWARD-WORTHY WhatsApp Status image (1080x1920px, 9:16) for a financial advisor.

VISUAL EXCELLENCE REQUIREMENTS:
- Design quality comparable to Apple, Google, or top Silicon Valley startups
- Stop-scroll-worthy: Must grab attention in 0.3 seconds
- Professional yet captivating: Balance trust and excitement
- Mobile-optimized: Crystal clear on 5-inch screens
- Minimalist with impact: Each element serves a purpose

DESIGN SPECIFICATIONS:
Headline: "{headline}"
Primary Colors: {colors[0]} (main), {colors[1]} (accent)
Visual Style: {style}
Brand: {advisor['name']} - {advisor['tagline']}

COMPOSITION RULES (Silicon Valley Designer Approach):
1. **Typography Hierarchy:**
   - Hero headline: Bold, 96-120px, {colors[0]}
   - Supporting text: 48-64px, complementary color
   - CTA: 56px, high contrast button
   - All text: Crisp, readable, professional fonts (Inter, SF Pro, Roboto)

2. **Visual Elements:**
   - Use geometric shapes for data visualization
   - Incorporate subtle gradients ({colors[0]} to lighter shade)
   - Add depth with soft shadows (0-10px blur)
   - Include 1-2 financial icons (minimal, line-style)

3. **Layout:**
   - 80px safe padding from all edges (WhatsApp UI clearance)
   - Golden ratio composition (divide canvas 1:1.618)
   - F-pattern reading flow (left-to-right, top-to-bottom)
   - Focal point: Upper third of image

4. **Color Psychology:**
   - Primary ({colors[0]}): Trust, stability, expertise
   - Accent ({colors[1]}): Energy, growth, action
   - White space: 40% minimum for breathability
   - Contrast ratio: 4.5:1 minimum (WCAG AAA)

5. **Emotional Triggers:**
   - If tax content: Urgency + Exclusivity (gold accents, countdown)
   - If SIP content: Inspiration + Validation (upward arrows, celebration)
   - If market data: Authority + Clarity (dashboard style, clean metrics)

6. **Brand Integration:**
   - Logo: Bottom-right, 150x150px, subtle
   - Tagline: "{advisor['tagline']}" - Bottom center, 32px
   - ARN: "{advisor['arn']}" - Bottom-left, 24px, gray

SPECIFIC VISUAL DIRECTION FOR THIS IMAGE:
{get_specific_direction(design_spec['content_type'])}

TECHNICAL REQUIREMENTS:
- Resolution: Exactly 1080x1920 pixels
- Format: PNG with transparency support
- File size: < 500KB (optimize for WhatsApp)
- Safe zones: 80px padding from edges
- Fonts: Use system-safe fonts (Arial, Helvetica) or web fonts

OUTPUT: A stunning, professional financial marketing image that looks like it was designed by a top-tier Silicon Valley design agency. The image should make people STOP scrolling and READ the content immediately.

Style: Modern minimal, data-driven, trustworthy, aspirational, professional but exciting
DO NOT include: Stock photos, clipart, amateur graphics, busy backgrounds, more than 2 fonts
"""
    return prompt

def get_specific_direction(content_type):
    """Get specific visual direction based on content type"""
    directions = {
        "tax_alert": "Create an urgent yet premium tax planning visual. Use countdown timer (6 months), money symbols (₹), comparison charts (₹1.5L vs ₹2L). Color: Navy blue + gold accents. Style: Executive dashboard.",

        "sip_celebration": "Design an inspirational SIP success visual. Show upward growth curve, celebration elements (🎉), impressive numbers (₹906 Cr daily). Color: Forest green + gold. Style: Achievement unlock.",

        "market_dashboard": "Build a professional market data dashboard. Include 3 metric cards (GDP, Inflation, Rate), trend indicators, clean data viz. Color: Professional blue + subtle green. Style: Bloomberg/Reuters quality.",

        "educational": "Create a step-by-step educational infographic. Use numbered steps (1→2→3), lightbulb moments (💡), knowledge cards. Color: Warm brown + orange. Style: TED Talk slide.",

        "comparison": "Design a smart choice comparison. Show two options side-by-side (iPhone vs Investment), pros/cons, ROI calculation. Color: Contrasting (green vs orange). Style: Infographic clarity."
    }
    return directions.get(content_type, "Create a professional, eye-catching financial advisory image with clear hierarchy and modern design.")

def generate_image_with_gemini(prompt, output_path):
    """Generate image using Gemini 2.5 Flash"""
    try:
        print(f"   🎨 Generating with Gemini 2.5 Flash...")

        # Use Gemini Imagen (image generation model)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.9,  # Creative but not random
                'top_p': 0.95,
                'max_output_tokens': 2048
            }
        )

        # Note: Gemini 2.5 Flash primarily generates text descriptions
        # For actual image generation, we need Imagen API or alternative
        print(f"   ⚠️  Gemini returned: {response.text[:200]}...")
        print(f"   💡 For actual image generation, use: google-generativeai with Imagen")

        return False

    except Exception as e:
        print(f"   ❌ Gemini error: {e}")
        return False

def main():
    print("\\n🎨 GRAMMY-LEVEL IMAGE REGENERATION (Real Gemini API)\\n")
    print("═" * 70)

    if not GEMINI_API_KEY:
        print("\\n❌ GEMINI_API_KEY not configured!")
        return

    # Load design specs
    design_data = load_design_specs()

    print(f"\\n📊 Loaded {len(design_data['designs'])} design specifications")
    print(f"   Current images: PATHETIC placeholders")
    print(f"   Target: Grammy-level professional designs\\n")

    # Load advisors
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    success_count = 0

    for design in design_data['designs']:
        advisor_id = design['advisor_id']
        design_num = design['design_number']

        # Find advisor
        advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
        if not advisor:
            continue

        print(f"\\n📤 {advisor['personalInfo']['name']} - Image {design_num}")
        print(f"   Design: {design['content']['headline']}")
        print(f"   Virality: {design['virality_score']}/10")

        # Create Grammy-level prompt
        prompt = create_grammy_level_prompt(design, {
            'name': advisor['personalInfo']['name'],
            'tagline': advisor['customization']['tagline'],
            'arn': advisor['personalInfo']['arn']
        })

        output_path = Path(SESSION_DIR) / "status-images" / "generated" / f"STATUS_{advisor_id}_{str(design_num).zfill(3)}_GRAMMY.png"

        if generate_image_with_gemini(prompt, output_path):
            success_count += 1
            print(f"   ✅ Grammy-level image generated!")
        else:
            print(f"   ⚠️  Gemini doesn't support direct image generation yet")
            print(f"   💡 Use DALL-E 3, Midjourney, or Stable Diffusion instead")

    print("\\n═" * 70)
    print(f"\\n📊 SUMMARY:")
    print(f"   Total designs: {len(design_data['designs'])}")
    print(f"   Grammy images: {success_count}")
    print(f"   \\n⚠️  NOTE: Gemini 2.5 Flash doesn't support image generation directly")
    print(f"   Use: DALL-E 3 API, Midjourney, or Stable Diffusion XL instead\\n")

if __name__ == "__main__":
    main()
