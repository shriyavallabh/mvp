#!/bin/bash
# Restoration script for sweep_1759927972
# Generated: 2025-10-08T03:12:52Z
#
# This script restores all swept files back to the main codebase
# Usage: bash restore.sh

set -e  # Exit on error

ARCHIVE_DIR="/Users/shriyavallabh/Desktop/mvp/archive/swept/sweep_1759927972"
TARGET_DIR="/Users/shriyavallabh/Desktop/mvp"

echo "🔄 Restoring files from sweep_1759927972..."
echo ""

# Check if archive directory exists
if [ ! -d "$ARCHIVE_DIR" ]; then
    echo "❌ Error: Archive directory not found: $ARCHIVE_DIR"
    exit 1
fi

# Count files to restore
FILE_COUNT=$(find "$ARCHIVE_DIR" -type f ! -name "SWEEP-REPORT.md" ! -name "restore.sh" | wc -l | tr -d ' ')
echo "📁 Found $FILE_COUNT files to restore"
echo ""

# Restore all files (excluding report and this script)
RESTORED=0
for file in "$ARCHIVE_DIR"/*; do
    filename=$(basename "$file")

    # Skip the report and restore script itself
    if [ "$filename" = "SWEEP-REPORT.md" ] || [ "$filename" = "restore.sh" ]; then
        continue
    fi

    # Check if file already exists in target
    if [ -e "$TARGET_DIR/$filename" ]; then
        echo "⚠️  Warning: $filename already exists in target directory"
        read -p "   Overwrite? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "   Skipped $filename"
            continue
        fi
    fi

    # Copy file back
    cp "$file" "$TARGET_DIR/$filename"
    RESTORED=$((RESTORED + 1))
    echo "✅ Restored: $filename"
done

echo ""
echo "✨ Restoration complete!"
echo "   Restored: $RESTORED files"
echo "   Skipped: $((FILE_COUNT - RESTORED)) files"
echo ""
echo "📋 Note: Archive directory still exists at:"
echo "   $ARCHIVE_DIR"
echo ""
echo "   To remove archive: rm -rf \"$ARCHIVE_DIR\""
