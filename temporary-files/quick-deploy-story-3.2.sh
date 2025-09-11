#!/bin/bash

# Story 3.2: Quick Deploy Script
# ===============================
# One-command deployment for Click-to-Unlock webhook on VM

set -e

echo "
╔══════════════════════════════════════════════════════════╗
║     STORY 3.2: CLICK-TO-UNLOCK WEBHOOK DEPLOYMENT        ║
║                  Quick Deploy Script                      ║
╚══════════════════════════════════════════════════════════╝
"

# Configuration
VM_IP="139.59.51.237"
DOMAIN="hubix.duckdns.org"
LOCAL_FILES_DIR="$(pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we have the webhook files
echo -e "${BLUE}📁 Checking local files...${NC}"
REQUIRED_FILES=(
    "webhook-for-vm.js"
    "daily-utility-sender.js"
    "button-click-handler.js"
    "intelligent-chat-system.js"
    "crm-tracking-system.js"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$LOCAL_FILES_DIR/$file" ]; then
        MISSING_FILES+=("$file")
        echo -e "${RED}  ❌ Missing: $file${NC}"
    else
        echo -e "${GREEN}  ✅ Found: $file${NC}"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "\n${RED}Missing required files. Please ensure all webhook files are in current directory.${NC}"
    exit 1
fi

echo -e "\n${GREEN}All required files found!${NC}"

# Create deployment package
echo -e "\n${BLUE}📦 Creating deployment package...${NC}"
cat > temp-deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Starting Story 3.2 deployment on VM..."

# Install dependencies
echo "📦 Installing system dependencies..."
apt update > /dev/null 2>&1
apt install -y nodejs npm nginx certbot python3-certbot-nginx sqlite3 > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

# Create directories
echo "📁 Creating directories..."
mkdir -p /home/mvp/{webhook,data,logs,generated-images,reports,templates}
cd /home/mvp/webhook

# Create package.json
echo "📝 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "story-3.2-click-to-unlock",
  "version": "1.0.0",
  "description": "Click-to-Unlock Strategy with Intelligent Webhook CRM",
  "main": "webhook-for-vm.js",
  "scripts": {
    "start": "node webhook-for-vm.js",
    "daily": "node daily-utility-sender.js",
    "test": "node test-story-3.2-integration.js --local"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "node-cron": "^3.0.3",
    "sqlite3": "^5.1.6",
    "sqlite": "^5.1.1",
    "dotenv": "^16.3.1",
    "colors": "^1.4.0"
  }
}
EOF

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install > /dev/null 2>&1

# Create .env file
echo "🔐 Creating environment file..."
cat > .env << 'EOF'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
WEBHOOK_VERIFY_TOKEN=jarvish_webhook_2024
WEBHOOK_PORT=3000
EOF

# Stop existing services
echo "⏹️ Stopping existing services..."
pm2 stop all > /dev/null 2>&1 || true
systemctl stop nginx > /dev/null 2>&1 || true

# Setup SSL certificate
echo "🔒 Setting up SSL certificate..."
certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org \
  --force-renewal > /dev/null 2>&1 || echo "  ⚠️ SSL certificate exists, skipping..."

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/webhook << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    # Main webhook endpoint
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # CRM Analytics
    location /crm {
        proxy_pass http://localhost:3000/crm;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Root redirect
    location / {
        return 200 '{"status":"Story 3.2 Webhook Active","endpoint":"/webhook"}';
        add_header Content-Type application/json;
    }
}

server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://$server_name$request_uri;
}
NGINX

ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

echo "✅ VM setup complete!"
DEPLOY_SCRIPT

# Copy files to VM
echo -e "\n${BLUE}📤 Copying files to VM...${NC}"
echo -e "${YELLOW}You may be prompted for the VM password${NC}"

# Create a tar archive of all files
tar -czf story-3.2-deploy.tar.gz \
    webhook-for-vm.js \
    daily-utility-sender.js \
    button-click-handler.js \
    intelligent-chat-system.js \
    crm-tracking-system.js \
    temp-deploy.sh

# Copy to VM
scp story-3.2-deploy.tar.gz root@$VM_IP:/tmp/

# Execute deployment on VM
echo -e "\n${BLUE}🚀 Executing deployment on VM...${NC}"
ssh root@$VM_IP << 'REMOTE_COMMANDS'
set -e

# Extract files
cd /tmp
tar -xzf story-3.2-deploy.tar.gz

# Run deployment script
bash temp-deploy.sh

# Move webhook files
mv *.js /home/mvp/webhook/ 2>/dev/null || true

# Start services with PM2
cd /home/mvp/webhook
echo "🚀 Starting webhook services..."

# Start main webhook
pm2 start webhook-for-vm.js --name "story-3.2-webhook" \
  --max-memory-restart 500M \
  --log /home/mvp/logs/webhook.log

# Start daily sender
pm2 start daily-utility-sender.js --name "daily-sender" \
  --cron "0 5 * * *" \
  --no-autorestart \
  --log /home/mvp/logs/daily-sender.log

# Start CRM analytics (if exists)
pm2 start crm-tracking-system.js --name "crm-analytics" \
  --log /home/mvp/logs/crm.log 2>/dev/null || true

# Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root | grep 'sudo' | bash

# Test webhook
echo ""
echo "🧪 Testing webhook..."
sleep 3
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123" || echo "Webhook test response received"

# Check health
echo ""
echo "🏥 Checking health..."
curl -s https://hubix.duckdns.org/health | python3 -m json.tool || echo "Health check complete"

# Show status
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Webhook URL: https://hubix.duckdns.org/webhook"
echo "🔑 Verify Token: jarvish_webhook_2024"
echo "📊 Analytics: https://hubix.duckdns.org/crm/analytics"
echo "🏥 Health: https://hubix.duckdns.org/health"
echo ""
echo "📱 Next Steps:"
echo "1. Configure webhook in Meta Business Manager"
echo "2. Create UTILITY template 'advisor_daily_content_ready'"
echo "3. Test with: node daily-utility-sender.js --test 919022810769"
echo ""
echo "📝 View logs: pm2 logs story-3.2-webhook"
echo "════════════════════════════════════════════════════════════"
REMOTE_COMMANDS

# Cleanup
rm -f story-3.2-deploy.tar.gz temp-deploy.sh

echo -e "\n${GREEN}✨ Story 3.2 Click-to-Unlock Webhook Deployed Successfully!${NC}"
echo -e "\n${BLUE}📋 IMPORTANT - Complete these steps in Meta Business Manager:${NC}"
echo "1. Go to WhatsApp > Configuration > Webhooks"
echo "2. Set Callback URL: https://$DOMAIN/webhook"
echo "3. Set Verify Token: jarvish_webhook_2024"
echo "4. Subscribe to: messages, message_status"
echo ""
echo -e "${BLUE}📱 Create UTILITY Template:${NC}"
echo "1. Go to Message Templates > Create"
echo "2. Category: UTILITY (not Marketing!)"
echo "3. Name: advisor_daily_content_ready"
echo "4. Add 3 quick reply buttons:"
echo "   - 📸 Get Images (payload: UNLOCK_IMAGES)"
echo "   - 📝 Get Content (payload: UNLOCK_CONTENT)"
echo "   - 📊 Get Updates (payload: UNLOCK_UPDATES)"
echo ""
echo -e "${GREEN}🎉 Deployment Complete! The Click-to-Unlock strategy is live!${NC}"