#!/usr/bin/env python3
"""
Complete Quality Control Pipeline
Validates → Regenerates → Re-validates until all images pass
Maximum 3 regeneration attempts per image
"""

import os
import sys
from pathlib import Path
import subprocess
from datetime import datetime

SESSION_DIR = "output/session_1759383378"
MAX_ATTEMPTS = 3

def run_validation(input_dir):
    """Run visual quality validator on directory"""
    print(f"\n🔍 Running validation on: {input_dir}")

    # Temporarily modify validator to use custom input dir
    cmd = f"""
export GEMINI_API_KEY='{os.getenv("GEMINI_API_KEY")}' && python3 -c "
import sys
sys.path.insert(0, 'scripts')

# Override image_dir in validator
import json
from pathlib import Path
from datetime import datetime

# Import validator functions (simplified inline version)
exec(open('scripts/visual-quality-validator.py').read().replace(
    'image_dir = Path(SESSION_DIR) / \\\"status-images\\\" / \\\"final-1080x1920\\\"',
    'image_dir = Path(\\'{input_dir}\\')'
))
"
"""

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)

    return result.returncode == 0

def main():
    print("\n🎯 QUALITY CONTROL PIPELINE (Automated)\n")
    print("=" * 70)
    print(f"Max attempts per image: {MAX_ATTEMPTS}")
    print(f"Target: 100% acceptance rate\n")

    # Track overall statistics
    total_images = 0
    final_accepted = 0
    final_rejected = 0

    # Start with initial images
    current_dir = Path(SESSION_DIR) / "status-images" / "final-1080x1920"

    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"\n{'='*70}")
        print(f"🔄 ATTEMPT {attempt}/{MAX_ATTEMPTS}")
        print(f"{'='*70}")

        # Run validation
        print(f"\n1️⃣ VALIDATION PHASE")

        # Use the actual validator script
        cmd = f"""
cd /Users/shriyavallabh/Desktop/mvp && \
export GEMINI_API_KEY='{os.getenv("GEMINI_API_KEY")}' && \
python3 scripts/visual-quality-validator.py
"""

        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(result.stdout)

        # Check if validation report exists
        reports = sorted(Path(SESSION_DIR).glob("status-images/validation-report-*.json"))
        if not reports:
            print("❌ No validation report generated")
            break

        # Read latest report
        import json
        with open(reports[-1]) as f:
            validation_data = json.load(f)

        total_images = validation_data['total_images']
        accepted = validation_data['accepted']
        rejected = validation_data['rejected']
        regenerate_needed = validation_data['regenerate_needed']

        print(f"\n📊 Validation Results:")
        print(f"   Total: {total_images}")
        print(f"   ✅ Accepted: {accepted}")
        print(f"   ❌ Rejected: {rejected}")
        print(f"   🔄 Need Regen: {regenerate_needed}")

        # Check if all passed
        if rejected == 0 and regenerate_needed == 0:
            print(f"\n🎉 SUCCESS! All {accepted} images passed validation!")
            final_accepted = accepted
            break

        # If not last attempt, regenerate
        if attempt < MAX_ATTEMPTS:
            print(f"\n2️⃣ REGENERATION PHASE")

            cmd_regen = f"""
cd /Users/shriyavallabh/Desktop/mvp && \
export GEMINI_API_KEY='{os.getenv("GEMINI_API_KEY")}' && \
python3 scripts/auto-regenerate-failed-images.py
"""

            result_regen = subprocess.run(cmd_regen, shell=True, capture_output=True, text=True)
            print(result_regen.stdout)

            # Move regenerated images to final directory for next validation
            regen_dir = Path(SESSION_DIR) / "status-images" / "regenerated"
            final_dir = Path(SESSION_DIR) / "status-images" / "final-1080x1920"

            if regen_dir.exists():
                import shutil
                for img in regen_dir.glob("REGEN_*.png"):
                    # Replace original
                    original_name = img.name.replace('REGEN_', 'FINAL_')
                    shutil.move(str(img), str(final_dir / original_name))
                    print(f"   📤 Replaced: {original_name}")

        else:
            print(f"\n⚠️  Maximum attempts ({MAX_ATTEMPTS}) reached")
            final_accepted = accepted
            final_rejected = rejected + regenerate_needed

    print(f"\n{'='*70}")
    print(f"\n📊 FINAL PIPELINE RESULTS:")
    print(f"   Total Images: {total_images}")
    print(f"   ✅ Final Accepted: {final_accepted}")
    print(f"   ❌ Final Rejected: {final_rejected}")
    print(f"   Success Rate: {(final_accepted/total_images*100):.1f}%")

    validated_dir = Path(SESSION_DIR) / "status-images" / "validated"
    print(f"\n📁 Production-Ready Images: {validated_dir}")
    print(f"   Count: {len(list(validated_dir.glob('FINAL_*.png')))}")

    if final_rejected == 0:
        print(f"\n🎉 PIPELINE COMPLETE - All images passed!")
    else:
        print(f"\n⚠️  {final_rejected} images still need manual review/regeneration")

    print()

if __name__ == "__main__":
    main()
