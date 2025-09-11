#!/bin/bash

echo "🔴 RUN THESE COMMANDS ON YOUR VM NOW"
echo "===================================="
echo ""
echo "Step 1: SSH into your VM"
echo "------------------------"
echo "ssh root@134.209.154.123"
echo ""
echo "Step 2: Copy and paste ALL these commands:"
echo "------------------------------------------"
cat << 'COMMANDS'

# Install Cloudflare Tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb

# Start your webhook
cd /home/mvp/webhook && pm2 stop all && pm2 start webhook-for-vm.js --name webhook

# Start Cloudflare tunnel
cloudflared tunnel --url http://localhost:3000

COMMANDS

echo ""
echo "Step 3: Look for this output:"
echo "-----------------------------"
echo "You'll see something like:"
echo ""
echo "+------------------------------------------------------------------------------------+"
echo "| Your quick Tunnel has been created! Visit it at:                                 |"
echo "| https://demos-bring-lynn-predicted.trycloudflare.com                            |"
echo "+------------------------------------------------------------------------------------+"
echo ""
echo "Step 4: Use in Meta:"
echo "-------------------"
echo "Callback URL: https://YOUR-TUNNEL-URL.trycloudflare.com/webhook"
echo "Verify Token: jarvish_webhook_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT: Keep the terminal open or run in background with:"
echo "nohup cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"