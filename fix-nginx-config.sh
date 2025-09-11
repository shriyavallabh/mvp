#!/bin/bash

echo "🔧 FIXING WEBHOOK NGINX CONFIGURATION"
echo "======================================"
echo ""
echo "The correct curl command is:"
echo ""
echo 'curl "http://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test"'
echo ""
echo "Note: Make sure the entire URL is in quotes!"
echo ""
echo "---"
echo ""
echo "To fix the webhook on the VM, SSH and run:"
echo ""
cat << 'FIX'
# SSH to VM (check email for password)
ssh root@139.59.51.237

# Once connected, run these commands:

# 1. Create simple webhook
cd /root
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Webhook verification:', mode, token, challenge);
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.get('/', (req, res) => {
    res.send('Webhook is running');
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Webhook running on port 3000');
});
EOF

# 2. Install and run
npm init -y && npm install express
node webhook.js &

# 3. Fix nginx to proxy to port 3000
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

# 4. Restart nginx
nginx -t && systemctl restart nginx

# 5. Test
curl "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS"
FIX