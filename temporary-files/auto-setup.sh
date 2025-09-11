#!/bin/bash

# Auto setup webhook on VM
ssh root@134.209.154.123 << 'AUTOSETUP'

echo "🚀 Setting up webhook automatically..."

# Clean up
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
sudo systemctl stop nginx 2>/dev/null

# Create webhook
cd /home/mvp/webhook
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

# Start webhook
pm2 start webhook.js --name webhook
pm2 save

# Get SSL if needed
if [ ! -f /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem ]; then
    echo "Getting SSL certificate..."
    sudo apt update
    sudo apt install -y certbot
    sudo certbot certonly --standalone -d hubix.duckdns.org \
        --non-interactive --agree-tos --email admin@hubix.duckdns.org
fi

# Configure Nginx
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
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

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Open firewall
sudo ufw allow 443 2>/dev/null
sudo ufw allow 80 2>/dev/null

# Test
echo ""
echo "Testing webhook..."
sleep 3
TEST=$(curl -k -s "https://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS")
if [ "$TEST" = "SUCCESS" ]; then
    echo "✅ WEBHOOK IS WORKING!"
    echo ""
    echo "════════════════════════════════════════════"
    echo "USE IN META:"
    echo "════════════════════════════════════════════"
    echo "URL: https://hubix.duckdns.org/webhook"
    echo "Token: jarvish_webhook_2024"
    echo "════════════════════════════════════════════"
else
    echo "Error: $TEST"
fi

AUTOSETUP