#!/bin/bash

echo "🚀 SETTING UP NGROK ON YOUR DIGITAL OCEAN VM"
echo "============================================"
echo ""
echo "This will give you an HTTPS URL that Meta will accept!"
echo ""

echo "Step 1: SSH into your VM"
echo "------------------------"
echo "ssh root@YOUR_VM_IP"
echo ""

echo "Step 2: Install ngrok"
echo "--------------------"
cat << 'EOF'
# Add ngrok's GPG key
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null

# Add ngrok repository
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list

# Update and install
sudo apt update && sudo apt install ngrok

# Verify installation
ngrok version
EOF

echo ""
echo "Step 3: Create ngrok configuration"
echo "----------------------------------"
cat << 'EOF'
# Create config file
cat > ~/ngrok.yml << 'CONFIG'
version: "2"
authtoken: YOUR_NGROK_TOKEN
tunnels:
  webhook:
    proto: http
    addr: 3000
    bind_tls: true
CONFIG
EOF

echo ""
echo "Step 4: Start ngrok in background with PM2"
echo "------------------------------------------"
cat << 'EOF'
# Create ngrok starter script
cat > ~/start-ngrok.sh << 'SCRIPT'
#!/bin/bash
ngrok http 3000 --log stdout
SCRIPT

chmod +x ~/start-ngrok.sh

# Start with PM2
pm2 start ~/start-ngrok.sh --name ngrok-tunnel

# Get the URL
sleep 3
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
EOF

echo ""
echo "Step 5: Alternative - Run ngrok in screen"
echo "-----------------------------------------"
cat << 'EOF'
# Install screen if not already installed
apt-get install screen -y

# Start new screen session
screen -S ngrok

# In the screen session, run:
ngrok http 3000

# Press Ctrl+A then D to detach

# To reattach later:
screen -r ngrok
EOF

echo ""
echo "Step 6: Get your HTTPS webhook URL"
echo "-----------------------------------"
echo "After starting ngrok, you'll see:"
echo ""
echo "Forwarding:"
echo "https://abc123xyz.ngrok-free.app -> http://localhost:3000"
echo ""
echo "Your Meta webhook configuration will be:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Callback URL: https://abc123xyz.ngrok-free.app/webhook"
echo "Verify Token: jarvish_webhook_2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  FREE NGROK LIMITATIONS:"
echo "- URL changes when you restart ngrok"
echo "- Limited to 40 connections/minute"
echo "- Shows ngrok branding page (users must click 'Visit Site')"
echo ""
echo "For production, consider:"
echo "1. Paid ngrok account for static subdomain"
echo "2. Getting a domain and SSL certificate"
echo "3. Using Cloudflare Tunnel (more reliable than quick tunnel)"