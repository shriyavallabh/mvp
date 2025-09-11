#!/bin/bash

# Deploy webhook to new VM
echo "🚀 Deploying webhook to new VM"
echo "=============================="
echo ""

NEW_VM_IP="139.59.46.240"
PASSWORD="6f5bb5e75ddf1461711393813d"

# Create deployment script
cat > /tmp/deploy-webhook-new.sh << 'DEPLOY'
#!/bin/bash
set -e

echo "📦 Installing dependencies..."
apt-get update > /dev/null 2>&1
apt-get install -y nodejs npm nginx certbot python3-certbot-nginx > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo "🔨 Creating webhook..."
mkdir -p /home/webhook
cd /home/webhook

cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

// Meta webhook verification - CRITICAL
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Webhook verification: mode=${mode}, token=${token}, challenge=${challenge}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified!');
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
    
    try {
        const entry = req.body.entry?.[0];
        const messages = entry?.changes?.[0]?.value?.messages || [];
        
        for (const message of messages) {
            console.log(`Message from ${message.from}: ${message.type}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Webhook is running! Use /webhook for Meta verification.');
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log('Ready for Meta verification!');
});
EOF

echo "📦 Installing packages..."
npm init -y > /dev/null 2>&1
npm install express > /dev/null 2>&1

echo "🚀 Starting webhook..."
pm2 stop all > /dev/null 2>&1 || true
pm2 delete all > /dev/null 2>&1 || true
pm2 start webhook.js --name webhook
pm2 save
pm2 startup systemd -u root --hp /root | grep sudo | bash > /dev/null 2>&1 || true

echo ""
echo "✅ WEBHOOK DEPLOYED!"
echo "===================="
pm2 status
echo ""
echo "Testing webhook..."
curl -s "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
echo ""
DEPLOY

echo "📤 Copying script to new VM..."
echo ""

# Try with sshpass first
if command -v sshpass &> /dev/null; then
    echo "Using sshpass for automated deployment..."
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no /tmp/deploy-webhook-new.sh root@$NEW_VM_IP:/tmp/
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$NEW_VM_IP "bash /tmp/deploy-webhook-new.sh"
else
    echo "sshpass not found. Trying manual method..."
    echo ""
    echo "When prompted for password, enter: $PASSWORD"
    echo ""
    scp -o StrictHostKeyChecking=no /tmp/deploy-webhook-new.sh root@$NEW_VM_IP:/tmp/
    ssh -o StrictHostKeyChecking=no root@$NEW_VM_IP "bash /tmp/deploy-webhook-new.sh"
fi

echo ""
echo "🔄 Updating DuckDNS domain..."
# Update DuckDNS to point to new IP
curl -s "https://www.duckdns.org/update?domains=hubix&token=3cf32727-dc65-424f-a71d-abbc35ad3c5a&ip=$NEW_VM_IP" > /dev/null

echo ""
echo "🔒 Setting up SSL certificate..."
ssh -o StrictHostKeyChecking=no root@$NEW_VM_IP << 'SSL_SETUP'
# Stop any services on port 80
systemctl stop nginx > /dev/null 2>&1 || true

# Get SSL certificate
certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org > /dev/null 2>&1 || echo "Retrying SSL..."

# Configure Nginx
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
nginx -t && systemctl restart nginx
SSL_SETUP

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🔗 Webhook is now live at:"
echo "   https://hubix.duckdns.org/webhook"
echo ""
echo "📱 Meta Configuration:"
echo "   Callback URL: https://hubix.duckdns.org/webhook"
echo "   Verify Token: jarvish_webhook_2024"
echo ""
echo "🧪 Testing webhook..."
sleep 3
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS"
echo ""
echo ""
echo "If you see 'SUCCESS' above, the webhook is working!"