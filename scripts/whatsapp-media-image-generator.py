#!/usr/bin/env python3
"""
WhatsApp Media Image Generator (1200×628)
Generates professional financial advisory images for WhatsApp media messages
Uses reference image technique for aspect ratio control
NO FALLBACKS - Gemini API only
"""

import os
import sys
import json
from pathlib import Path
import google.generativeai as genai
from PIL import Image

# Get session from command line or use latest
if len(sys.argv) > 1:
    SESSION_DIR = sys.argv[1]
else:
    # Find latest session
    sessions = sorted(Path("output").glob("session_*"))
    if sessions:
        SESSION_DIR = str(sessions[-1])
    else:
        print("❌ No session found. Run /o command first.")
        sys.exit(1)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    print("This generator requires Gemini API. NO FALLBACKS.")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def create_whatsapp_media_prompt(whatsapp_text, advisor_info, design_context):
    """
    Create Silicon Valley-grade prompt for WhatsApp media image
    Image MUST complement the text message 100%
    """

    # Extract key elements from text
    text_hook = whatsapp_text[:50] if len(whatsapp_text) > 50 else whatsapp_text
    text_data = design_context.get('keyMetric', 'Market Update')

    branding = design_context.get('brandingElements', {})
    colors_obj = branding.get('colors', {})
    if isinstance(colors_obj, dict):
        primary_color = colors_obj.get('primary', '#1B365D')
        accent_color = colors_obj.get('accent', '#FFD700')
    else:
        primary_color = '#1B365D'
        accent_color = '#FFD700'

    prompt = f"""Using the reference image as the EXACT aspect ratio guide (1200×628 pixels, landscape 16:8.36 format), create a STUNNING professional WhatsApp Media image.

CRITICAL: Match the reference image's landscape format - 1200 pixels wide × 628 pixels tall

THIS IMAGE MUST COMPLEMENT THIS TEXT MESSAGE:
"{whatsapp_text}"

CONTENT SPECIFICATIONS:
Key Metric/Data: {text_data}
Visual Hook: {text_hook}
Primary Brand Color: {primary_color}
Accent Color: {accent_color}
Advisor: {advisor_info['name']}

DESIGN REQUIREMENTS (SILICON VALLEY STANDARDS):

1. **Exact Dimensions**: 1200×628 pixels (landscape, match reference)
2. **Layout Structure**:
   - Left 60% (720px): Visual content (charts, data visualization, graphics)
   - Right 40% (480px): Key message, headline, CTA
   - Professional financial infographic style

3. **Typography**:
   - Headline: Bold, 48-72px, {primary_color}
   - Data/Numbers: 60-96px, high impact
   - Supporting text: 28-36px
   - All text: Crystal clear, readable on 5-inch mobile screen

4. **Visual Elements**:
   - Data visualization (charts, graphs, comparisons)
   - Financial icons (₹ symbol, growth arrows, trending indicators)
   - Professional color scheme: {primary_color} + {accent_color}
   - High contrast for mobile readability (4.5:1 minimum)
   - Clean, modern, trustworthy aesthetic

5. **Text-Image Complementarity**:
   - Image visually proves/supports the text message
   - Same data/numbers as in text (if applicable)
   - Reinforces the emotional hook from text
   - Creates complete story: Text + Image = Full message

6. **Branding (Bottom Area)**:
   - Bottom-left: "ARN: {advisor_info['arn']}" (24px, gray)
   - Bottom-center: "{advisor_info['tagline']}" (32px, bold, white)
   - Bottom-right: Logo placeholder (120×120px)

7. **Professional Standards**:
   - Grammy/Oscar-level visual design
   - Comparable to: Apple, Google, Goldman Sachs, UBS designs
   - Stop-scroll-worthy in WhatsApp feed
   - Mobile-first: Clear on 5-inch screen
   - Financial advisory credibility

CONTENT TYPE SPECIFIC:
{get_whatsapp_content_direction(text_data, whatsapp_text)}

OUTPUT: A FLAWLESS, production-ready WhatsApp Media image (1200×628) that perfectly complements the text message, with Grammy-level professional design quality.

Style: Modern financial design, data-driven, trustworthy, mobile-optimized for WhatsApp"""

    return prompt

def get_whatsapp_content_direction(key_metric, text_message):
    """Get specific design direction based on content"""

    text_lower = text_message.lower()

    if 'sip' in text_lower or '₹906' in text_message or 'crore' in text_lower:
        return """
CONTENT FOCUS: SIP/Investment Growth
- Large number display: "₹906 Crore DAILY" or similar
- Upward trending graph/arrow
- Growth visualization (bar chart or line graph)
- Color: Green (growth), Gold (premium)
- Mood: Inspiring, achievement-focused
- Left: Growth graph, Right: Key metric + CTA"""

    elif 'tax' in text_lower or '₹' in text_message[:20] or 'save' in text_lower:
        return """
CONTENT FOCUS: Tax Savings Alert
- Comparison visual: Old vs New (₹1.5L vs ₹2L)
- Countdown indicator if time-sensitive
- Money/rupee symbols with impact
- Color: Navy blue (trust) + Gold (savings)
- Mood: Urgent yet professional
- Left: Comparison chart, Right: Savings amount + CTA"""

    elif 'market' in text_lower or 'nse' in text_lower or 'bse' in text_lower or '%' in text_message:
        return """
CONTENT FOCUS: Market Update
- Market indices visualization
- Percentage changes with arrows
- Professional dashboard style
- Color: Blue (trust) + Green/Red (market movement)
- Mood: Authoritative, data-driven
- Left: Market data, Right: Key insight + action"""

    else:
        return """
CONTENT FOCUS: General Financial Advisory
- Clean infographic layout
- Key data prominently displayed
- Professional financial visualization
- Color: Brand colors with high contrast
- Mood: Trustworthy, professional
- Left: Visual element, Right: Message + CTA"""

def generate_whatsapp_media_image(whatsapp_text, advisor_info, design_context, reference_path, output_path):
    """Generate WhatsApp media image using Gemini with reference"""

    try:
        print(f"   🎨 Generating WhatsApp media image (1200×628)...")
        print(f"   📝 Text: {whatsapp_text[:60]}...")

        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')

        # Upload reference
        ref_file = genai.upload_file(reference_path)

        # Create prompt
        prompt = create_whatsapp_media_prompt(whatsapp_text, advisor_info, design_context)

        # Generate
        response = model.generate_content(
            [ref_file, prompt],
            generation_config={
                'temperature': 0.8,  # Balanced creativity
                'top_p': 0.95,
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

                    # Upscale to exact 1200×628 if needed
                    if img.size != (1200, 628):
                        print(f"   📐 Upscaling from {img.size[0]}×{img.size[1]} to 1200×628...")
                        img_upscaled = img.resize((1200, 628), Image.Resampling.LANCZOS)
                        img_upscaled.save(output_path, 'PNG', quality=95)
                        print(f"   ✅ Generated: 1200×628px")
                    else:
                        print(f"   ✅ Generated: {img.size[0]}×{img.size[1]}px (perfect!)")

                    return True

        # If no image in response - FAIL (no fallback)
        print(f"   ❌ Gemini did not return an image")
        print(f"   NO FALLBACKS - Generation failed")
        return False

    except Exception as e:
        print(f"   ❌ Gemini API error: {e}")
        print(f"   NO FALLBACKS - Generation failed")
        return False

def main():
    print("\n🎨 WHATSAPP MEDIA IMAGE GENERATOR (1200×628)\n")
    print("=" * 70)
    print(f"Session: {SESSION_DIR}")
    print(f"Format: 1200×628 (landscape, WhatsApp media)\n")

    # Load WhatsApp messages
    whatsapp_file = Path(SESSION_DIR) / "whatsapp" / "whatsapp-messages.json"
    if not whatsapp_file.exists():
        print(f"❌ No WhatsApp messages found at {whatsapp_file}")
        print("Run whatsapp-message-creator agent first")
        sys.exit(1)

    with open(whatsapp_file) as f:
        whatsapp_data = json.load(f)

    messages = whatsapp_data.get('messages', [])
    print(f"📊 Loaded {len(messages)} WhatsApp messages\n")

    # Load advisor data
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    # Reference image
    reference_path = Path("scripts/reference_1200x628.png")
    if not reference_path.exists():
        print("❌ Reference image not found. Creating...")
        import subprocess
        subprocess.run(["python3", "scripts/create-whatsapp-media-reference.py"])

    # Output directory
    output_dir = Path(SESSION_DIR) / "whatsapp-media"
    output_dir.mkdir(exist_ok=True, parents=True)

    success_count = 0

    for idx, message in enumerate(messages, 1):
        advisor_id = message.get('advisorId')
        text_content = message.get('messageText', message.get('text', ''))

        # Find advisor
        advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
        if not advisor:
            print(f"⚠️  Advisor {advisor_id} not found, skipping")
            continue

        advisor_info = {
            'name': advisor['personalInfo']['name'],
            'tagline': advisor['customization']['tagline'],
            'arn': advisor['personalInfo']['arn']
        }

        design_context = message.get('designContext', {})

        print(f"\n📤 Message {idx} - {advisor_info['name']}")

        output_path = output_dir / f"WHATSAPP_MEDIA_{advisor_id}_{str(idx).zfill(3)}.png"

        if generate_whatsapp_media_image(text_content, advisor_info, design_context, reference_path, output_path):
            success_count += 1
            print(f"   💾 Saved: {output_path.name}")
        else:
            print(f"   ❌ Failed - NO FALLBACK (strict Gemini-only mode)")

    print("\n" + "=" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   Total messages: {len(messages)}")
    print(f"   Successfully generated: {success_count}")
    print(f"   Failed (no fallback): {len(messages) - success_count}")
    print(f"   Output: {output_dir}\n")

    if success_count > 0:
        print(f"✅ WhatsApp media images ready for validation!")
    else:
        print(f"❌ No images generated - check Gemini API access")

if __name__ == "__main__":
    main()
