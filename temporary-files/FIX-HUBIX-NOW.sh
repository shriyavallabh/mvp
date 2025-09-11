#!/bin/bash

echo "🔧 FIXING HUBIX.DUCKDNS.ORG WEBHOOK"
echo "===================================="
echo ""
echo "Copy and run these commands on your VM:"
echo ""
echo "ssh root@134.209.154.123"
echo ""
echo "Then paste this entire block:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'FIXCOMMANDS'
# 1. Stop everything
pm2 stop all
pm2 delete all
sudo systemctl stop nginx
sudo apt remove --purge nginx -y

# 2. Create simple webhook that works
cd /home/mvp/webhook
cat > webhook-simple.js << 'EOF'
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();
app.use(express.json());

// Webhook verification
app.get('/webhook', (req, res) => {
    console.log('Verification request:', req.query);
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('✅ Webhook verified!');
        return res.status(200).send(challenge);
    }
    
    res.sendStatus(403);
});

// Webhook events
app.post('/webhook', (req, res) => {
    console.log('📨 Event received');
    res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'hubix' });
});

// Root
app.get('/', (req, res) => {
    res.send('Hubix webhook is running');
});

// Start HTTP server on port 80
http.createServer(app).listen(80, '0.0.0.0', () => {
    console.log('HTTP server on port 80');
});

// Start HTTPS server on port 443 if certificate exists
const certPath = '/etc/letsencrypt/live/hubix.duckdns.org';
if (fs.existsSync(certPath)) {
    const options = {
        key: fs.readFileSync(certPath + '/privkey.pem'),
        cert: fs.readFileSync(certPath + '/fullchain.pem')
    };
    https.createServer(options, app).listen(443, '0.0.0.0', () => {
        console.log('HTTPS server on port 443');
    });
} else {
    console.log('No SSL certificate found, running HTTP only');
}
EOF

# 3. Install dependencies
npm install express

# 4. Get SSL certificate
sudo apt update
sudo apt install -y certbot
sudo certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org \
  --pre-hook "pm2 stop all" \
  --post-hook "pm2 start webhook-simple.js --name webhook"

# 5. Start webhook with sudo (for ports 80/443)
sudo pm2 start webhook-simple.js --name webhook

# 6. Open firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload

# 7. Test locally
echo ""
echo "Testing..."
curl http://localhost/health
curl http://localhost/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123

# 8. Show status
pm2 status
pm2 logs webhook --lines 10
FIXCOMMANDS

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After running above commands, test from your computer:"
echo ""
echo "curl https://hubix.duckdns.org/health"
echo ""
echo "If it works, use in Meta:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Callback URL: https://hubix.duckdns.org/webhook"
echo "🔑 Verify Token: jarvish_webhook_2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"