#!/bin/bash
# Verify Outputs Script
# Referenced by: master.md
# Verifies that all expected output files are created

echo "🔍 Verifying FinAdvise output files..."

# Check data files
echo "📊 Checking data files..."
for file in "data/advisor-data.json" "data/market-intelligence.json" "data/compliance-validation.json"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check WhatsApp output
echo "📱 Checking WhatsApp output..."
if [ -d "output/whatsapp" ]; then
    count=$(ls output/whatsapp/*.txt 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "✅ WhatsApp messages: $count files"
    else
        echo "❌ No WhatsApp messages found"
        exit 1
    fi
else
    echo "❌ WhatsApp output directory missing"
    exit 1
fi

# Check LinkedIn output
echo "💼 Checking LinkedIn output..."
if [ -d "output/linkedin" ]; then
    count=$(ls output/linkedin/*.txt 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "✅ LinkedIn posts: $count files"
    else
        echo "❌ No LinkedIn posts found"
        exit 1
    fi
else
    echo "❌ LinkedIn output directory missing"
    exit 1
fi

# Check image output
echo "🎨 Checking image output..."
if [ -d "output/images" ]; then
    count=$(ls output/images/*.html 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "✅ Images: $count files"
    else
        echo "❌ No images found"
        exit 1
    fi
else
    echo "❌ Images output directory missing"
    exit 1
fi

echo "✅ All output verification passed!"
exit 0