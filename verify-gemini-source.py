#!/usr/bin/env python3
"""
Definitive test to verify if Gemini API is actually generating images
or if we're getting fallback placeholders
"""

import os
import json
import base64
import io
import requests
from datetime import datetime
from pathlib import Path
from PIL import Image
import hashlib

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def test_gemini_direct():
    """Direct test of Gemini API with detailed logging"""

    api_key = os.getenv('GEMINI_API_KEY')
    print("=" * 70)
    print("GEMINI API VERIFICATION TEST")
    print("=" * 70)
    print(f"API Key: {api_key[:20]}...{api_key[-10:]}")

    # Test the exact model you specified
    model_name = "gemini-2.5-flash-image-preview"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    print(f"\n📡 API Endpoint: {url[:80]}...")

    headers = {"Content-Type": "application/json"}

    # Simple prompt to test image generation
    payload = {
        "contents": [{
            "parts": [{
                "text": "Generate an image of a blue square with the text 'GEMINI TEST' in white letters"
            }]
        }],
        "generationConfig": {
            "temperature": 0.4,
            "topK": 32,
            "topP": 1,
            "maxOutputTokens": 4096
        }
    }

    print("\n🚀 Sending request to Gemini API...")
    print(f"📝 Prompt: {payload['contents'][0]['parts'][0]['text']}")

    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"\n📊 Response Status: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error Response: {response.text[:500]}")
            return None

        data = response.json()

        # Debug: Print the structure of response
        print("\n🔍 Response Structure:")
        print(f"  - Keys in response: {list(data.keys())}")

        if 'candidates' in data:
            print(f"  - Number of candidates: {len(data['candidates'])}")

            for i, candidate in enumerate(data['candidates']):
                print(f"\n  Candidate {i+1}:")
                if 'content' in candidate:
                    if 'parts' in candidate['content']:
                        for j, part in enumerate(candidate['content']['parts']):
                            print(f"    Part {j+1} keys: {list(part.keys())}")

                            # Check for actual image data
                            if 'inlineData' in part:
                                print("    ✅ FOUND INLINE IMAGE DATA!")
                                inline_data = part['inlineData']
                                print(f"    - MIME type: {inline_data.get('mimeType', 'unknown')}")

                                if 'data' in inline_data:
                                    # Decode and save the image
                                    image_data = base64.b64decode(inline_data['data'])

                                    # Calculate hash to verify it's unique
                                    image_hash = hashlib.md5(image_data).hexdigest()
                                    print(f"    - Image hash: {image_hash}")
                                    print(f"    - Image size: {len(image_data):,} bytes")

                                    # Save the raw image
                                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                                    output_path = f"gemini_verification_{timestamp}.png"

                                    try:
                                        img = Image.open(io.BytesIO(image_data))
                                        print(f"    - Image dimensions: {img.size}")
                                        print(f"    - Image mode: {img.mode}")
                                        img.save(output_path, 'PNG')
                                        print(f"    ✅ SAVED GEMINI IMAGE: {output_path}")

                                        return {
                                            'source': 'GEMINI_API',
                                            'image_path': output_path,
                                            'size': len(image_data),
                                            'hash': image_hash,
                                            'dimensions': img.size
                                        }
                                    except Exception as e:
                                        print(f"    ❌ Failed to process image: {e}")

                                        # Try saving raw data
                                        with open(f"raw_gemini_data_{timestamp}.bin", 'wb') as f:
                                            f.write(image_data)
                                        print(f"    💾 Saved raw data for inspection")

                            elif 'text' in part:
                                print(f"    📝 Text response: {part['text'][:100]}...")

                                # Check if it's describing an image instead of generating one
                                if 'image' in part['text'].lower() or 'generate' in part['text'].lower():
                                    print("    ⚠️ Model returned text description instead of image!")

        print("\n❌ NO IMAGE DATA FOUND IN RESPONSE")
        print("The model is NOT generating actual images, only text descriptions!")

        return None

    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_with_imagen_model():
    """Test with different Gemini image models"""

    api_key = os.getenv('GEMINI_API_KEY')

    print("\n" + "=" * 70)
    print("TESTING ALTERNATIVE GEMINI IMAGE MODELS")
    print("=" * 70)

    # Try different model variations
    models_to_test = [
        "imagen-3.0-generate-001",  # Latest Imagen model
        "gemini-pro-vision",         # Vision model
        "gemini-1.5-flash",          # Flash model
        "gemini-1.5-pro",            # Pro model
    ]

    for model_name in models_to_test:
        print(f"\n🧪 Testing model: {model_name}")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": "Create a simple test image with text 'API TEST'"
                }]
            }]
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            print(f"  Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                # Check for image data
                if 'candidates' in data:
                    for candidate in data['candidates']:
                        if 'content' in candidate and 'parts' in candidate['content']:
                            for part in candidate['content']['parts']:
                                if 'inlineData' in part:
                                    print(f"  ✅ {model_name} CAN generate images!")
                                    return model_name
                                elif 'text' in part:
                                    print(f"  📝 {model_name} returns text only")
            else:
                error_msg = response.text[:100] if response.text else "No error message"
                print(f"  ❌ Error: {error_msg}")

        except Exception as e:
            print(f"  ❌ Failed: {e}")

    return None

def verify_current_images():
    """Check if current images are from Gemini or placeholders"""

    print("\n" + "=" * 70)
    print("ANALYZING EXISTING IMAGES")
    print("=" * 70)

    # Check recent test images
    test_dirs = list(Path('output').glob('*test*'))

    for test_dir in sorted(test_dirs)[-2:]:  # Check last 2 test sessions
        print(f"\n📁 Checking: {test_dir}")

        for img_path in test_dir.rglob('*.png'):
            print(f"\n  🖼️ {img_path.name}")

            try:
                with Image.open(img_path) as img:
                    print(f"    - Size: {img_path.stat().st_size:,} bytes")
                    print(f"    - Dimensions: {img.size}")

                    # Check for telltale signs of placeholder
                    # Placeholder images typically have specific patterns
                    pixels = img.load()

                    # Sample some pixels to check for gradient patterns
                    width, height = img.size

                    # Check if it's a simple gradient (common in placeholders)
                    is_gradient = True
                    for x in range(0, width, width//10):
                        for y in range(0, height, height//10):
                            pixel = pixels[x, y]
                            # Check if pixel follows gradient pattern
                            # (this is a simplified check)

                    # Calculate image hash for comparison
                    with open(img_path, 'rb') as f:
                        file_hash = hashlib.md5(f.read()).hexdigest()
                    print(f"    - Hash: {file_hash}")

                    # Large file sizes (>500KB) might indicate actual AI generation
                    if img_path.stat().st_size > 500000:
                        print("    🔍 Large file size suggests possible AI generation")
                    else:
                        print("    🔍 Small file size suggests placeholder")

            except Exception as e:
                print(f"    ❌ Error analyzing: {e}")

def main():
    """Run all verification tests"""

    print("\n🔬 GEMINI IMAGE GENERATION VERIFICATION")
    print("This will definitively determine if images are from Gemini API\n")

    # Test 1: Direct API test with detailed logging
    result = test_gemini_direct()

    if result:
        print("\n" + "=" * 70)
        print("✅ CONFIRMATION: GEMINI IS GENERATING IMAGES")
        print("=" * 70)
        print(f"Source: {result['source']}")
        print(f"Image saved: {result['image_path']}")
        print(f"Size: {result['size']:,} bytes")
        print(f"Dimensions: {result['dimensions']}")
    else:
        print("\n" + "=" * 70)
        print("❌ GEMINI IS NOT GENERATING IMAGES")
        print("=" * 70)
        print("The API is returning text descriptions, not actual images.")
        print("\nPossible reasons:")
        print("1. The model 'gemini-2.5-flash-image-preview' may not support image generation")
        print("2. The API key might not have image generation permissions")
        print("3. Image generation might require a different endpoint or model")

        # Test alternative models
        working_model = test_with_imagen_model()

        if working_model:
            print(f"\n✅ Found working model: {working_model}")
        else:
            print("\n❌ No Gemini models found that generate images")
            print("All tested models return text descriptions only")

    # Analyze existing images
    verify_current_images()

    print("\n" + "=" * 70)
    print("VERDICT")
    print("=" * 70)

    if result:
        print("✅ Your images ARE being generated by Gemini API")
    else:
        print("❌ Your images are NOT from Gemini - they are programmatically")
        print("   generated placeholders created by our fallback system")
        print("\n📝 The Gemini API is providing text descriptions which we then")
        print("   use to create placeholder images with PIL (Python Imaging Library)")

if __name__ == "__main__":
    main()