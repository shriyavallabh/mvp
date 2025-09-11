#!/bin/bash

# Complete automated setup for Meta webhook
VM_IP="134.209.154.123"
DOMAIN="hubix.duckdns.org"

echo "Setting up HTTPS webhook on $DOMAIN..."

# Execute everything on VM remotely
ssh root@$VM_IP << 'SETUP'

# 1. Clean up everything
pm2 stop all
pm2 delete all
sudo systemctl stop nginx

# 2. Ensure webhook exists
cd /home/mvp/webhook
cat > webhook-meta.js << 'EOF'
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('✅ Meta webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Meta webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
    console.log('📨 Event from Meta');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Webhook running on port 3000');
});
EOF

# 3. Start webhook on port 3000
pm2 start webhook-meta.js --name webhook
pm2 save

# 4. Get SSL certificate if not exists
if [ ! -d "/etc/letsencrypt/live/hubix.duckdns.org" ]; then
    sudo apt update
    sudo apt install -y certbot
    sudo certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email admin@hubix.duckdns.org
fi

# 5. Configure Nginx properly
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/webhook << 'NGINX'
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

# 6. Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 7. Open firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 443
sudo ufw allow 80
sudo ufw --force enable

# 8. Test the webhook
sleep 2
curl -s "https://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS" -k

SETUP

echo ""
echo "Setup complete!"