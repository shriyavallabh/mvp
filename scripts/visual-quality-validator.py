#!/usr/bin/env python3
"""
Visual Quality Validator - AI-powered aesthetic review for WhatsApp Status images
Uses Gemini Vision to validate image quality before acceptance
"""

import os
import sys
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import json
from datetime import datetime

SESSION_DIR = "output/session_1759383378"
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found!")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# Quality validation criteria
VALIDATION_PROMPT = """You are an expert visual quality auditor for professional WhatsApp Status images. Analyze this image with extreme scrutiny and provide a detailed quality assessment.

**CRITICAL VALIDATION CHECKLIST:**

1. **Text Quality (CRITICAL - Auto-reject if failed)**
   ✓ No debug text (like "360px", "1080x1920", placeholder text)
   ✓ No duplicate text (same label repeated twice)
   ✓ All text properly aligned and centered
   ✓ No text cutoff at edges
   ✓ No overlapping text elements
   ✓ Clear, readable typography
   ✓ Proper contrast (text vs background)

2. **Visual Distortion (CRITICAL - Auto-reject if failed)**
   ✓ No stretching or warping
   ✓ No pixelation or blur
   ✓ Proportional elements (circles are circular, not oval)
   ✓ Clean edges and shapes
   ✓ Professional image quality

3. **Layout & Composition**
   ✓ Proper padding from all edges (minimum 60px)
   ✓ Visual hierarchy clear
   ✓ Balanced composition
   ✓ Adequate white space
   ✓ No elements touching edges

4. **Branding Elements**
   ✓ ARN number present and correct format
   ✓ Tagline/advisor name present
   ✓ Logo or brand mark visible
   ✓ Consistent brand colors
   ✓ Professional appearance

5. **Content Accuracy**
   ✓ Numbers/data clearly visible
   ✓ Key message prominent
   ✓ Call-to-action clear (if applicable)
   ✓ No grammatical errors in visible text

6. **Professional Standards**
   ✓ Grammy/Oscar-level design quality
   ✓ Stop-scroll-worthy visual appeal
   ✓ Mobile-optimized (clear on 5-inch screen)
   ✓ Comparable to top fintech brands (Apple/Google quality)

**OUTPUT FORMAT (JSON):**
{
  "overall_score": 0-10,
  "pass": true/false,
  "critical_issues": ["list of auto-reject issues"],
  "warnings": ["list of non-critical issues"],
  "aesthetic_score": 0-10,
  "text_quality_score": 0-10,
  "visual_distortion_score": 0-10,
  "layout_score": 0-10,
  "brand_compliance_score": 0-10,
  "recommendation": "ACCEPT/REJECT/REGENERATE",
  "specific_problems": {
    "debug_text_found": false,
    "duplicate_text": false,
    "alignment_issues": false,
    "stretching_detected": false,
    "pixelation": false,
    "text_cutoff": false,
    "branding_missing": false
  },
  "detailed_feedback": "Specific issues to fix for regeneration"
}

**SCORING RULES:**
- overall_score < 7.0 = REJECT
- Any critical_issues = REJECT (regardless of score)
- overall_score >= 8.0 AND no critical issues = ACCEPT
- overall_score 7.0-7.9 AND no critical issues = REGENERATE (close but needs improvement)

Analyze the image thoroughly and respond ONLY with valid JSON."""

def validate_image(image_path, advisor_info):
    """Validate image quality using Gemini Vision"""

    try:
        print(f"\n🔍 Validating: {image_path.name}")

        # Use Gemini Vision model
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Load image
        img = Image.open(image_path)

        # Create validation context
        context = f"""
Image Details:
- File: {image_path.name}
- Advisor: {advisor_info['name']}
- Expected ARN: {advisor_info['arn']}
- Expected Tagline: {advisor_info['tagline']}
- Required Dimensions: 1080×1920 (9:16 vertical)
- Actual Dimensions: {img.size[0]}×{img.size[1]}
"""

        # Validate with Gemini Vision
        response = model.generate_content([
            context + "\n" + VALIDATION_PROMPT,
            img
        ])

        # Parse JSON response
        response_text = response.text.strip()

        # Extract JSON (handle markdown code blocks)
        if '```json' in response_text:
            json_str = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            json_str = response_text.split('```')[1].split('```')[0].strip()
        else:
            json_str = response_text

        validation_result = json.loads(json_str)

        # Print results
        overall_score = validation_result.get('overall_score', 0)
        recommendation = validation_result.get('recommendation', 'REJECT')

        print(f"   Overall Score: {overall_score}/10")
        print(f"   Recommendation: {recommendation}")

        if validation_result.get('critical_issues'):
            print(f"   ❌ Critical Issues:")
            for issue in validation_result['critical_issues']:
                print(f"      • {issue}")

        if validation_result.get('warnings'):
            print(f"   ⚠️  Warnings:")
            for warning in validation_result['warnings']:
                print(f"      • {warning}")

        # Specific problems
        problems = validation_result.get('specific_problems', {})
        if problems.get('debug_text_found'):
            print(f"   🐛 Debug text detected (360px, 1080x1920, etc.)")
        if problems.get('duplicate_text'):
            print(f"   🔁 Duplicate text found (ARN written twice)")
        if problems.get('alignment_issues'):
            print(f"   📐 Text alignment problems")
        if problems.get('stretching_detected'):
            print(f"   📏 Image stretching/distortion detected")

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
    print("\n🎨 VISUAL QUALITY VALIDATOR (AI-Powered)\n")
    print("=" * 70)

    # Load advisor data
    advisor_file = Path(SESSION_DIR) / "advisor_data_summary.json"
    with open(advisor_file) as f:
        advisor_data = json.load(f)

    # Directory to validate
    image_dir = Path(SESSION_DIR) / "status-images" / "final-1080x1920"
    output_dir = Path(SESSION_DIR) / "status-images" / "validated"
    rejected_dir = Path(SESSION_DIR) / "status-images" / "rejected"

    output_dir.mkdir(exist_ok=True, parents=True)
    rejected_dir.mkdir(exist_ok=True, parents=True)

    validation_report = {
        'timestamp': datetime.now().isoformat(),
        'total_images': 0,
        'accepted': 0,
        'rejected': 0,
        'regenerate_needed': 0,
        'results': []
    }

    for img_path in sorted(image_dir.glob("FINAL_*.png")):
        validation_report['total_images'] += 1

        # Extract advisor ID
        advisor_id = img_path.name.split('_')[1]  # FINAL_ADV001_001.png → ADV001

        # Find advisor info
        advisor = next((a for a in advisor_data['advisors'] if a['advisorId'] == advisor_id), None)
        if not advisor:
            print(f"⚠️  Advisor {advisor_id} not found, skipping validation")
            continue

        advisor_info = {
            'name': advisor['personalInfo']['name'],
            'tagline': advisor['customization']['tagline'],
            'arn': advisor['personalInfo']['arn']
        }

        # Validate
        result = validate_image(img_path, advisor_info)
        result['image_file'] = img_path.name
        result['advisor'] = advisor_info['name']

        validation_report['results'].append(result)

        # Move based on recommendation
        recommendation = result.get('recommendation', 'REJECT')

        if recommendation == 'ACCEPT':
            # Copy to validated directory
            import shutil
            shutil.copy2(img_path, output_dir / img_path.name)
            validation_report['accepted'] += 1
            print(f"   ✅ ACCEPTED - Moved to validated/")

        elif recommendation == 'REGENERATE':
            validation_report['regenerate_needed'] += 1
            print(f"   🔄 NEEDS REGENERATION")
            print(f"   📝 Feedback: {result.get('detailed_feedback', 'N/A')}")

        else:  # REJECT
            # Move to rejected directory
            import shutil
            shutil.move(img_path, rejected_dir / img_path.name)
            validation_report['rejected'] += 1
            print(f"   ❌ REJECTED - Moved to rejected/")

    # Save validation report
    report_path = Path(SESSION_DIR) / "status-images" / f"validation-report-{int(datetime.now().timestamp())}.json"
    with open(report_path, 'w') as f:
        json.dump(validation_report, f, indent=2)

    print("\n" + "=" * 70)
    print(f"\n📊 VALIDATION SUMMARY:")
    print(f"   Total Images: {validation_report['total_images']}")
    print(f"   ✅ Accepted: {validation_report['accepted']}")
    print(f"   ❌ Rejected: {validation_report['rejected']}")
    print(f"   🔄 Need Regeneration: {validation_report['regenerate_needed']}")
    print(f"\n📁 Validated Images: {output_dir}")
    print(f"📁 Rejected Images: {rejected_dir}")
    print(f"📄 Full Report: {report_path}\n")

if __name__ == "__main__":
    main()
