#!/usr/bin/env python3
"""
Auto-Regenerate Failed Images
Reads validation report and regenerates rejected/flagged images with improvements
"""

import os
import sys
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import json

SESSION_DIR = "output/session_1759383378"
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def create_improved_prompt(original_design, validation_feedback, advisor_info):
    """Create improved prompt based on validation feedback"""

    headline = original_design.get('viralHook', 'Financial Advisory')
    content_type = original_design.get('contentType', 'professional')

    # Extract colors
    branding = original_design.get('brandingElements', {})
    colors_obj = branding.get('colors', {})
    if isinstance(colors_obj, dict):
        primary_color = colors_obj.get('primary', '#1B365D')
        accent_color = colors_obj.get('accent', '#FFD700')
    else:
        primary_color = '#1B365D'
        accent_color = '#FFD700'

    # Build improvement instructions from validation feedback
    improvement_notes = f"""
PREVIOUS ISSUES TO FIX:
{validation_feedback}

CRITICAL REQUIREMENTS:
- NO debug text (360px, 1080x1920, dimensions, etc.)
- NO duplicate text (don't write ARN twice)
- NO typos (Crore not Chore, check all spelling)
- Perfect text alignment (centered, balanced)
- Minimum 80px padding from ALL edges
- No text cutoff at edges
- No stretched or distorted elements
"""

    prompt = f"""Using the reference image as the EXACT aspect ratio guide (1080x1920 pixels, vertical 9:16 format), create a FLAWLESS professional WhatsApp Status image.

{improvement_notes}

CONTENT:
Main Headline: "{headline}"
Primary Brand Color: {primary_color}
Accent Color: {accent_color}
Advisor: {advisor_info['name']}

DESIGN REQUIREMENTS (STRICT):
1. **Perfect Dimensions**: EXACTLY 1080×1920 pixels (match reference)
2. **Text Quality**:
   - Zero debug text, zero placeholders
   - No duplicate labels (ARN once only, at bottom-left)
   - Perfect spelling (₹906 Crore DAILY, not "Chore")
   - Crisp, clear, properly aligned
   - High contrast for readability

3. **Layout (80px Safe Padding)**:
   - 80px minimum from ALL edges
   - No text touching borders
   - Perfect center alignment
   - Visual hierarchy: Headline → Data → Branding

4. **Visual Quality**:
   - Zero stretching or distortion
   - Sharp, professional graphics
   - Proportional elements (circles stay circular)
   - Grammy-award quality

5. **Branding (Bottom Area)**:
   - Bottom-left: "ARN: {advisor_info['arn']}" (28px, gray) - ONCE ONLY
   - Bottom-center: "{advisor_info['tagline']}" (36px, bold, white)
   - Bottom-right: Logo circle (150×150px)

6. **Content Specific**:
{get_content_direction(content_type, headline)}

OUTPUT: A FLAWLESS, production-ready WhatsApp Status image (1080×1920) with ZERO defects, ZERO debug text, ZERO duplication, perfect alignment, and Grammy-level quality.

Style: Modern financial design, trustworthy, stop-scroll-worthy, mobile-optimized"""

    return prompt

def get_content_direction(content_type, headline):
    """Content-specific design directions"""

    if 'tax' in content_type.lower() or 'Tax' in headline or '₹2' in headline:
        return """- Tax Alert Visual: Countdown "6 Months to March 31"
- Comparison: ₹1.5L vs ₹2L deduction (side-by-side cards)
- Icons: Money symbols with impact
- Color: Executive dashboard style"""

    elif 'sip' in content_type.lower() or 'SIP' in headline or '906' in headline:
        return """- SIP Celebration: "₹906 Crore DAILY" in HUGE text (check spelling!)
- Growth curve trending upward
- Achievement/success vibe
- Inspiring color palette"""

    else:
        return """- Professional infographic style
- Clear visual hierarchy
- Modern minimal design
- 3-second scannable"""

def regenerate_image(design_spec, advisor_info, validation_feedback, reference_path, output_path):
    """Regenerate image with improvements"""

    try:
        print(f"   🔄 Regenerating with improvements...")

        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')

        # Upload reference
        ref_file = genai.upload_file(reference_path)

        # Create improved prompt
        prompt = create_improved_prompt(design_spec, validation_feedback, advisor_info)

        # Generate
        response = model.generate_content(
            [ref_file, prompt],
            generation_config={
                'temperature': 0.75,  # Slightly lower for more control
                'top_p': 0.9,
                'max_output_tokens': 8192
            }
        )

        # Extract image
        if hasattr(response, 'parts'):
            for part in response.parts:
                if hasattr(part, 'inline_data'):
                    image_data = part.inline_data.data

                    with open(output_path, 'wb') as f:
                        f.write(image_data)

                    img = Image.open(output_path)

                    # Upscale to exact 1080×1920 if needed
                    if img.size != (1080, 1920):
                        print(f"   📐 Upscaling from {img.size[0]}×{img.size[1]} to 1080×1920...")
                        img_upscaled = img.resize((1080, 1920), Image.Resampling.LANCZOS)
                        img_upscaled.save(output_path, 'PNG', quality=95)
                        print(f"   ✅ Regenerated: 1080×1920px")
                    else:
                        print(f"   ✅ Regenerated: {img.size[0]}×{img.size[1]}px")

                    return True

        return False

    except Exception as e:
        print(f"   ❌ Regeneration error: {e}")
        return False

def main():
    print("\n🔄 AUTO-REGENERATE FAILED IMAGES\n")
    print("=" * 70)

    # Load validation report
    reports = sorted(Path(SESSION_DIR).glob("status-images/validation-report-*.json"))
    if not reports:
        print("❌ No validation report found. Run visual-quality-validator.py first.")
        sys.exit(1)

    latest_report = reports[-1]
    print(f"📄 Using report: {latest_report.name}\n")

    with open(latest_report) as f:
        validation_data = json.load(f)

    # Load design specs and advisor data
    specs_path = Path(SESSION_DIR) / "status-images" / "design-specifications.json"
    with open(specs_path) as f:
        design_data = json.load(f)

    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    # Reference image
    reference_path = Path(SESSION_DIR) / "status-images" / "reference_1080x1920.png"

    # Output directory
    output_dir = Path(SESSION_DIR) / "status-images" / "regenerated"
    output_dir.mkdir(exist_ok=True, parents=True)

    regeneration_count = 0

    # Find failed images
    for result in validation_data['results']:
        recommendation = result.get('recommendation', 'REJECT')

        if recommendation in ['REJECT', 'REGENERATE']:
            image_name = result['image_file']
            advisor_name = result['advisor']
            feedback = result.get('detailed_feedback', 'Quality issues found')

            print(f"\n🔄 {image_name} ({advisor_name})")
            print(f"   Issue: {feedback[:100]}...")

            # Extract advisor ID and design index
            parts = image_name.replace('FINAL_', '').replace('.png', '').split('_')
            advisor_id = parts[0]  # ADV001
            design_idx = int(parts[1]) - 1  # 001 → index 0

            # Find design spec
            design = design_data['designSpecifications'][design_idx]

            # Find advisor
            advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
            if not advisor:
                print(f"   ⚠️  Advisor not found, skipping")
                continue

            advisor_info = {
                'name': advisor['personalInfo']['name'],
                'tagline': advisor['customization']['tagline'],
                'arn': advisor['personalInfo']['arn']
            }

            # Regenerate
            output_path = output_dir / f"REGEN_{advisor_id}_{str(design_idx+1).zfill(3)}.png"

            if regenerate_image(design, advisor_info, feedback, reference_path, output_path):
                regeneration_count += 1
                print(f"   💾 Saved: {output_path.name}")
            else:
                print(f"   ❌ Failed to regenerate")

    print("\n" + "=" * 70)
    print(f"\n✅ Regenerated {regeneration_count} images")
    print(f"📁 Location: {output_dir}")
    print(f"\n💡 Next: Run visual-quality-validator.py on regenerated images\n")

if __name__ == "__main__":
    main()
