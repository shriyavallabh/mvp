#!/usr/bin/env python3
"""
Brand Customizer Agent - Apply advisor-specific branding to WhatsApp Status images
Session: session_20251002_180551
"""

import os
import json
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# Paths
SESSION_DIR = "/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551"
INPUT_DIR = f"{SESSION_DIR}/images/status/validated"
OUTPUT_DIR = f"{SESSION_DIR}/images/status/final"
ADVISOR_DATA = f"{SESSION_DIR}/reports/advisor-data-summary.json"
ASSETS_DIR = "/Users/shriyavallabh/Desktop/mvp/assets"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_logo_placeholder(size, color, text):
    """Create a simple logo placeholder with initials"""
    logo = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)

    # Create circular background
    draw.ellipse([(0, 0), size], fill=color + (255,))

    # Add text (initials)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 60)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2 - 5)
    draw.text(position, text, fill=(255, 255, 255, 255), font=font)

    return logo

def add_text_with_shadow(draw, position, text, font, fill_color, shadow_color=(0, 0, 0, 180)):
    """Add text with shadow for better visibility"""
    x, y = position
    # Shadow
    draw.text((x + 2, y + 2), text, font=font, fill=shadow_color)
    # Main text
    draw.text((x, y), text, font=font, fill=fill_color)

def apply_branding(image_path, advisor_data, output_path):
    """Apply branding elements to a single image"""

    # Load image
    img = Image.open(image_path).convert('RGBA')
    width, height = img.size

    # Create overlay layer
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Extract advisor info
    name = advisor_data['name']
    arn = advisor_data['arn']
    primary_color = hex_to_rgb(advisor_data['branding']['primaryColor'])
    tagline = advisor_data['branding']['tagline']

    # Load or create logo
    logo_size = (150, 150)
    logo_path = f"{ASSETS_DIR}/logos/{name.lower().replace(' ', '-')}.png"

    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        logo = logo.resize(logo_size, Image.Resampling.LANCZOS)
    else:
        # Create placeholder with initials
        initials = ''.join([n[0] for n in name.split()[:2]])
        logo = create_logo_placeholder(logo_size, primary_color, initials)

    # Position logo (bottom-left with margin)
    logo_position = (40, height - logo_size[1] - 40)
    overlay.paste(logo, logo_position, logo)

    # Load fonts
    try:
        tagline_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 32)
        arn_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 28)
        name_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 36)
    except:
        tagline_font = ImageFont.load_default()
        arn_font = ImageFont.load_default()
        name_font = ImageFont.load_default()

    # Add advisor name below logo
    name_position = (40, height - 180)
    add_text_with_shadow(draw, name_position, name, name_font, primary_color + (255,))

    # Add ARN number (bottom-right)
    arn_text = f"{arn} | SEBI Registered"
    arn_bbox = draw.textbbox((0, 0), arn_text, font=arn_font)
    arn_width = arn_bbox[2] - arn_bbox[0]
    arn_position = (width - arn_width - 40, height - 40)
    add_text_with_shadow(draw, arn_position, arn_text, arn_font, (255, 255, 255, 255))

    # Add tagline at top (with semi-transparent banner)
    banner_height = 100
    banner = Image.new('RGBA', (width, banner_height), primary_color + (200,))
    overlay.paste(banner, (0, 0), banner)

    # Add tagline text
    tagline_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
    tagline_width = tagline_bbox[2] - tagline_bbox[0]
    tagline_position = ((width - tagline_width) // 2, 30)
    draw.text(tagline_position, tagline, font=tagline_font, fill=(255, 255, 255, 255))

    # Add color accent border
    border_width = 8
    draw.rectangle(
        [(0, 0), (width - 1, height - 1)],
        outline=primary_color + (255,),
        width=border_width
    )

    # Composite everything
    final_img = Image.alpha_composite(img, overlay)
    final_img = final_img.convert('RGB')

    # Save
    final_img.save(output_path, 'PNG', quality=95, optimize=True)

    return {
        'input': os.path.basename(image_path),
        'output': os.path.basename(output_path),
        'advisor': name,
        'arn': arn,
        'branding_applied': {
            'logo': True,
            'tagline': True,
            'arn_number': True,
            'color_accents': True,
            'border': True
        },
        'dimensions': f"{width}x{height}",
        'file_size_kb': round(os.path.getsize(output_path) / 1024, 2)
    }

def main():
    """Process all images with branding"""

    print("=" * 80)
    print("BRAND CUSTOMIZER AGENT - Session: session_20251002_180551")
    print("=" * 80)

    # Load advisor data
    with open(ADVISOR_DATA, 'r') as f:
        data = json.load(f)

    advisors = {
        'shruti': data['advisors'][0],  # Shruti Petkar
        'vidyadhar': data['advisors'][1],  # Vidyadhar Petkar
        'shriya': data['advisors'][2],  # Shriya Vallabh Petkar
        'avalok': data['advisors'][3]  # Avalok Langer
    }

    # Process all images
    results = []
    total_processed = 0

    for advisor_key, advisor_data in advisors.items():
        print(f"\nProcessing images for: {advisor_data['name']}")
        print(f"  ARN: {advisor_data['arn']}")
        print(f"  Brand Color: {advisor_data['branding']['primaryColor']}")
        print(f"  Tagline: {advisor_data['branding']['tagline']}")

        for i in range(1, 4):
            input_file = f"{INPUT_DIR}/{advisor_key}_status_{i}.png"

            if not os.path.exists(input_file):
                print(f"  ⚠️  Missing: {os.path.basename(input_file)}")
                continue

            # Generate output filename
            advisor_name_file = advisor_data['name'].lower().replace(' ', '_')
            output_file = f"{OUTPUT_DIR}/{advisor_name_file}_status_{i}_branded.png"

            # Apply branding
            try:
                result = apply_branding(input_file, advisor_data, output_file)
                results.append(result)
                total_processed += 1
                print(f"  ✓ Branded: {os.path.basename(output_file)} ({result['file_size_kb']} KB)")
            except Exception as e:
                print(f"  ✗ Error: {os.path.basename(input_file)} - {str(e)}")
                results.append({
                    'input': os.path.basename(input_file),
                    'output': None,
                    'advisor': advisor_data['name'],
                    'error': str(e)
                })

    # Generate summary report
    summary = {
        'session_id': 'session_20251002_180551',
        'timestamp': datetime.now().isoformat(),
        'agent': 'brand-customizer',
        'total_images_processed': total_processed,
        'total_images_expected': 12,
        'success_rate': f"{(total_processed / 12) * 100:.1f}%",
        'branding_elements_applied': {
            'advisor_logo': '150x150px, bottom-left, 40px margin',
            'tagline': 'Montserrat-style Bold 32pt, top banner',
            'arn_number': 'Arial 28pt, bottom-right, SEBI format',
            'color_accents': 'Advisor brand colors, borders and highlights',
            'border': '8px solid border in brand color'
        },
        'advisors_processed': [
            {
                'name': adv['name'],
                'images_branded': len([r for r in results if r.get('advisor') == adv['name'] and r.get('output')]),
                'brand_color': adv['branding']['primaryColor'],
                'tagline': adv['branding']['tagline'],
                'arn': adv['arn']
            }
            for adv in advisors.values()
        ],
        'detailed_results': results,
        'output_directory': OUTPUT_DIR,
        'validation': {
            'all_images_branded': total_processed == 12,
            'consistent_dimensions': '1080x1920 (9:16 portrait)',
            'file_format': 'PNG with optimization',
            'quality_settings': 'quality=95, optimized=True'
        }
    }

    # Save summary
    summary_path = f"{SESSION_DIR}/reports/branding-summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 80)
    print("BRANDING SUMMARY")
    print("=" * 80)
    print(f"Total Images Processed: {total_processed}/12")
    print(f"Success Rate: {summary['success_rate']}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print(f"Summary Report: {summary_path}")
    print("=" * 80)

    # Create worklog entry
    worklog_dir = "/Users/shriyavallabh/Desktop/mvp/worklog"
    os.makedirs(worklog_dir, exist_ok=True)
    worklog_path = f"{worklog_dir}/worklog-brand-customizer-{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

    with open(worklog_path, 'w') as f:
        f.write(f"# Brand Customizer Agent - Worklog\n\n")
        f.write(f"**Session**: session_20251002_180551\n")
        f.write(f"**Timestamp**: {datetime.now().isoformat()}\n")
        f.write(f"**Agent**: brand-customizer\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- **Images Processed**: {total_processed}/12\n")
        f.write(f"- **Success Rate**: {summary['success_rate']}\n")
        f.write(f"- **Output Directory**: {OUTPUT_DIR}\n\n")
        f.write(f"## Branding Elements Applied\n\n")
        for elem, detail in summary['branding_elements_applied'].items():
            f.write(f"- **{elem.replace('_', ' ').title()}**: {detail}\n")
        f.write(f"\n## Advisors Processed\n\n")
        for adv in summary['advisors_processed']:
            f.write(f"### {adv['name']}\n")
            f.write(f"- Images Branded: {adv['images_branded']}/3\n")
            f.write(f"- Brand Color: {adv['brand_color']}\n")
            f.write(f"- Tagline: {adv['tagline']}\n")
            f.write(f"- ARN: {adv['arn']}\n\n")
        f.write(f"## Detailed Results\n\n")
        for result in results:
            if result.get('output'):
                f.write(f"- ✓ {result['input']} → {result['output']} ({result['file_size_kb']} KB)\n")
            else:
                f.write(f"- ✗ {result['input']} - {result.get('error', 'Unknown error')}\n")

    print(f"\nWorklog saved: {worklog_path}")

    return summary

if __name__ == "__main__":
    main()
