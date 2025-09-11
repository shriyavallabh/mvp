#!/bin/bash

echo "🔍 DIAGNOSING META WEBHOOK VALIDATION ISSUE"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Getting your VM's public IP${NC}"
echo "Run this on your VM:"
echo "curl ifconfig.me"
echo ""
read -p "Enter your VM IP address: " VM_IP

if [ -z "$VM_IP" ]; then
    echo -e "${RED}❌ No IP provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Testing webhook accessibility${NC}"
echo "----------------------------------------"

# Test port 3000
echo "Testing port 3000..."
if timeout 5 curl -s "http://$VM_IP:3000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 3000 is accessible${NC}"
    RESPONSE=$(curl -s "http://$VM_IP:3000/health")
    echo "Health check response: $RESPONSE"
    PORT_TO_USE=3000
else
    echo -e "${RED}❌ Port 3000 is NOT accessible${NC}"
    
    # Test port 80
    echo ""
    echo "Testing port 80..."
    if timeout 5 curl -s "http://$VM_IP/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port 80 is accessible${NC}"
        RESPONSE=$(curl -s "http://$VM_IP/health")
        echo "Health check response: $RESPONSE"
        PORT_TO_USE=80
    else
        echo -e "${RED}❌ Port 80 is also NOT accessible${NC}"
        PORT_TO_USE=""
    fi
fi

echo ""
echo -e "${YELLOW}Step 3: Testing webhook verification endpoint${NC}"
echo "----------------------------------------------"

if [ -n "$PORT_TO_USE" ]; then
    if [ "$PORT_TO_USE" = "80" ]; then
        WEBHOOK_URL="http://$VM_IP/webhook"
    else
        WEBHOOK_URL="http://$VM_IP:$PORT_TO_USE/webhook"
    fi
    
    echo "Testing: $WEBHOOK_URL"
    
    VERIFY_URL="${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
    
    RESPONSE=$(curl -s "$VERIFY_URL")
    
    if [ "$RESPONSE" = "test123" ]; then
        echo -e "${GREEN}✅ Webhook verification is working!${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}YOUR WORKING WEBHOOK CONFIGURATION:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Callback URL: $WEBHOOK_URL"
        echo "Verify Token: jarvish_webhook_2024"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo -e "${RED}❌ Webhook verification failed${NC}"
        echo "Response: $RESPONSE"
    fi
else
    echo -e "${RED}❌ No accessible ports found${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Commands to fix on your VM${NC}"
echo "------------------------------------"
echo ""
echo "SSH into your VM:"
echo "ssh root@$VM_IP"
echo ""
echo "1. Check if webhook is running:"
echo "   pm2 status"
echo ""
echo "2. If not running, start it:"
echo "   cd /home/mvp/webhook"
echo "   pm2 start webhook.js --name finadvise-webhook"
echo ""
echo "3. Check firewall settings:"
echo "   ufw status"
echo ""
echo "4. Open port 3000 if needed:"
echo "   ufw allow 3000"
echo "   ufw reload"
echo ""
echo "5. For port 80 (no port in URL):"
echo "   sudo pm2 stop finadvise-webhook"
echo "   sudo pm2 start webhook-port-80.js --name finadvise-webhook"
echo ""

echo -e "${YELLOW}Step 5: Digital Ocean Firewall Check${NC}"
echo "--------------------------------------"
echo "1. Go to Digital Ocean dashboard"
echo "2. Click on your droplet"
echo "3. Go to Networking → Firewalls"
echo "4. Make sure these inbound rules exist:"
echo "   - HTTP (port 80)"
echo "   - Custom TCP (port 3000)"
echo "   - From: All IPv4, All IPv6"
echo ""

echo -e "${YELLOW}Step 6: If still not working - Use HTTPS${NC}"
echo "-----------------------------------------"
echo "Meta might require HTTPS. Here's the quick fix:"
echo ""
echo "Option A: Use ngrok (temporary but works immediately):"
echo "   # On your VM:"
echo "   ngrok http 3000"
echo "   # Use the HTTPS URL it provides"
echo ""
echo "Option B: Set up SSL with Let's Encrypt (permanent):"
echo "   # Need a domain first"
echo "   # Then run certbot to get SSL certificate"
echo ""

echo -e "${YELLOW}IMPORTANT:${NC} Meta's servers might be:"
echo "- Blocking HTTP (requiring HTTPS)"
echo "- Unable to reach your VM's IP directly"
echo "- Timing out due to network issues"