#!/bin/bash

# This script will be executed via user data on droplet

# Setup webhook
cd /home/mvp/webhook 2>/dev/null || mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

# Create webhook file
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === 'jarvish_webhook_2024') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
});

app.get('/health', (req, res) => res.json({status: 'ok'}));
app.listen(3000, () => console.log('Webhook on 3000'));
EOF

# Install dependencies
npm install express 2>/dev/null || (apt update && apt install -y nodejs npm && npm install express)

# Setup PM2
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pm2 start webhook.js --name webhook
pm2 save

# Install and configure SSL
apt update
apt install -y certbot nginx

# Stop nginx for cert generation
systemctl stop nginx

# Get certificate for hubix.duckdns.org
certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email admin@hubix.duckdns.org

# Configure nginx
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
NGINX

systemctl start nginx
systemctl enable nginx

# Update DuckDNS to correct IP
DROPLET_IP=$(curl -s ifconfig.me)
curl "https://www.duckdns.org/update?domains=hubix&token=YOUR_DUCKDNS_TOKEN&ip=$DROPLET_IP"