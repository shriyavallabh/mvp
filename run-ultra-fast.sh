#!/bin/bash

# Ultra-Fast Image Generator Launch Script

echo "🚀 Ultra-Fast Image Generator Launcher"
echo "======================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if packages are installed
if ! python -c "import aiohttp" 2>/dev/null; then
    echo "📥 Installing required packages..."
    pip install aiohttp pillow
fi

# Run the server
echo ""
echo "🎨 Starting Ultra-Fast Image Generation Server..."
echo ""
python ultra-fast-standalone.py "$@"