#!/bin/bash

# Install webhook on restored VM
echo "Setting up webhook on restored VM..."

# The webhook setup script
cat > /tmp/webhook-setup.sh << 'SCRIPT'
#!/bin/bash

# Navigate to webhook directory
cd /home/mvp/webhook || mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

# Create webhook
cat > webhook.js << 'EOF'
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    verifyToken: 'jarvish_webhook_2024'
};

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log(`Message from ${message.from}: ${message.text?.body || message.type}`);
            
            // Handle button clicks
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                console.log(`Button clicked: ${buttonId}`);
                // Add your button handling logic here
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', vm: 'restored' });
});

app.get('/', (req, res) => {
    res.send('Webhook running on restored VM');
});

app.listen(3000, '0.0.0.0', () => {
    console.log('✅ Webhook running on port 3000');
});
EOF

# Install dependencies if needed
npm install express axios 2>/dev/null || (apt update && apt install -y nodejs npm && npm install express axios)

# Stop any existing PM2 processes for webhook
pm2 stop webhook 2>/dev/null
pm2 delete webhook 2>/dev/null

# Start webhook
pm2 start webhook.js --name webhook
pm2 save

# Install nginx and certbot if not present
apt update
apt install -y nginx certbot python3-certbot-nginx

# Stop nginx temporarily
systemctl stop nginx

# Get SSL certificate
certbot certonly --standalone \
    -d hubix.duckdns.org \
    --non-interactive \
    --agree-tos \
    --email admin@hubix.duckdns.org \
    --keep-until-expiring

# Configure nginx
cat > /etc/nginx/sites-available/webhook << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://$server_name$request_uri;
}
NGINX

# Enable webhook site
ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null

# Start nginx
systemctl start nginx
systemctl enable nginx

# Open firewall
ufw allow 443 2>/dev/null
ufw allow 80 2>/dev/null
ufw allow 22 2>/dev/null

echo "✅ Webhook setup complete!"
echo "URL: https://hubix.duckdns.org/webhook"
echo "Token: jarvish_webhook_2024"

# Test the webhook
sleep 2
curl -k "https://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=TEST" && echo " - Test successful!"
SCRIPT

chmod +x /tmp/webhook-setup.sh
/tmp/webhook-setup.sh