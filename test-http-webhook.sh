#!/bin/bash

echo "🧪 TESTING IF META ACCEPTS HTTP (NO SSL)"
echo "========================================="
echo ""

echo "Let's try HTTP on different ports:"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Port 80 (Standard HTTP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "On your VM, run:"
echo ""
cat << 'TEST1'
# Create minimal webhook on port 80
cd /home/mvp/webhook
pm2 stop all

cat > webhook-minimal.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

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

app.post('/webhook', (req, res) => {
    console.log('📨 Webhook event received');
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('Webhook is running');
});

app.listen(80, '0.0.0.0', () => {
    console.log('Webhook running on port 80');
    console.log('URL: http://YOUR_IP/webhook');
});
EOF

# Run on port 80
sudo pm2 start webhook-minimal.js --name webhook

# Ensure port 80 is open
sudo ufw allow 80
sudo ufw reload

# Test locally
curl http://localhost/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123
TEST1

echo ""
echo "Try in Meta: http://YOUR_VM_IP/webhook"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Port 8080 (Alternative HTTP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If port 80 doesn't work, try 8080:"
echo ""
cat << 'TEST2'
# Change port to 8080 in webhook-minimal.js
sed -i 's/listen(80/listen(8080/' webhook-minimal.js

# Restart
pm2 restart webhook

# Open port 8080
sudo ufw allow 8080

# Test
curl http://localhost:8080/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123
TEST2

echo ""
echo "Try in Meta: http://YOUR_VM_IP:8080/webhook"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 META'S REQUIREMENTS (2024):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Meta MAY accept HTTP if:"
echo "1. ✅ URL is publicly accessible"
echo "2. ✅ Responds correctly to verification"
echo "3. ⚠️  Some regions require HTTPS"
echo "4. ⚠️  Business verification may require HTTPS"
echo ""
echo "If HTTP fails, you MUST use:"
echo "- HTTPS with valid certificate (not self-signed)"
echo "- This requires a domain name"