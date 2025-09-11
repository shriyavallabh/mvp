#!/bin/bash

# This script will run automatically when droplet starts
cat > /root/setup-webhook.sh << 'WEBHOOK_SCRIPT'
#!/bin/bash

# Ensure directory exists
mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

# Create webhook file
cat > webhook.js << 'EOF'
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
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
    console.log('📨 Event received from Meta');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log(`Message from ${message.from}: ${message.text?.body || message.type}`);
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'webhook' });
});

app.get('/', (req, res) => {
    res.send('Webhook running on hubix.duckdns.org');
});

app.listen(3000, '0.0.0.0', () => {
    console.log('✅ Webhook running on port 3000');
});
EOF

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install dependencies
npm install express axios

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Stop any existing PM2 processes
pm2 stop all
pm2 delete all

# Start webhook with PM2
pm2 start webhook.js --name finadvise-webhook
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

# Install and configure Nginx with SSL
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Stop nginx to get certificate
systemctl stop nginx

# Get SSL certificate
certbot certonly --standalone \
    -d hubix.duckdns.org \
    --non-interactive \
    --agree-tos \
    --email admin@hubix.duckdns.org \
    --keep-until-expiring

# Configure Nginx
cat > /etc/nginx/sites-available/default << 'NGINX'
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

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Configure firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Create success indicator
echo "Webhook setup completed at $(date)" > /root/webhook-setup-complete.txt

# Test the webhook
sleep 3
curl -k "https://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS" || echo "Local test failed"

WEBHOOK_SCRIPT

# Execute the setup script
chmod +x /root/setup-webhook.sh
/root/setup-webhook.sh > /root/setup.log 2>&1

# Make it run on every boot
cat > /etc/systemd/system/webhook-setup.service << 'SERVICE'
[Unit]
Description=Webhook Setup Service
After=network.target

[Service]
Type=oneshot
ExecStart=/root/setup-webhook.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SERVICE

systemctl enable webhook-setup.service
systemctl start webhook-setup.service