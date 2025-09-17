#!/usr/bin/env python3
"""
Generate Swiss bank mountain scene using Gemini API
"""

import os
import json
import base64
import io
import requests
from datetime import datetime
from pathlib import Path
from PIL import Image

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def generate_swiss_bank_image():
    """Generate Swiss bank scene with UBS in mountains"""

    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        print("❌ No API key found")
        return None

    print("=" * 70)
    print("🏔️ SWISS BANK MOUNTAIN SCENE GENERATION")
    print("=" * 70)

    # API endpoint for Gemini
    model_name = "gemini-2.5-flash-image-preview"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    headers = {"Content-Type": "application/json"}

    # Your specific prompt for Swiss bank scene
    prompt = """Generate a high-quality, professional image showing:

    - Setting: Beautiful Swiss Alps mountain landscape with snow-capped peaks
    - Building: Modern UBS bank office building integrated into the mountain scenery
    - Logo: UBS logo clearly visible on the building
    - Interior view through large glass windows showing:
      * Multiple office floors with people working at desks
      * Happy employees with smiling faces
      * Several team huddle meetings happening
      * Standing collaboration meetings around whiteboards
      * Mix of formal meeting rooms and open collaboration spaces
    - Atmosphere: Professional yet warm, showing Swiss precision with human happiness
    - Time: Daytime with clear blue sky and sunlight illuminating the mountains
    - Style: Photorealistic, corporate photography style
    - Color scheme: UBS red and white colors prominent, with natural mountain blues and whites
    - Details: Cable cars in background, Swiss flags, modern architecture blending with nature

    Make it inspiring and aspirational, showing the perfect blend of Swiss banking excellence
    and collaborative modern workplace culture."""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192
        }
    }

    print("📝 Prompt Details:")
    print("-" * 70)
    print("Scene: Swiss Alps with UBS bank")
    print("Elements: Office building, team meetings, happy employees")
    print("Style: Photorealistic corporate photography")
    print("-" * 70)

    print("\n🚀 Sending request to Gemini API...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        print(f"📊 Response Status: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.text[:500]}")
            return None

        data = response.json()

        # Check for image in response
        if 'candidates' in data:
            for candidate in data['candidates']:
                if 'content' in candidate and 'parts' in candidate['content']:
                    for part in candidate['content']['parts']:

                        # Check for image data
                        if 'inlineData' in part:
                            print("✅ Found image data in response!")

                            inline_data = part['inlineData']
                            mime_type = inline_data.get('mimeType', 'unknown')
                            print(f"📸 MIME type: {mime_type}")

                            if 'data' in inline_data:
                                # Decode the base64 image
                                image_data = base64.b64decode(inline_data['data'])
                                print(f"📦 Image size: {len(image_data):,} bytes")

                                # Create timestamp for unique filename
                                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

                                # Create output directory
                                output_dir = Path('output') / 'swiss-bank-scenes'
                                output_dir.mkdir(parents=True, exist_ok=True)

                                # Save the image
                                output_path = output_dir / f"ubs_swiss_mountains_{timestamp}.png"

                                # Open and save with PIL
                                img = Image.open(io.BytesIO(image_data))
                                print(f"📐 Image dimensions: {img.size}")
                                print(f"🎨 Image mode: {img.mode}")

                                # Save the image
                                img.save(output_path, 'PNG', optimize=True, quality=95)
                                print(f"\n✅ SUCCESS! Image saved to: {output_path}")

                                # Also save a high-res version if needed
                                hires_path = output_dir / f"ubs_swiss_mountains_{timestamp}_hires.png"
                                img.save(hires_path, 'PNG', optimize=False)
                                print(f"📸 High-res version saved to: {hires_path}")

                                # Save metadata
                                metadata = {
                                    'timestamp': timestamp,
                                    'prompt': prompt,
                                    'model': model_name,
                                    'image_size': len(image_data),
                                    'dimensions': img.size,
                                    'mime_type': mime_type,
                                    'file_paths': {
                                        'standard': str(output_path),
                                        'high_res': str(hires_path)
                                    }
                                }

                                metadata_path = output_dir / f"metadata_{timestamp}.json"
                                with open(metadata_path, 'w') as f:
                                    json.dump(metadata, f, indent=2)

                                print(f"📋 Metadata saved to: {metadata_path}")

                                return {
                                    'success': True,
                                    'image_path': str(output_path),
                                    'size': len(image_data),
                                    'dimensions': img.size
                                }

                        elif 'text' in part:
                            print(f"\n📝 Text response: {part['text'][:200]}...")
                            if len(part['text']) > 200:
                                print(f"... (truncated, full length: {len(part['text'])} chars)")

        print("\n❌ No image generated - API returned text only")
        print("The model might be describing the image instead of generating it.")
        return None

    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main execution"""

    print("\n🏔️ GENERATING SWISS BANK SCENE WITH UBS\n")

    result = generate_swiss_bank_image()

    print("\n" + "=" * 70)
    print("GENERATION SUMMARY")
    print("=" * 70)

    if result and result['success']:
        print("✅ Image successfully generated!")
        print(f"📍 Location: {result['image_path']}")
        print(f"📦 Size: {result['size']:,} bytes")
        print(f"📐 Dimensions: {result['dimensions']}")
        print("\n🎯 The image should show:")
        print("  • Swiss Alps mountain landscape")
        print("  • UBS bank building with visible logo")
        print("  • Happy employees in huddle meetings")
        print("  • Modern collaborative workspace")
    else:
        print("❌ Image generation failed")
        print("\nPossible reasons:")
        print("  1. The prompt might be too complex")
        print("  2. API quota might be exceeded")
        print("  3. The model might not support this type of scene")
        print("\n💡 Try simplifying the prompt or using a different approach")

if __name__ == "__main__":
    main()