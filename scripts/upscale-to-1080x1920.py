#!/usr/bin/env python3
"""
Upscale Gemini-generated vertical images to exact 1080x1920 WhatsApp Status format
High-quality upscaling preserving aspect ratio
"""

from PIL import Image
from pathlib import Path

SESSION_DIR = "output/session_1759383378"
INPUT_DIR = Path(SESSION_DIR) / "status-images" / "gemini-reference-1920"
OUTPUT_DIR = Path(SESSION_DIR) / "status-images" / "final-1080x1920"

OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

print("\n📐 UPSCALING TO EXACT 1080×1920 (WhatsApp Status)\n")
print("=" * 70)

count = 0

for img_path in sorted(INPUT_DIR.glob("REFERENCE_*.png")):
    print(f"\n📤 {img_path.name}")

    # Load image
    img = Image.open(img_path)
    original_size = img.size

    print(f"   Original: {original_size[0]}×{original_size[1]}px")

    # Check if already correct size
    if img.size == (1080, 1920):
        print(f"   ✅ Already 1080×1920, copying...")
        img.save(OUTPUT_DIR / img_path.name.replace('REFERENCE_', 'FINAL_'), 'PNG', quality=95)
        count += 1
        continue

    # Upscale to 1080×1920 using high-quality LANCZOS resampling
    upscaled = img.resize((1080, 1920), Image.Resampling.LANCZOS)

    # Save
    output_path = OUTPUT_DIR / img_path.name.replace('REFERENCE_', 'FINAL_')
    upscaled.save(output_path, 'PNG', quality=95, optimize=True)

    print(f"   ✅ Upscaled: 1080×1920px")
    print(f"   💾 {output_path.name}")
    count += 1

print("\n" + "=" * 70)
print(f"\n✅ {count} images ready for WhatsApp Status!")
print(f"📁 Location: {OUTPUT_DIR}")
print(f"📱 Perfect dimensions: 1080×1920 (9:16 vertical)\n")
