#!/bin/bash

echo "🚀 DEPLOYING HTTPS WEBHOOK ON YOUR DIGITAL OCEAN VM"
echo "==================================================="
echo ""

# Get VM IP
echo "First, let's get your VM IP address..."
echo "Run this command:"
echo ""
echo "ssh root@YOUR_VM_IP 'curl -s ifconfig.me'"
echo ""
echo "Example: ssh root@134.209.154.123 'curl -s ifconfig.me'"
echo ""
read -p "Enter your VM IP address: " VM_IP

if [ -z "$VM_IP" ]; then
    echo "❌ No IP provided. Exiting."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AUTOMATED DEPLOYMENT STARTING..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Copy files to VM
echo "📦 Step 1: Copying files to VM..."
scp webhook-https-direct.js root@$VM_IP:/home/mvp/webhook/
scp setup-https-certificates.sh root@$VM_IP:/home/mvp/webhook/

# Step 2: Execute setup on VM
echo ""
echo "🔧 Step 2: Setting up HTTPS on VM..."
ssh root@$VM_IP << 'ENDSSH'
cd /home/mvp/webhook

# Install dependencies if needed
npm install express axios

# Stop any existing webhooks
pm2 stop all
pm2 delete all

# Create SSL certificates
chmod +x setup-https-certificates.sh
./setup-https-certificates.sh

# Open port 443 (HTTPS)
ufw allow 443
ufw reload

# Start HTTPS webhook with sudo for port 443
sudo pm2 start webhook-https-direct.js --name webhook-https

# Save PM2 configuration
sudo pm2 save
sudo pm2 startup

# Show status
pm2 status
echo ""
echo "✅ HTTPS webhook deployed!"
ENDSSH

# Step 3: Test the webhook
echo ""
echo "🧪 Step 3: Testing HTTPS webhook..."
echo ""

# Test with curl (ignoring self-signed cert warning)
echo "Testing health endpoint..."
curl -k https://$VM_IP/health 2>/dev/null

echo ""
echo "Testing webhook verification..."
VERIFY_RESPONSE=$(curl -k -s "https://$VM_IP/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123")

if [ "$VERIFY_RESPONSE" = "test123" ]; then
    echo "✅ Webhook verification working!"
else
    echo "⚠️  Webhook verification response: $VERIFY_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 YOUR HTTPS WEBHOOK IS READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 WEBHOOK URL FOR META:"
echo "   https://$VM_IP/webhook"
echo ""
echo "🔑 VERIFY TOKEN:"
echo "   jarvish_webhook_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. Meta might show SSL warning (self-signed cert)"
echo "2. If Meta still rejects, we need a domain + Let's Encrypt"
echo "3. Monitor logs: ssh root@$VM_IP 'pm2 logs webhook-https'"
echo ""
echo "📋 TO USE IN META:"
echo "1. Go to WhatsApp Settings → Configuration → Webhooks"
echo "2. Enter Callback URL: https://$VM_IP/webhook"
echo "3. Enter Verify Token: jarvish_webhook_2024"
echo "4. Click 'Verify and Save'"
echo "5. Subscribe to: messages, message_template_status_update"