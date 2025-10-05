#!/usr/bin/env python3
"""
Gemini 2.5 Flash Image Generation with Reference Image
Uses reference image to control aspect ratio (1080x1920 vertical)
"""

import os
import sys
from pathlib import Path
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import json

SESSION_DIR = "output/session_1759383378"
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def create_reference_image():
    """Create 1080x1920 reference image for aspect ratio control"""
    ref_path = Path(SESSION_DIR) / "status-images" / "reference_1080x1920.png"
    ref_path.parent.mkdir(exist_ok=True, parents=True)

    # Create vertical WhatsApp Status format reference
    img = Image.new('RGB', (1080, 1920), color='#F5F5F5')
    draw = ImageDraw.Draw(img)

    # Add reference grid
    draw.rectangle([50, 50, 1030, 1870], outline='#1B365D', width=3)

    # Add text to show format
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 120)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 50)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    draw.text((540, 960), "1080 × 1920", fill='#1B365D', anchor='mm', font=font_large)
    draw.text((540, 1100), "WhatsApp Status", fill='#666666', anchor='mm', font=font_small)
    draw.text((540, 1170), "9:16 Vertical", fill='#666666', anchor='mm', font=font_small)

    img.save(ref_path, 'PNG', quality=95)
    print(f"✅ Reference image created: {ref_path}")
    return ref_path

def create_grammy_prompt(design_spec, advisor_info):
    """Create detailed prompt for Gemini image generation"""

    headline = design_spec.get('viralHook', design_spec.get('contentLayout', {}).get('headline', 'Financial Advisory'))
    content_type = design_spec.get('contentType', 'professional_infographic')

    # Extract colors correctly
    branding = design_spec.get('brandingElements', {})
    colors_obj = branding.get('colors', {})
    if isinstance(colors_obj, dict):
        primary_color = colors_obj.get('primary', '#1B365D')
        accent_color = colors_obj.get('accent', '#FFD700')
    else:
        primary_color = '#1B365D'
        accent_color = '#FFD700'

    visual_style = design_spec.get('visualStyle', {})
    style_desc = f"{visual_style.get('theme', 'professional')} {visual_style.get('mood', 'authoritative')}"

    prompt = f"""Using the reference image as the EXACT aspect ratio and dimensions guide, create a STUNNING professional WhatsApp Status image with these specifications:

CRITICAL: Match the reference image's vertical portrait format - 1080 pixels wide × 1920 pixels tall (9:16 ratio)

CONTENT:
Main Headline: "{headline}"
Primary Brand Color: {primary_color}
Accent Color: {accent_color}
Advisor: {advisor_info['name']}

DESIGN REQUIREMENTS:
1. Dimensions: EXACTLY 1080×1920 pixels (match reference image)
2. Orientation: Vertical portrait (9:16 aspect ratio)
3. Visual Style: {style_desc} - Grammy/Oscar award-worthy design

4. Typography:
   - Hero Headline: "{headline}"
   - Font: Bold, clean, modern (Inter/Roboto style)
   - Size: 96-120px for headline
   - Color: {primary_color}
   - Crystal clear readability on mobile

5. Layout Composition:
   - Safe padding: 80px from all edges (WhatsApp UI clearance)
   - Golden ratio composition (1:1.618)
   - F-pattern reading flow (top-left to bottom-right)
   - Focal point: Upper third of image
   - White space: Minimum 40%

6. Visual Elements:
   - Geometric shapes for data visualization
   - Subtle gradients using {primary_color}
   - Soft shadows (0-10px blur)
   - 1-2 minimal financial icons
   - Professional color harmony

7. Brand Elements (Bottom Area):
   - Bottom-left: "ARN: {advisor_info['arn']}" (28px, gray text)
   - Bottom-center: "{advisor_info['tagline']}" (36px, bold)
   - Bottom-right: Logo placeholder (150×150px circle)

CONTENT TYPE: {content_type}
{get_content_specific_direction(content_type, headline, primary_color, accent_color)}

QUALITY STANDARDS:
- Professional photography/design quality
- Stop-scroll-worthy in thumbnail view
- Clear on 5-inch mobile screens
- Comparable to Apple/Google/top fintech apps
- NO stock photos, NO clipart, NO amateur graphics
- Maximum 2 font families

OUTPUT: A Grammy-award-worthy financial marketing image in EXACT vertical portrait format (1080×1920) matching the reference image dimensions."""

    return prompt

def get_content_specific_direction(content_type, headline, primary_color, accent_color):
    """Return content-specific design directions"""

    if 'tax' in content_type.lower() or '₹2' in headline or 'Tax' in headline:
        return f"""
TAX ALERT SPECIFIC DESIGN:
- Visual Focus: Urgent yet premium tax savings alert
- Timeline: "6 Months to March 31" countdown bar
- Comparison: Side-by-side ₹1.5L vs ₹2L deductions
- Icons: Money/rupee symbols with impact
- Color Psychology: {primary_color} (trust) + {accent_color} (action)
- Style: Executive dashboard with clean data viz
- Hierarchy: Headline → Comparison Chart → Urgency CTA"""

    elif 'sip' in content_type.lower() or 'SIP' in headline or '₹906' in headline:
        return f"""
SIP CELEBRATION SPECIFIC DESIGN:
- Visual Focus: Inspirational investment success
- Key Metric: "₹906 Crore DAILY" in huge impactful text
- Graph: Growth curve trending upward
- Mood: Achievement unlock, proud moment
- Color Psychology: {primary_color} (stability) + {accent_color} (growth)
- Style: Modern celebration with professional restraint
- Elements: Upward arrow, progress indicators"""

    elif 'market' in content_type.lower() or 'RBI' in headline or 'GDP' in headline:
        return f"""
MARKET DASHBOARD SPECIFIC DESIGN:
- Visual Focus: Professional economic data display
- 3 Metric Cards showing:
  * GDP: 6.8% ↑ (up arrow, green)
  * Inflation: 2.6% ↓ (down arrow, green)
  * Repo Rate: 5.5% → (held, orange)
- Color Psychology: {primary_color} (authority) + green/orange accents
- Style: Bloomberg/Reuters quality dashboard
- Layout: Clean grid, corporate professional"""

    elif 'education' in content_type.lower() or 'learn' in headline.lower():
        return f"""
EDUCATIONAL SPECIFIC DESIGN:
- Visual Focus: Step-by-step learning journey
- Structure: Numbered progression 1 → 2 → 3
- Icons: Lightbulb moments, knowledge symbols
- Cards: Information bite-sized and digestible
- Color Psychology: {primary_color} (wisdom) + {accent_color} (insight)
- Style: TED Talk presentation quality
- Flow: Clear educational progression"""

    elif 'comparison' in content_type.lower() or 'vs' in headline.lower():
        return f"""
COMPARISON SPECIFIC DESIGN:
- Visual Focus: Smart financial choice visualization
- Layout: Two options side-by-side comparison
- Left Option: Alternative (e.g., iPhone ₹46,800)
- Right Option: Smart Choice (ELSS ₹46,800 tax saved + returns)
- Visual: Checkmarks/crosses for pros/cons
- Color Psychology: Contrasting colors (green vs orange)
- Style: Clean infographic with clear winner indication"""

    else:
        return f"""
PROFESSIONAL INFOGRAPHIC DESIGN:
- Visual Focus: Clear financial communication
- Layout: Hierarchical information flow
- Elements: Data visualization, key metrics
- Color Psychology: {primary_color} (trust) + {accent_color} (energy)
- Style: Modern minimalist with impact
- Clarity: Understandable in 3-second glance"""

def generate_with_reference(design_spec, advisor_info, reference_path, output_path):
    """Generate image using Gemini with reference image for aspect ratio"""

    try:
        print(f"   🎨 Generating with reference image (1080×1920)...")

        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')

        # Upload reference image to Gemini
        print(f"   📤 Uploading reference image...")
        ref_file = genai.upload_file(reference_path)

        # Create detailed prompt
        prompt = create_grammy_prompt(design_spec, advisor_info)

        # Generate image with reference
        response = model.generate_content(
            [ref_file, prompt],
            generation_config={
                'temperature': 0.85,
                'top_p': 0.95,
                'max_output_tokens': 8192
            }
        )

        # Extract generated image
        if hasattr(response, 'parts'):
            for part in response.parts:
                if hasattr(part, 'inline_data'):
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type

                    if mime_type.startswith('image/'):
                        with open(output_path, 'wb') as f:
                            f.write(image_data)

                        # Verify dimensions
                        img = Image.open(output_path)
                        print(f"   ✅ Generated: {img.size[0]}×{img.size[1]}px")

                        # Check if correct aspect ratio
                        if img.size == (1080, 1920):
                            print(f"   🎯 Perfect! Exact WhatsApp Status dimensions")
                        else:
                            print(f"   ⚠️  Aspect ratio: {img.size[0]}:{img.size[1]}")

                        return True

        # If no image in response
        if hasattr(response, 'text'):
            print(f"   ⚠️  Model response (text): {response.text[:200]}...")

        return False

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("\n🎨 GRAMMY-LEVEL IMAGES WITH REFERENCE (Proper 1080×1920)\n")
    print("=" * 70)

    # Create reference image
    reference_path = create_reference_image()

    # Load design specifications
    specs_path = Path(SESSION_DIR) / "status-images" / "design-specifications.json"
    with open(specs_path) as f:
        design_data = json.load(f)

    # Load advisor data
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    designs = design_data.get('designSpecifications', [])
    output_dir = Path(SESSION_DIR) / "status-images" / "gemini-reference-1920"
    output_dir.mkdir(exist_ok=True, parents=True)

    print(f"\n📊 Generating {len(designs)} images using reference image approach")
    print(f"   Reference: {reference_path}")
    print(f"   Target: 1080×1920 (9:16 vertical)\n")

    success_count = 0

    for idx, design in enumerate(designs, 1):
        advisor_id = design.get('advisorId', f'ADV{str(idx).zfill(3)}')

        # Find advisor
        advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
        if not advisor:
            print(f"⚠️  Advisor {advisor_id} not found, skipping...")
            continue

        advisor_info = {
            'name': advisor['personalInfo']['name'],
            'tagline': advisor['customization']['tagline'],
            'arn': advisor['personalInfo']['arn']
        }

        headline = design.get('viralHook', design.get('contentLayout', {}).get('headline', 'Financial Advisory'))

        print(f"\n📤 {advisor_info['name']} - Design {idx}")
        print(f"   {headline}")

        output_path = output_dir / f"REFERENCE_{advisor_id}_{str(idx).zfill(3)}.png"

        if generate_with_reference(design, advisor_info, reference_path, output_path):
            success_count += 1
        else:
            print(f"   ⚠️  Generation failed")

    print("\n" + "=" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   Total designs: {len(designs)}")
    print(f"   Successfully generated: {success_count}")
    print(f"   Output: {output_dir}")

    if success_count > 0:
        print(f"\n✅ Grammy-level vertical images ready!")
        print(f"📱 Perfect for WhatsApp Status (1080×1920)")
    else:
        print(f"\n⚠️  No images generated - check errors above")

if __name__ == "__main__":
    main()
