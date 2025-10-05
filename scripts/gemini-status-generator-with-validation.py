#!/usr/bin/env python3
"""
Gemini WhatsApp Status Image Generator with Mandatory Quality Control
Uses reference image technique + AI visual validation + auto-regeneration

Session: session_1759400220
Output: Validated images only (Grammy-level 8.0+ viral score)
"""

import os
import sys
import json
import base64
import time
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import google.generativeai as genai

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
SESSION_ID = "session_1759400220"
BASE_DIR = Path("/Users/shriyavallabh/Desktop/mvp")
OUTPUT_DIR = BASE_DIR / "output" / SESSION_ID / "status-images"
VALIDATED_DIR = OUTPUT_DIR / "validated"
REJECTED_DIR = OUTPUT_DIR / "rejected"
REFERENCE_DIR = OUTPUT_DIR / "references"

# WhatsApp Status dimensions
STATUS_WIDTH = 1080
STATUS_HEIGHT = 1920

# Advisors data
ADVISORS = [
    {
        "id": "ADV001",
        "name": "Shruti Petkar",
        "arn": "ARN-125847",
        "branding": {
            "primaryColor": "#1B365D",
            "secondaryColor": "#0077B5",
            "tagline": "Building Wealth, Creating Trust"
        }
    },
    {
        "id": "ADV002",
        "name": "Vidyadhar Petkar",
        "arn": "ARN-138924",
        "branding": {
            "primaryColor": "#2E8B57",
            "secondaryColor": "#228B22",
            "tagline": "Your Financial Growth Partner"
        }
    },
    {
        "id": "ADV003",
        "name": "Shriya Vallabh Petkar",
        "arn": "ARN-147852",
        "branding": {
            "primaryColor": "#8B4513",
            "secondaryColor": "#CD853F",
            "tagline": "Empowering Financial Decisions"
        }
    },
    {
        "id": "ADV004",
        "name": "Avalok Langer",
        "arn": "ARN-169741",
        "branding": {
            "primaryColor": "#1A73E8",
            "secondaryColor": "#34A853",
            "tagline": "Smart Investments, Secure Future"
        }
    }
]

# Viral status designs
VIRAL_DESIGNS = [
    {
        "id": "fii_mystery",
        "headline": "₹2.35L Cr EXIT",
        "subheadline": "Who's Buying?",
        "content": "FIIs sold ₹2,35,000 Cr\nDIIs bought ₹2,20,000 Cr\nMarkets still UP 0.59%!",
        "cta": "Swipe: See Which Stocks",
        "colors": {"primary": "#FF3333", "secondary": "#00FF00", "accent": "#FFD700"},
        "prompt": "Create a dramatic WhatsApp Status vertical image (1080x1920 pixels, 9:16 aspect ratio). Top section (15%): Bold headline '₹2.35L Cr EXIT' in 120px red (#FF3333) with shadow effect. Below: 'Who's Buying?' in 96px white with glow. Middle section (50%): Split-screen battle visualization. Left side: Red downward arrows, 'FIIs SELLING ₹2,35,000 Cr' in bold red. Right side: Green upward arrows, 'DIIs BUYING ₹2,20,000 Cr' in green. Center: Large 'VS' in gold (#FFD700) with lightning effect. Include 3 shocking stats in 56px: 'Biggest Exit in History', 'Markets Still UP 0.59%', 'DIIs Save the Day!'. Bottom section (20%): Green CTA bar 'Swipe: See Which Stocks' in 64px. Dark gradient background (#1A1A1A to #2D2D2D) with financial grid pattern. Use high contrast, neon effects, dramatic lighting. Financial war poster aesthetic. IMPORTANT: Exact 1080x1920 pixels, portrait orientation, no debug text, perfect alignment."
    },
    {
        "id": "trump_tariff",
        "headline": "TRUMP 50% TARIFF",
        "subheadline": "IT Jobs at Risk!",
        "content": "BEFORE: 25% tariff, $200B exports\nAFTER: 50% tariff, 10L jobs at risk\nReason: Russian Oil Deals",
        "cta": "⚠️ Protect Your Job: 3 Steps",
        "colors": {"primary": "#FF0000", "secondary": "#FFFF00", "accent": "#FFD700"},
        "prompt": "Create an urgent WhatsApp Status vertical image (1080x1920 pixels, 9:16 aspect ratio). Top section (20%): Warning headline 'TRUMP 50% TARIFF' in 108px red (#FF0000) with flash effect. Below: 'IT Jobs at Risk!' in 84px yellow (#FFFF00) blinking. Middle section (55%): Split-screen impact. Left panel (green bg #004400): 'BEFORE - 25% tariff, $200B exports, 54L jobs' in green. Right panel (red bg #440000): 'AFTER - 50% tariff, -30% exports, 10L jobs at risk' in red. Center: Lightning bolt divider in gold. Include facts: 'Reason: Russian Oil Deals', 'Biggest IT Layoffs Ever'. Bottom section (20%): Yellow alert bar '⚠️ Protect Your Job: 3 Steps Inside' in black text on yellow background (#FFFF00). Danger stripes pattern, emergency lighting, warning triangles. Emergency broadcast aesthetic. IMPORTANT: Exact 1080x1920 pixels, portrait orientation, no debug text, perfect vertical layout."
    },
    {
        "id": "bitcoin_crash",
        "headline": "$109K → $94K",
        "subheadline": "-13.6% CRASH",
        "content": "Bitcoin: -$14,856 loss\nGold: +3% same period\nCrypto Bros: -₹50L loss",
        "cta": "Learn: Why Smart Money Exited",
        "colors": {"primary": "#FF0000", "secondary": "#FFD700", "accent": "#00FF00"},
        "prompt": "Create a dramatic WhatsApp Status vertical image (1080x1920 pixels, 9:16 aspect ratio). Top section (20%): '$109,356' in green with strike-through (96px), large red diagonal arrow, '$94,500' in red with glow (96px). Center (30%): Huge '-$14,856' in blood-red dripping font (120px). Below: '-13.6% CRASH' in shaking red text on black bar (84px). Middle section (30%): Dramatic candlestick chart showing cliff drop Jan 17-20, peak gold star to red cross crash. Include comparison bars: 'Gold: +3%' in gold (#FFD700), 'FD Returns: Peaceful Sleep' in green, 'Crypto Bros: -₹50L Loss' in red. Bottom section (20%): Professional bar 'Learn: Why Smart Money Exited at $105K' in gold text (64px). Dark background (#0A0A0A) with falling Bitcoin symbols at 20% opacity. Red gradient overlay, crack effects. Financial disaster visualization with pro data aesthetic. IMPORTANT: Exact 1080x1920 pixels, portrait orientation, no debug text, perfect proportions."
    }
]

def setup_directories():
    """Create output directory structure"""
    for dir_path in [OUTPUT_DIR, VALIDATED_DIR, REJECTED_DIR, REFERENCE_DIR]:
        dir_path.mkdir(parents=True, exist_ok=True)
    print(f"✅ Directories created: {OUTPUT_DIR}")

def create_reference_image():
    """Create 1080x1920 reference image for aspect ratio control"""
    ref_img = Image.new('RGB', (STATUS_WIDTH, STATUS_HEIGHT), color='#1A1A1A')
    draw = ImageDraw.Draw(ref_img)

    # Add reference text
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 48)
    except:
        font = ImageFont.load_default()

    text = "1080x1920 Reference"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    draw.text(((STATUS_WIDTH - text_width) // 2, STATUS_HEIGHT // 2),
              text, fill='white', font=font)

    ref_path = REFERENCE_DIR / "whatsapp_status_reference_1080x1920.png"
    ref_img.save(ref_path, 'PNG')
    print(f"✅ Reference image created: {ref_path}")
    return ref_path

def configure_gemini():
    """Configure Gemini API"""
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not found in environment")
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured")

def generate_image_with_reference(design, advisor, ref_image_path):
    """Generate image using Gemini with reference image technique"""
    try:
        # Upload reference image
        ref_file = genai.upload_file(ref_image_path)
        print(f"  📤 Reference uploaded: {ref_file.name}")

        # Wait for processing
        while ref_file.state.name == "PROCESSING":
            time.sleep(1)
            ref_file = genai.get_file(ref_file.name)

        if ref_file.state.name == "FAILED":
            raise Exception("Reference file processing failed")

        # Customize prompt with advisor branding
        custom_prompt = f"""{design['prompt']}

BRANDING REQUIREMENTS:
- Include advisor name: {advisor['name']}
- ARN number: {advisor['arn']} (bottom-left, 42px, subtle gray)
- Tagline: {advisor['branding']['tagline']} (bottom area, 48px)
- Brand color accent: {advisor['branding']['primaryColor']} (use as accent in design)

CRITICAL REQUIREMENTS:
- MUST be EXACTLY 1080x1920 pixels (9:16 portrait)
- Use reference image aspect ratio
- NO debug text (no "360px", "1080x1920", dimension labels)
- NO duplicate text elements
- Perfect text alignment and spacing
- Professional financial design quality
- High contrast for WhatsApp thumbnail visibility
- Mobile-optimized readability

Reference image provided shows exact dimensions and aspect ratio to follow."""

        # Generate with Gemini 2.5 Flash Image Preview
        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')

        response = model.generate_content([
            ref_file,
            custom_prompt
        ])

        # Extract image data
        if hasattr(response, 'parts') and response.parts:
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_data = base64.b64decode(part.inline_data.data)
                    img = Image.open(io.BytesIO(image_data))

                    # Verify and resize if needed
                    if img.size != (STATUS_WIDTH, STATUS_HEIGHT):
                        print(f"  ⚠️  Resizing from {img.size} to {STATUS_WIDTH}x{STATUS_HEIGHT}")
                        img = img.resize((STATUS_WIDTH, STATUS_HEIGHT), Image.Resampling.LANCZOS)

                    return img

        raise Exception("No image data in response")

    except Exception as e:
        print(f"  ❌ Generation failed: {e}")
        return None

def validate_image_with_ai(image_path, design, advisor):
    """AI visual validation using Gemini Vision"""
    try:
        # Upload image for validation
        image_file = genai.upload_file(image_path)

        # Wait for processing
        while image_file.state.name == "PROCESSING":
            time.sleep(1)
            image_file = genai.get_file(image_file.name)

        validation_prompt = f"""Analyze this WhatsApp Status image for quality issues. Return a JSON validation report.

EXPECTED CONTENT:
- Design: {design['id']}
- Headline: {design['headline']}
- Subheadline: {design['subheadline']}
- Advisor: {advisor['name']}
- ARN: {advisor['arn']}

CHECK FOR ISSUES:
1. Debug text (e.g., "360px", "1080x1920", dimension labels) - REJECT if found
2. Duplicate text elements (same text appearing twice) - REJECT if found
3. Text alignment issues (off-center, cropped) - REJECT if found
4. Stretched or distorted elements - REJECT if found
5. Wrong aspect ratio or dimensions - REJECT if found
6. Missing required elements (headline, CTA, branding) - REJECT if found
7. Low contrast or poor readability - REJECT if found
8. Typos or text errors - REJECT if found

Return JSON:
{{
  "valid": true/false,
  "score": 0-10,
  "issues": ["list of issues found"],
  "recommendation": "ACCEPT" or "REGENERATE with specific fixes"
}}

Be strict. Only ACCEPT if image is perfect with no issues."""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([image_file, validation_prompt])

        # Parse JSON response
        result_text = response.text.strip()
        if result_text.startswith('```json'):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith('```'):
            result_text = result_text[3:-3].strip()

        validation_result = json.loads(result_text)
        return validation_result

    except Exception as e:
        print(f"  ⚠️  Validation error: {e}")
        return {"valid": False, "score": 0, "issues": [f"Validation error: {e}"],
                "recommendation": "REGENERATE"}

def generate_with_retry(design, advisor, ref_image_path, max_attempts=3):
    """Generate image with auto-regeneration on validation failure"""

    for attempt in range(1, max_attempts + 1):
        print(f"\n  🎨 Attempt {attempt}/{max_attempts}: Generating {design['id']} for {advisor['name']}")

        # Generate image
        img = generate_image_with_reference(design, advisor, ref_image_path)

        if not img:
            print(f"  ❌ Generation failed")
            continue

        # Save temporary image for validation
        temp_path = OUTPUT_DIR / f"temp_{advisor['id']}_{design['id']}_attempt{attempt}.png"
        img.save(temp_path, 'PNG', optimize=True)

        # Validate with AI
        print(f"  🔍 Validating with AI...")
        validation = validate_image_with_ai(temp_path, design, advisor)

        if validation['valid'] and validation['score'] >= 8.0:
            # ACCEPTED - Move to validated directory
            final_path = VALIDATED_DIR / f"{advisor['id']}_{design['id']}_validated.png"
            img.save(final_path, 'PNG', optimize=True)
            temp_path.unlink()  # Delete temp

            print(f"  ✅ ACCEPTED - Score: {validation['score']}/10")
            print(f"  💾 Saved: {final_path}")

            return {
                "success": True,
                "path": str(final_path),
                "validation": validation,
                "attempts": attempt
            }
        else:
            # REJECTED - Move to rejected directory
            rejected_path = REJECTED_DIR / f"{advisor['id']}_{design['id']}_attempt{attempt}_rejected.png"
            img.save(rejected_path, 'PNG', optimize=True)
            temp_path.unlink()

            print(f"  ❌ REJECTED - Score: {validation['score']}/10")
            print(f"  📋 Issues: {', '.join(validation['issues'])}")
            print(f"  💡 Recommendation: {validation['recommendation']}")

            if attempt < max_attempts:
                print(f"  🔄 Regenerating with fixes...")
                time.sleep(2)  # Brief pause before retry

    # All attempts failed
    print(f"  ❌ FAILED after {max_attempts} attempts")
    return {
        "success": False,
        "validation": validation,
        "attempts": max_attempts
    }

def main():
    """Main execution"""
    print("🚀 Gemini WhatsApp Status Generator with Quality Control")
    print(f"📁 Session: {SESSION_ID}")
    print(f"📐 Dimensions: {STATUS_WIDTH}x{STATUS_HEIGHT} (9:16 portrait)")
    print(f"👥 Advisors: {len(ADVISORS)}")
    print(f"🎨 Designs: {len(VIRAL_DESIGNS)}")
    print(f"📊 Total images: {len(ADVISORS) * len(VIRAL_DESIGNS)}")

    # Setup
    setup_directories()
    configure_gemini()

    # Create reference image
    ref_image_path = create_reference_image()

    # Generate images
    results = []
    total_images = len(ADVISORS) * len(VIRAL_DESIGNS)
    current = 0

    for advisor in ADVISORS:
        for design in VIRAL_DESIGNS:
            current += 1
            print(f"\n{'='*60}")
            print(f"📸 Image {current}/{total_images}")
            print(f"👤 Advisor: {advisor['name']} ({advisor['id']})")
            print(f"🎨 Design: {design['id']}")
            print(f"{'='*60}")

            result = generate_with_retry(design, advisor, ref_image_path)
            results.append({
                "advisor": advisor['name'],
                "advisor_id": advisor['id'],
                "design": design['id'],
                "result": result
            })

            # Brief pause between generations
            if current < total_images:
                time.sleep(3)

    # Summary report
    print(f"\n\n{'='*60}")
    print("📊 GENERATION SUMMARY")
    print(f"{'='*60}")

    validated = [r for r in results if r['result']['success']]
    rejected = [r for r in results if not r['result']['success']]

    print(f"\n✅ Validated: {len(validated)}/{total_images}")
    print(f"❌ Rejected: {len(rejected)}/{total_images}")
    print(f"📈 Success Rate: {len(validated)/total_images*100:.1f}%")

    print(f"\n📁 Output Directories:")
    print(f"  ✅ Validated: {VALIDATED_DIR}")
    print(f"  ❌ Rejected: {REJECTED_DIR}")

    # Save detailed report
    report_path = OUTPUT_DIR / "validation_report.json"
    with open(report_path, 'w') as f:
        json.dump({
            "session_id": SESSION_ID,
            "timestamp": datetime.now().isoformat(),
            "total_images": total_images,
            "validated": len(validated),
            "rejected": len(rejected),
            "success_rate": len(validated)/total_images*100,
            "results": results
        }, f, indent=2)

    print(f"\n📄 Detailed report: {report_path}")

    if validated:
        print(f"\n✨ Successfully validated images:")
        for r in validated:
            print(f"  ✅ {r['advisor']} - {r['design']} (Score: {r['result']['validation']['score']}/10)")

    if rejected:
        print(f"\n⚠️  Failed images (review rejected/ directory):")
        for r in rejected:
            print(f"  ❌ {r['advisor']} - {r['design']}")

    print(f"\n{'='*60}")
    print("🎉 Generation Complete!")
    print(f"{'='*60}\n")

    return len(validated) == total_images

if __name__ == "__main__":
    import io
    success = main()
    sys.exit(0 if success else 1)
