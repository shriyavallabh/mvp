#!/bin/bash

echo "🚀 SETTING UP PERMANENT CLOUDFLARE TUNNEL ON VM"
echo "=============================================="
echo ""
echo "This gives you a permanent HTTPS URL that Meta will accept!"
echo ""

cat << 'SETUP'
# SSH into your VM and run these commands:

# 1. Install Cloudflare Tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Make sure webhook is running on port 3000
cd /home/mvp/webhook
pm2 stop all
pm2 start webhook-for-vm.js --name webhook

# 3. Create permanent tunnel configuration
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
url: http://localhost:3000
EOF

# 4. Start tunnel with permanent URL
cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &

# 5. Get your tunnel URL
sleep 3
grep "https://" tunnel.log | grep trycloudflare.com | tail -1

# 6. Make it persistent with PM2
cat > ~/start-tunnel.sh << 'SCRIPT'
#!/bin/bash
cloudflared tunnel --url http://localhost:3000
SCRIPT

chmod +x ~/start-tunnel.sh
pm2 start ~/start-tunnel.sh --name cloudflare-tunnel

# 7. Save PM2 configuration
pm2 save
pm2 startup

# View the tunnel URL anytime:
pm2 logs cloudflare-tunnel --lines 50 | grep "https://"
SETUP

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Your webhook URL will be something like:"
echo "https://RANDOM-WORDS.trycloudflare.com/webhook"
echo ""
echo "Verify Token: jarvish_webhook_2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"