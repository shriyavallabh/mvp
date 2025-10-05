#!/usr/bin/env python3
"""
WhatsApp Media Validator - AI Visual Quality Auditor for 1200×628 images
Validates text-image complementarity and visual quality
"""

import os
import sys
import json
from pathlib import Path
import google.generativeai as genai
from PIL import Image
from datetime import datetime

if len(sys.argv) > 1:
    SESSION_DIR = sys.argv[1]
else:
    sessions = sorted(Path("output").glob("session_*"))
    if sessions:
        SESSION_DIR = str(sessions[-1])
    else:
        print("❌ No session found")
        sys.exit(1)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

VALIDATION_PROMPT = """You are an expert visual quality auditor for professional WhatsApp Media images (1200×628).

**IMAGE CONTEXT:**
This image is paired with this WhatsApp text message:
"{whatsapp_text}"

Expected ARN: {arn}
Expected Tagline: {tagline}
Advisor: {advisor_name}

**CRITICAL VALIDATION - TEXT-IMAGE COMPLEMENTARITY:**

1. **Text-Image Alignment** (CRITICAL):
   ✓ Image visually represents the text message
   ✓ Same data/numbers appear in both text and image
   ✓ Image proves or supports the text claims
   ✓ Together they form a complete, coherent message
   ✓ No contradictions between text and image

2. **Visual Quality** (CRITICAL):
   ✓ Exact dimensions: 1200×628 pixels
   ✓ No debug text (dimensions, px values, placeholders)
   ✓ No duplicate text (same label twice)
   ✓ Perfect alignment and centering
   ✓ No text cutoff at edges
   ✓ No stretching or distortion
   ✓ Professional design quality

3. **Layout & Composition** (1200×628 landscape):
   ✓ Left 60% (720px): Visual content area
   ✓ Right 40% (480px): Message/CTA area
   ✓ Minimum 40px padding from all edges
   ✓ Clear visual hierarchy
   ✓ Mobile-optimized (readable on 5-inch screen)

4. **Branding Elements**:
   ✓ ARN number present and correct
   ✓ Tagline visible
   ✓ Logo or brand mark present
   ✓ Brand colors consistent
   ✓ Professional financial appearance

5. **Content Accuracy**:
   ✓ Numbers/data match text message
   ✓ Key metric visible and clear
   ✓ Call-to-action present
   ✓ No grammatical errors

6. **Professional Standards**:
   ✓ Grammy/Oscar-level design
   ✓ Stop-scroll-worthy visual appeal
   ✓ Comparable to top fintech brands (Apple/Google/UBS)
   ✓ Financial advisory credibility

**OUTPUT FORMAT (JSON):**
{{
  "overall_score": 0-10,
  "pass": true/false,
  "text_image_complementarity_score": 0-10,
  "visual_quality_score": 0-10,
  "layout_score": 0-10,
  "brand_compliance_score": 0-10,
  "recommendation": "ACCEPT/REJECT/REGENERATE",
  "critical_issues": ["list of auto-reject issues"],
  "warnings": ["list of non-critical issues"],
  "specific_problems": {{
    "text_image_mismatch": false,
    "debug_text_found": false,
    "duplicate_text": false,
    "alignment_issues": false,
    "dimension_incorrect": false,
    "branding_missing": false
  }},
  "complementarity_analysis": "How well image complements the text message",
  "detailed_feedback": "Specific issues and recommendations"
}}

**SCORING RULES:**
- overall_score < 7.0 = REJECT
- text_image_mismatch = REJECT (critical)
- Any critical_issues = REJECT
- overall_score >= 8.0 AND no critical issues = ACCEPT
- overall_score 7.0-7.9 AND no critical issues = REGENERATE

Analyze thoroughly and respond ONLY with valid JSON."""

def validate_whatsapp_media(image_path, whatsapp_text, advisor_info):
    """Validate WhatsApp media image with text complementarity check"""

    try:
        print(f"\n🔍 Validating: {image_path.name}")
        print(f"   📝 Paired text: {whatsapp_text[:60]}...")

        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        img = Image.open(image_path)

        # Create validation context
        context = VALIDATION_PROMPT.format(
            whatsapp_text=whatsapp_text,
            arn=advisor_info['arn'],
            tagline=advisor_info['tagline'],
            advisor_name=advisor_info['name']
        )

        context += f"\n\nImage Dimensions: {img.size[0]}×{img.size[1]} (expected: 1200×628)"

        # Validate with Gemini Vision
        response = model.generate_content([context, img])

        # Parse JSON
        response_text = response.text.strip()

        if '```json' in response_text:
            json_str = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            json_str = response_text.split('```')[1].split('```')[0].strip()
        else:
            json_str = response_text

        validation_result = json.loads(json_str)

        # Print results
        overall_score = validation_result.get('overall_score', 0)
        complementarity_score = validation_result.get('text_image_complementarity_score', 0)
        recommendation = validation_result.get('recommendation', 'REJECT')

        print(f"   Overall Score: {overall_score}/10")
        print(f"   Text-Image Complementarity: {complementarity_score}/10")
        print(f"   Recommendation: {recommendation}")

        if validation_result.get('critical_issues'):
            print(f"   ❌ Critical Issues:")
            for issue in validation_result['critical_issues']:
                print(f"      • {issue}")

        problems = validation_result.get('specific_problems', {})
        if problems.get('text_image_mismatch'):
            print(f"   ⚠️  Text-Image mismatch detected")
        if problems.get('debug_text_found'):
            print(f"   🐛 Debug text found")

        print(f"   💡 {validation_result.get('complementarity_analysis', 'N/A')[:80]}...")

        return validation_result

    except Exception as e:
        print(f"   ❌ Validation error: {e}")
        return {
            'overall_score': 0,
            'pass': False,
            'recommendation': 'REJECT',
            'critical_issues': [f'Validation failed: {str(e)}'],
            'detailed_feedback': 'Could not complete validation'
        }

def main():
    print("\n🎨 WHATSAPP MEDIA VALIDATOR (AI-Powered)\n")
    print("=" * 70)

    # Load WhatsApp messages (for text)
    whatsapp_file = Path(SESSION_DIR) / "whatsapp" / "whatsapp-messages.json"
    if not whatsapp_file.exists():
        print(f"❌ WhatsApp messages not found: {whatsapp_file}")
        sys.exit(1)

    with open(whatsapp_file) as f:
        whatsapp_data = json.load(f)

    messages = whatsapp_data.get('messages', [])

    # Load advisor data
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    # Images directory
    image_dir = Path(SESSION_DIR) / "whatsapp-media"
    validated_dir = Path(SESSION_DIR) / "whatsapp-media-validated"
    rejected_dir = Path(SESSION_DIR) / "whatsapp-media-rejected"

    validated_dir.mkdir(exist_ok=True, parents=True)
    rejected_dir.mkdir(exist_ok=True, parents=True)

    validation_report = {
        'timestamp': datetime.now().isoformat(),
        'total_images': 0,
        'accepted': 0,
        'rejected': 0,
        'regenerate_needed': 0,
        'results': []
    }

    for img_path in sorted(image_dir.glob("WHATSAPP_MEDIA_*.png")):
        validation_report['total_images'] += 1

        # Extract advisor ID and index
        parts = img_path.name.replace('WHATSAPP_MEDIA_', '').replace('.png', '').split('_')
        advisor_id = parts[0]
        msg_idx = int(parts[1]) - 1

        # Find corresponding message
        message = messages[msg_idx] if msg_idx < len(messages) else None
        if not message:
            print(f"⚠️  Message {msg_idx+1} not found, skipping")
            continue

        whatsapp_text = message.get('messageText', message.get('text', ''))

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

        # Validate
        result = validate_whatsapp_media(img_path, whatsapp_text, advisor_info)
        result['image_file'] = img_path.name
        result['advisor'] = advisor_info['name']
        result['paired_text'] = whatsapp_text

        validation_report['results'].append(result)

        # Move based on recommendation
        recommendation = result.get('recommendation', 'REJECT')

        if recommendation == 'ACCEPT':
            import shutil
            shutil.copy2(img_path, validated_dir / img_path.name)
            validation_report['accepted'] += 1
            print(f"   ✅ ACCEPTED - Moved to validated/")

        elif recommendation == 'REGENERATE':
            validation_report['regenerate_needed'] += 1
            print(f"   🔄 NEEDS REGENERATION")

        else:
            import shutil
            shutil.move(img_path, rejected_dir / img_path.name)
            validation_report['rejected'] += 1
            print(f"   ❌ REJECTED - Moved to rejected/")

    # Save report
    report_path = Path(SESSION_DIR) / "whatsapp-media" / f"validation-report-{int(datetime.now().timestamp())}.json"
    with open(report_path, 'w') as f:
        json.dump(validation_report, f, indent=2)

    print("\n" + "=" * 70)
    print(f"\n📊 VALIDATION SUMMARY:")
    print(f"   Total Images: {validation_report['total_images']}")
    print(f"   ✅ Accepted: {validation_report['accepted']}")
    print(f"   ❌ Rejected: {validation_report['rejected']}")
    print(f"   🔄 Need Regeneration: {validation_report['regenerate_needed']}")
    print(f"\n📁 Validated: {validated_dir}")
    print(f"📁 Rejected: {rejected_dir}")
    print(f"📄 Report: {report_path}\n")

if __name__ == "__main__":
    main()
