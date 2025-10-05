#!/usr/bin/env python3
"""
Create WhatsApp Media Reference Image (1200×628)
This reference controls Gemini's aspect ratio for WhatsApp media messages
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def create_whatsapp_media_reference():
    """Create 1200×628 reference image for WhatsApp media messages"""

    # Create canvas
    img = Image.new('RGB', (1200, 628), color='#F5F5F5')
    draw = ImageDraw.Draw(img)

    # Add border to show format
    draw.rectangle([30, 30, 1170, 598], outline='#1B365D', width=4)

    # Load fonts
    try:
        font_huge = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 100)
        font_large = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 50)
        font_medium = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 36)
    except:
        font_huge = ImageFont.load_default()
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()

    # Add dimension text
    draw.text((600, 250), "1200 × 628", fill='#1B365D', anchor='mm', font=font_huge)
    draw.text((600, 350), "WhatsApp Media Format", fill='#666666', anchor='mm', font=font_large)
    draw.text((600, 420), "Landscape (16:8.36 ratio)", fill='#999999', anchor='mm', font=font_medium)

    # Add layout guides
    # Left 60% for visual content
    draw.line([(720, 30), (720, 598)], fill='#FFD700', width=2)
    draw.text((360, 560), "Visual Content (60%)", fill='#FFD700', anchor='mm', font=font_medium)
    draw.text((960, 560), "Message + CTA (40%)", fill='#FFD700', anchor='mm', font=font_medium)

    # Save reference
    output_path = Path("scripts/reference_1200x628.png")
    img.save(output_path, 'PNG', quality=95)

    print(f"✅ WhatsApp Media reference created: {output_path}")
    print(f"   Dimensions: 1200×628 pixels (landscape)")
    print(f"   Use this for Gemini aspect ratio control")

    return output_path

if __name__ == "__main__":
    create_whatsapp_media_reference()
