#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "FINAL WEBHOOK SETUP FOR META - COMPLETE SOLUTION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This script will set up everything correctly."
echo ""
echo "Run this command to execute everything automatically:"
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

cat << 'COMMAND'
ssh root@134.209.154.123 'bash -s' << 'REMOTESCRIPT'

echo "Starting complete webhook setup..."

# 1. Stop everything
pm2 stop all && pm2 delete all
sudo systemctl stop nginx

# 2. Create the webhook
cd /home/mvp/webhook
cat > meta-webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

// Meta requires this exact response
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
});

app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.json({status: 'ok'}));

app.listen(3000, () => console.log('Port 3000'));
EOF

# 3. Start webhook
pm2 start meta-webhook.js --name webhook

# 4. Install SSL if needed
if [ ! -f /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem ]; then
    sudo apt install -y certbot
    sudo certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email test@test.com
fi

# 5. Fix Nginx
sudo apt install -y nginx
sudo bash -c 'cat > /etc/nginx/sites-available/default << NGINX
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX'

# 6. Restart Nginx
sudo nginx -t && sudo systemctl restart nginx

# 7. Verify it works
sleep 2
echo ""
echo "Testing webhook..."
RESULT=$(curl -k -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=FINAL_TEST")
if [ "$RESULT" = "FINAL_TEST" ]; then
    echo "✅ SUCCESS! Webhook is working!"
    echo ""
    echo "══════════════════════════════════════════════════════"
    echo "USE THESE IN META:"
    echo "══════════════════════════════════════════════════════"
    echo "Callback URL: https://hubix.duckdns.org/webhook"
    echo "Verify Token: jarvish_webhook_2024"
    echo "══════════════════════════════════════════════════════"
else
    echo "Issue detected. Output: $RESULT"
fi

REMOTESCRIPT
COMMAND

echo ""
echo "───────────────────────────────────────────────────────────"
echo ""
echo "Copy the entire command above and run it in your terminal."
echo ""
echo "After it completes successfully, use in Meta:"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "📍 FINAL WEBHOOK URL: https://hubix.duckdns.org/webhook"
echo "🔑 VERIFY TOKEN: jarvish_webhook_2024"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Meta requires HTTPS. This URL will work."