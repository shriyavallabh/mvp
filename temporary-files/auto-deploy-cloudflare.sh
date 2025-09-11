#!/bin/bash

echo "🔥 AUTOMATIC CLOUDFLARE TUNNEL DEPLOYMENT"
echo "========================================="
echo ""

read -p "Enter your VM IP address: " VM_IP

if [ -z "$VM_IP" ]; then
    echo "❌ No IP provided"
    exit 1
fi

echo ""
echo "📡 Deploying to $VM_IP..."
echo ""

# Deploy everything remotely
ssh root@$VM_IP << 'ENDSSH'
# Install Cloudflare daemon
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Ensure webhook is running
cd /home/mvp/webhook
pm2 stop all
pm2 start webhook-for-vm.js --name webhook

# Kill any existing tunnels
pkill cloudflared

# Start new tunnel and capture URL
cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel to start
sleep 5

# Extract the URL
TUNNEL_URL=$(grep "https://" /tmp/tunnel.log | grep trycloudflare.com | tail -1 | awk '{print $NF}')

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Failed to get tunnel URL"
    cat /tmp/tunnel.log
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ CLOUDFLARE TUNNEL CREATED SUCCESSFULLY!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 YOUR WEBHOOK URL FOR META:"
    echo "   ${TUNNEL_URL}/webhook"
    echo ""
    echo "🔑 VERIFY TOKEN:"
    echo "   jarvish_webhook_2024"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Make it persistent with PM2
    cat > /home/start-tunnel.sh << 'SCRIPT'
#!/bin/bash
exec cloudflared tunnel --url http://localhost:3000
SCRIPT
    
    chmod +x /home/start-tunnel.sh
    pm2 start /home/start-tunnel.sh --name cloudflare-tunnel
    pm2 save
fi
ENDSSH

echo ""
echo "📋 NEXT STEPS:"
echo "1. Copy the webhook URL above"
echo "2. Go to Meta Business Manager"
echo "3. WhatsApp Settings → Configuration → Webhooks"
echo "4. Paste the URL and verify token"
echo "5. Click 'Verify and Save'"
echo ""
echo "Monitor logs: ssh root@$VM_IP 'pm2 logs'"