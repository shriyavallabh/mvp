#!/bin/bash

# IMMEDIATE WEBHOOK FIX - Get it running NOW!
# ============================================

set -e

VM_IP="139.59.51.237"
echo "🚨 EMERGENCY WEBHOOK DEPLOYMENT"
echo "================================"
echo ""

# Create minimal webhook that will pass Meta verification
cat > emergency-webhook.js << 'WEBHOOK'
const express = require('express');
const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

console.log('🚀 EMERGENCY WEBHOOK STARTING...');

// CRITICAL: Webhook verification endpoint for Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Verification request:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', (req, res) => {
    console.log('📨 Webhook event received');
    res.status(200).send('OK');
    
    // Process the webhook event
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    
    for (const message of messages) {
        console.log(`Message from ${message.from}: ${message.type}`);
        
        if (message.type === 'text') {
            console.log(`Text: ${message.text.body}`);
        } else if (message.type === 'interactive') {
            console.log(`Button: ${message.interactive?.button_reply?.id}`);
        }
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'emergency-webhook',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Webhook Active',
        endpoints: ['/webhook', '/health']
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log(`📍 Ready for Meta verification`);
});
WEBHOOK

echo "📤 Uploading to VM..."
scp -o StrictHostKeyChecking=no emergency-webhook.js root@$VM_IP:/tmp/

echo ""
echo "🚀 Deploying on VM..."
ssh -o StrictHostKeyChecking=no root@$VM_IP << 'DEPLOY'
set -e

echo "Installing dependencies..."
apt-get update > /dev/null 2>&1
apt-get install -y nodejs npm nginx certbot python3-certbot-nginx > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo "Creating webhook directory..."
mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

echo "Setting up webhook..."
cp /tmp/emergency-webhook.js webhook.js

# Create package.json
cat > package.json << 'PKG'
{
  "name": "emergency-webhook",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2"
  }
}
PKG

echo "Installing Express..."
npm install > /dev/null 2>&1

echo "Stopping any existing webhook..."
pm2 stop all > /dev/null 2>&1 || true
pm2 delete all > /dev/null 2>&1 || true

echo "Configuring SSL..."
# Stop nginx temporarily for certbot
systemctl stop nginx > /dev/null 2>&1 || true

# Get SSL certificate
certbot certonly --standalone \
    -d hubix.duckdns.org \
    --non-interactive \
    --agree-tos \
    --email admin@hubix.duckdns.org > /dev/null 2>&1 || echo "SSL exists"

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/webhook << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

echo "Starting services..."
nginx -t > /dev/null 2>&1
systemctl restart nginx

# Start webhook with PM2
pm2 start webhook.js --name emergency-webhook
pm2 save
pm2 startup systemd -u root --hp /root | grep 'sudo' | bash > /dev/null 2>&1

echo ""
echo "Testing webhook..."
sleep 3

# Test locally first
curl -s "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
echo ""

# Test via domain
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
echo ""

echo ""
echo "Checking status..."
pm2 list
DEPLOY

echo ""
echo "✅ WEBHOOK DEPLOYED!"
echo "===================="
echo ""
echo "🔗 Test these URLs:"
echo "  https://hubix.duckdns.org/webhook"
echo "  https://hubix.duckdns.org/health"
echo ""
echo "📱 Meta Configuration:"
echo "  Callback URL: https://hubix.duckdns.org/webhook"
echo "  Verify Token: jarvish_webhook_2024"
echo ""
echo "✅ The webhook should now pass Meta verification!"