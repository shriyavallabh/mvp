#!/bin/bash

echo "Setting up webhook on your VM..."
echo ""
echo "You need to provide your SSH password or have SSH keys set up."
echo ""

# SSH command with proper formatting
ssh root@134.209.154.123 << 'ENDSCRIPT'

echo "Starting webhook setup..."

# Navigate to webhook directory
cd /home/mvp/webhook

# Stop and delete existing PM2 processes
pm2 stop all
pm2 delete all

# Create simple webhook
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (token === 'jarvish_webhook_2024') {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
});

app.listen(3000, () => {
    console.log('Webhook running on port 3000');
});
EOF

# Start webhook
pm2 start webhook.js --name webhook
pm2 save

# Install certbot and nginx
sudo apt update
sudo apt install -y nginx certbot

# Stop nginx to get certificate
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
    -d hubix.duckdns.org \
    --non-interactive \
    --agree-tos \
    --email admin@hubix.duckdns.org

# Configure nginx
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

# Restart nginx
sudo systemctl restart nginx

echo ""
echo "✅ Setup complete!"
echo ""
echo "Your webhook URL: https://hubix.duckdns.org/webhook"
echo "Verify token: jarvish_webhook_2024"

ENDSCRIPT