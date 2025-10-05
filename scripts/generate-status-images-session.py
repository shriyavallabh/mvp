#!/usr/bin/env python3
"""
Generate WhatsApp Status Images (1080x1920) using Gemini 2.5 Flash
For current orchestration session with quality control
"""

import os
import sys
import json
from pathlib import Path
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import time

# Get session from current-session.json
with open('data/current-session.json', 'r') as f:
    session_info = json.load(f)
    SESSION_ID = session_info['sessionId']
    SESSION_DIR = session_info['sessionDir']

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in environment!")
    print("Please set: export GEMINI_API_KEY='your-key-here'")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def create_reference_image():
    """Create 1080x1920 reference image"""
    ref_dir = Path(SESSION_DIR) / "images" / "status"
    ref_dir.mkdir(exist_ok=True, parents=True)
    ref_path = ref_dir / "reference_1080x1920.png"

    if ref_path.exists():
        print(f"✅ Reference image exists: {ref_path}")
        return ref_path

    img = Image.new('RGB', (1080, 1920), color='#F5F5F5')
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 1030, 1870], outline='#1B365D', width=3)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 100)
    except:
        font = ImageFont.load_default()

    draw.text((540, 960), "1080 × 1920", fill='#1B365D', anchor='mm', font=font)

    img.save(ref_path, 'PNG', quality=95)
    print(f"✅ Reference image created: {ref_path}")
    return ref_path

def generate_image(design_spec, reference_path):
    """Generate image using Gemini with design specifications"""

    design_id = design_spec['designId']
    advisor_name = design_spec['advisorName']
    gemini_prompt = design_spec['geminiPrompt']

    print(f"\n🎨 Generating: {design_id} for {advisor_name}")
    print(f"   Content: {design_spec['contentType']}")
    print(f"   Headline: {design_spec['headline']}")

    try:
        # Load reference image
        reference_image = Image.open(reference_path)

        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Full prompt with reference guidance
        full_prompt = f"""Using the reference image as EXACT aspect ratio guide (1080x1920 vertical):

{gemini_prompt}

CRITICAL REQUIREMENTS:
- MUST match reference image dimensions EXACTLY (1080×1920)
- Vertical portrait orientation (9:16 ratio)
- Mobile-optimized design
- NO debug text ("1080x1920", "360px", etc.)
- NO dimension watermarks
- Professional Grammy-level quality
- High contrast for mobile readability

Generate a STUNNING professional image matching these exact specifications."""

        # Generate image
        print("   Calling Gemini API...")
        response = model.generate_content([
            full_prompt,
            reference_image
        ])

        # Save generated image
        output_dir = Path(SESSION_DIR) / "images" / "status"
        output_dir.mkdir(exist_ok=True, parents=True)
        output_path = output_dir / f"{design_id}.png"

        if hasattr(response, '_result') and hasattr(response._result, 'candidates'):
            # Extract image from response
            candidate = response._result.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data'):
                        image_data = part.inline_data.data
                        with open(output_path, 'wb') as f:
                            f.write(image_data)
                        print(f"   ✅ Image saved: {output_path}")
                        return str(output_path)

        print(f"   ⚠️  No image data in response for {design_id}")
        return None

    except Exception as e:
        print(f"   ❌ Error generating {design_id}: {str(e)}")
        return None

def main():
    print(f"\n{'='*60}")
    print(f"WhatsApp Status Image Generation")
    print(f"Session: {SESSION_ID}")
    print(f"{'='*60}\n")

    # Create reference image
    ref_path = create_reference_image()

    # Load design specifications
    designs_path = Path(SESSION_DIR) / "status-image-designs.json"
    if not designs_path.exists():
        print(f"❌ Design specifications not found: {designs_path}")
        sys.exit(1)

    with open(designs_path, 'r') as f:
        design_data = json.load(f)

    designs = design_data['designs']
    print(f"📋 Found {len(designs)} design specifications")

    # Generate images
    results = {
        'session': SESSION_ID,
        'total_designs': len(designs),
        'generated': [],
        'failed': []
    }

    for i, design in enumerate(designs, 1):
        print(f"\n[{i}/{len(designs)}] Processing {design['designId']}...")

        output_path = generate_image(design, ref_path)

        if output_path:
            results['generated'].append({
                'designId': design['designId'],
                'advisorId': design['advisorId'],
                'path': output_path
            })
        else:
            results['failed'].append(design['designId'])

        # Rate limiting
        if i < len(designs):
            time.sleep(2)

    # Save results
    results_path = Path(SESSION_DIR) / "images" / "generation-results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Summary
    print(f"\n{'='*60}")
    print(f"GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Generated: {len(results['generated'])}/{len(designs)}")
    print(f"❌ Failed: {len(results['failed'])}")
    print(f"📁 Output: {Path(SESSION_DIR) / 'images' / 'status'}")
    print(f"📊 Results: {results_path}")

    return len(results['generated']) > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
