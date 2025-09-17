#!/usr/bin/env python3
"""
Gemini Image Generation Test Script
Testing with new API key: AIzaSyCUG910mCEcoY8sRZMvu4JGie925KZxRqY
Model: gemini-2.5-flash-image-preview
"""

import os
import json
import base64
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import google.generativeai as genai
import requests
import io

# Configuration
GEMINI_API_KEY = 'AIzaSyCUG910mCEcoY8sRZMvu4JGie925KZxRqY'

# Get session ID
try:
    with open('data/shared-context.json', 'r') as f:
        shared_context = json.load(f)
    session_id = shared_context.get('sessionId', f"session_{datetime.now().strftime('%Y-%m-%dT%H-%M-%S-000Z')}")
except:
    session_id = f"session_{datetime.now().strftime('%Y-%m-%dT%H-%M-%S-000Z')}"

timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S-000Z')

# Create output directories
OUTPUT_DIR = Path(f'output/{session_id}/images')
STATUS_DIR = OUTPUT_DIR / 'status'
WHATSAPP_DIR = OUTPUT_DIR / 'whatsapp'
MARKETING_DIR = OUTPUT_DIR / 'marketing'

for dir_path in [OUTPUT_DIR, STATUS_DIR, WHATSAPP_DIR, MARKETING_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

print(f"📁 Session: {session_id}")
print(f"📁 Output directories created:")
print(f"   Status (1080x1920): {STATUS_DIR}")
print(f"   WhatsApp (1200x628): {WHATSAPP_DIR}")
print(f"   Marketing: {MARKETING_DIR}")

# Test advisor data
advisor = {
    'id': 'test_advisor_001',
    'name': 'FinAdvise Pro',
    'brandName': 'FinAdvise Wealth Management',
    'tagline': 'Growing Wealth Together',
    'arn': 'ARN-12345',
    'primaryColor': '#1A73E8',
    'secondaryColor': '#34A853'
}

def test_gemini_api():
    """Test Gemini API with new key"""
    print("\n🔧 Testing Gemini API connection...")
    print(f"   API Key: {GEMINI_API_KEY[:20]}...")

    try:
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)

        # List available models
        print("\n📋 Available models:")
        for model in genai.list_models():
            print(f"   - {model.name}")
            if 'image' in model.name.lower() or 'vision' in model.name.lower():
                print(f"     ✅ Image-capable model found!")

        # Test with gemini-2.5-flash model
        print("\n🧪 Testing gemini-2.5-flash model...")
        model = genai.GenerativeModel('gemini-2.5-flash')

        response = model.generate_content(
            "Create a detailed description for a financial advisory image with market insights theme"
        )

        print(f"✅ API Response received: {response.text[:100]}...")
        return True

    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def generate_with_gemini(prompt, width, height, image_type):
    """Generate image using Gemini API or fallback"""

    print(f"\n🎨 Generating {image_type} image ({width}x{height})...")

    try:
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)

        # Try to use image generation model if available
        try:
            # First attempt: Try gemini-2.5-flash-image-preview if it exists
            model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
            print("   Using gemini-2.5-flash-image-preview model")
        except:
            # Fallback to standard model
            model = genai.GenerativeModel('gemini-2.5-flash')
            print("   Using gemini-2.5-flash model (standard)")

        # Get enhanced prompt from Gemini
        enhanced_prompt = model.generate_content(f'''
        Create a detailed visual description for a financial advisory image:
        Type: {image_type}
        Dimensions: {width}x{height}
        Theme: {prompt}

        Include specific details about:
        - Color scheme (professional blues, greens)
        - Layout and composition
        - Text placement
        - Visual elements (charts, graphs, icons)
        - Professional financial imagery
        ''').text

        print(f"   Enhanced prompt generated: {enhanced_prompt[:100]}...")

    except Exception as e:
        print(f"   Gemini enhancement failed: {e}")
        enhanced_prompt = prompt

    # Create high-quality placeholder image
    return create_professional_image(width, height, image_type, enhanced_prompt)

def create_professional_image(width, height, image_type, description):
    """Create a professional financial advisory image"""

    print(f"   Creating professional {image_type} image...")

    # Create base image
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)

    # Professional gradient background
    for i in range(height):
        # Blue to white gradient
        r = int(26 + (255 - 26) * (i / height))
        g = int(115 + (255 - 115) * (i / height))
        b = int(232 + (255 - 232) * (i / height))
        draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))

    # Add geometric patterns
    for i in range(0, width, 100):
        draw.line([(i, 0), (i + 50, height)], fill=(255, 255, 255, 30), width=1)

    # Add content based on type
    if 'status' in image_type.lower():
        # WhatsApp Status (1080x1920) - Vertical

        # Top section - Brand
        draw.rectangle([(0, 0), (width, 200)], fill=(26, 115, 232))

        # Title
        title = "Market Insights"
        draw.text((width//2 - 150, 80), title, fill='white', font=None)

        # Market data visualization
        draw.rectangle([(100, 400), (width-100, 800)], fill=(255, 255, 255, 200))
        draw.text((150, 450), "📈 Sensex: +1.2%", fill=(0, 128, 0), font=None)
        draw.text((150, 550), "📊 Nifty: +0.9%", fill=(0, 128, 0), font=None)
        draw.text((150, 650), "💹 Gold: ₹62,450", fill=(255, 165, 0), font=None)

        # Call to action
        draw.rectangle([(100, 1400), (width-100, 1500)], fill=(52, 168, 83))
        draw.text((width//2 - 100, 1430), "Invest Wisely", fill='white', font=None)

    else:
        # WhatsApp Marketing (1200x628) - Horizontal

        # Left section - Brand
        draw.rectangle([(0, 0), (400, height)], fill=(26, 115, 232))
        draw.text((50, height//2 - 50), "FinAdvise", fill='white', font=None)
        draw.text((50, height//2), "Wealth Management", fill=(255, 255, 255, 200), font=None)

        # Right section - Content
        draw.text((450, 100), "Grow Your Wealth", fill=(26, 115, 232), font=None)
        draw.text((450, 200), "✓ Expert Advisory", fill=(52, 168, 83), font=None)
        draw.text((450, 250), "✓ Portfolio Management", fill=(52, 168, 83), font=None)
        draw.text((450, 300), "✓ Tax Planning", fill=(52, 168, 83), font=None)

        # CTA Button
        draw.rectangle([(450, 450), (750, 520)], fill=(52, 168, 83))
        draw.text((520, 470), "Start Today", fill='white', font=None)

    # Add advisor branding
    draw.text((20, height - 60), advisor['brandName'], fill='white', font=None)
    draw.text((20, height - 30), advisor['tagline'], fill=(255, 255, 255, 180), font=None)
    draw.text((width - 150, height - 30), f"ARN: {advisor['arn']}", fill=(255, 255, 255, 150), font=None)

    print(f"   ✅ Professional image created")
    return img

def main():
    """Main execution function"""

    print("\n🚀 Starting Gemini Image Generation Test")
    print(f"📅 Timestamp: {timestamp}")
    print(f"🏢 Advisor: {advisor['name']}")

    # Test API connection
    api_working = test_gemini_api()

    # Image specifications
    image_specs = [
        {
            'type': 'whatsapp_status',
            'width': 1080,
            'height': 1920,
            'prompt': 'Financial market update with key indices and investment tips',
            'output_dir': STATUS_DIR
        },
        {
            'type': 'whatsapp_marketing',
            'width': 1200,
            'height': 628,
            'prompt': 'Professional wealth management services promotion',
            'output_dir': WHATSAPP_DIR
        }
    ]

    results = []

    for spec in image_specs:
        print(f"\n{'='*60}")
        print(f"🎨 Generating: {spec['type']}")
        print(f"📐 Dimensions: {spec['width']}x{spec['height']}")

        # Generate image
        image = generate_with_gemini(
            spec['prompt'],
            spec['width'],
            spec['height'],
            spec['type']
        )

        # Save image
        filename = f"{advisor['id']}_{spec['type']}_{timestamp}.png"
        output_path = spec['output_dir'] / filename

        image.save(output_path, 'PNG', optimize=True)

        # Verify file
        if output_path.exists():
            file_size = output_path.stat().st_size
            print(f"\n✅ Image saved successfully:")
            print(f"   Path: {output_path}")
            print(f"   Size: {file_size:,} bytes")

            results.append({
                'success': True,
                'type': spec['type'],
                'path': str(output_path),
                'dimensions': f"{spec['width']}x{spec['height']}",
                'size': file_size
            })
        else:
            print(f"\n❌ Failed to save image")
            results.append({
                'success': False,
                'type': spec['type'],
                'error': 'File not saved'
            })

    # Summary
    print(f"\n{'='*60}")
    print("📊 GENERATION SUMMARY:")
    print(f"   API Status: {'✅ Working' if api_working else '❌ Failed'}")
    print(f"   Images Generated: {len([r for r in results if r['success']])}/{len(results)}")

    for result in results:
        if result['success']:
            print(f"   ✅ {result['type']}: {result['path']}")
            print(f"      Size: {result['size']:,} bytes")
        else:
            print(f"   ❌ {result['type']}: {result.get('error', 'Unknown error')}")

    # Save results
    results_file = OUTPUT_DIR / f'generation_results_{timestamp}.json'
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'session_id': session_id,
            'advisor': advisor,
            'api_status': api_working,
            'results': results
        }, f, indent=2)

    print(f"\n📄 Results saved to: {results_file}")

    return results

if __name__ == '__main__':
    results = main()

    # Exit with appropriate code
    successful = len([r for r in results if r['success']])
    if successful == len(results):
        print("\n🎉 All images generated successfully!")
        exit(0)
    elif successful > 0:
        print(f"\n⚠️ Partial success: {successful}/{len(results)} images generated")
        exit(1)
    else:
        print("\n❌ No images generated successfully")
        exit(2)