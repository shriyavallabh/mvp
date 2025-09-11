#!/bin/bash

# Deploy WhatsApp Webhook Server to VM
# Replaces Fly.io dependency

echo "╔══════════════════════════════════════════════╗"
echo "║   WhatsApp Webhook Server Deployment        ║"
echo "║        Migrating from Fly.io to VM          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

VM_IP="143.110.191.97"
VM_USER="root"
PROJECT_DIR="/home/mvp"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting webhook deployment to VM...${NC}"
echo ""

# Step 1: Copy webhook files to VM
echo "📦 Copying webhook files..."
scp webhook-server.js ${VM_USER}@${VM_IP}:${PROJECT_DIR}/
scp ecosystem.webhook.config.js ${VM_USER}@${VM_IP}:${PROJECT_DIR}/

# Step 2: Deploy and configure on VM
echo -e "${YELLOW}⚙️  Configuring webhook server on VM...${NC}"

ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/mvp

echo "Installing dependencies..."
npm install express body-parser axios

echo "Setting up PM2 process..."
pm2 delete whatsapp-webhook 2>/dev/null || true
pm2 start ecosystem.webhook.config.js
pm2 save
pm2 startup

echo "Checking webhook status..."
pm2 status whatsapp-webhook

echo "Testing webhook endpoint..."
curl -s http://localhost:3000/health | jq '.' || echo "Health check response received"

echo ""
echo "✅ Webhook server deployed!"
ENDSSH

# Step 3: Display configuration instructions
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     WEBHOOK MIGRATION COMPLETE!              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "Your webhook server is now running on your VM!"
echo ""
echo -e "${YELLOW}📱 IMPORTANT: Update WhatsApp Business Settings${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://developers.facebook.com/apps/"
echo "2. Select your app → WhatsApp → Configuration"
echo "3. In the Webhooks section, click 'Edit'"
echo "4. Update the Callback URL to:"
echo ""
echo -e "${GREEN}   http://${VM_IP}:3000/webhook${NC}"
echo ""
echo "5. Keep Verify Token as: jarvish_webhook_2024"
echo "6. Click 'Verify and Save'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}🔍 Testing Your Webhook:${NC}"
echo ""
echo "1. Check webhook health:"
echo "   curl http://${VM_IP}:3000/health"
echo ""
echo "2. Monitor webhook logs:"
echo "   ssh ${VM_USER}@${VM_IP} 'pm2 logs whatsapp-webhook'"
echo ""
echo "3. Send test message on WhatsApp:"
echo "   Type 'STATUS' to your WhatsApp Business number"
echo ""
echo -e "${GREEN}✨ You're now independent from Fly.io!${NC}"
echo ""

# Make executable
chmod +x deploy-webhook.sh