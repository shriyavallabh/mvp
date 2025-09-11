#!/bin/bash

echo "🚨 EMERGENCY FIX - RUN THIS ON YOUR VM NOW!"
echo "==========================================="
echo ""
echo "SSH into your VM: ssh root@134.209.154.123"
echo ""
echo "Then copy and paste this ENTIRE block:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'EMERGENCY'
# 1. Kill Nginx (it's blocking everything)
sudo systemctl stop nginx
sudo systemctl disable nginx

# 2. Create webhook that listens on both 80 and 443
cd /home/mvp/webhook
cat > emergency-webhook.js << 'EOF'
const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(express.json());

// CRITICAL: Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Meta verification:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('✅ VERIFIED! Sending challenge:', challenge);
        return res.status(200).send(challenge);
    }
    
    console.log('❌ Verification failed');
    res.sendStatus(403);
});

// Webhook events
app.post('/webhook', (req, res) => {
    console.log('📨 Event from Meta');
    res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
    res.send('OK');
});

// Root
app.get('/', (req, res) => {
    res.send('Webhook running on hubix.duckdns.org');
});

// Start on port 80 (HTTP)
app.listen(80, '0.0.0.0', () => {
    console.log('✅ HTTP webhook on port 80');
    console.log('URL: http://hubix.duckdns.org/webhook');
});

// Also start on 443 if SSL exists
const certPath = '/etc/letsencrypt/live/hubix.duckdns.org';
if (fs.existsSync(certPath + '/fullchain.pem')) {
    const options = {
        key: fs.readFileSync(certPath + '/privkey.pem'),
        cert: fs.readFileSync(certPath + '/fullchain.pem')
    };
    https.createServer(options, app).listen(443, '0.0.0.0', () => {
        console.log('✅ HTTPS webhook on port 443');
        console.log('URL: https://hubix.duckdns.org/webhook');
    });
}
EOF

# 3. Stop all PM2 processes
pm2 stop all
pm2 delete all

# 4. Start webhook with sudo (for ports 80/443)
sudo pm2 start emergency-webhook.js --name webhook

# 5. Make sure firewall allows traffic
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload

# 6. TEST IT!
echo ""
echo "Testing HTTP..."
curl "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=TEST123"
echo ""
echo "Should return: TEST123"

# 7. Show logs
pm2 logs webhook --lines 20
EMERGENCY

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After running above, test from your computer:"
echo "curl 'http://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=TEST'"
echo ""
echo "If it returns 'TEST', then use in Meta:"
echo ""
echo "📍 Callback URL: http://hubix.duckdns.org/webhook"
echo "🔑 Verify Token: jarvish_webhook_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"