#!/bin/bash

echo "🚀 Starting Cloudflare tunnel with CORRECT URL"
echo ""

# Install cloudflared if needed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    brew install cloudflared 2>/dev/null || npm install -g cloudflared
fi

# Start tunnel - this will generate a NEW URL each time
cloudflared tunnel --url http://localhost:3000