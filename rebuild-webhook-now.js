#!/usr/bin/env node

/**
 * REBUILD DROPLET WITH GUARANTEED WORKING WEBHOOK
 */

const axios = require('axios');

const DO_TOKEN = 'YOUR_DO_TOKEN_HERE';
const DROPLET_ID = '518113785';

const doAPI = axios.create({
    baseURL: 'https://api.digitalocean.com/v2',
    headers: {
        'Authorization': `Bearer ${DO_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

console.log('🔨 REBUILDING DROPLET WITH WORKING WEBHOOK');
console.log('==========================================\n');

async function rebuildDroplet() {
    const userData = `#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log) 2>&1

echo "=== WEBHOOK DEPLOYMENT STARTED ==="

# Update and install
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm nginx

echo "=== CREATING WEBHOOK ==="

# Create webhook
mkdir -p /webhook
cd /webhook

cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

console.log('Starting webhook server...');

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];  
    const challenge = req.query['hub.challenge'];
    
    console.log('WEBHOOK VERIFICATION ATTEMPT:');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('SUCCESS: Sending challenge back');
        res.status(200).send(challenge);
    } else {
        console.log('FAILED: Invalid verification');
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    console.log('WEBHOOK EVENT RECEIVED');
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Meta Webhook Verification Server'
    });
});

app.get('/', (req, res) => {
    res.send('Webhook server is running. Use /webhook for Meta verification.');
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('WEBHOOK SERVER STARTED ON PORT', PORT);
});
EOF

echo "=== INSTALLING DEPENDENCIES ==="
npm init -y
npm install express

echo "=== STARTING WEBHOOK ==="
node webhook.js > /var/log/webhook.log 2>&1 &
WEBHOOK_PID=$!
echo $WEBHOOK_PID > /var/run/webhook.pid

echo "=== CONFIGURING NGINX ==="

# Simple nginx config for port 80
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

nginx -t
systemctl restart nginx

echo "=== TESTING WEBHOOK ==="
sleep 5
curl -s "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=LOCALTEST"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Webhook should be accessible at http://[IP]/webhook"
echo "Logs: tail -f /var/log/webhook.log"
`;

    try {
        console.log('🔄 Rebuilding droplet with guaranteed webhook...');
        
        const response = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'rebuild',
            image: 'ubuntu-22-04-x64',
            user_data: userData
        });
        
        console.log('✅ Rebuild initiated');
        console.log('Action ID:', response.data.action.id);
        
        // Wait for rebuild to complete
        await waitForAction(response.data.action.id);
        
        console.log('\n⏳ Waiting for webhook to start (2 minutes)...');
        await new Promise(resolve => setTimeout(resolve, 120000));
        
        // Test the webhook
        await testWebhook();
        
    } catch (error) {
        console.error('❌ Rebuild failed:', error.response?.data || error.message);
    }
}

async function waitForAction(actionId) {
    console.log('⏳ Waiting for rebuild to complete...');
    
    for (let i = 0; i < 30; i++) {
        try {
            const response = await doAPI.get(`/actions/${actionId}`);
            const status = response.data.action.status;
            
            if (status === 'completed') {
                console.log('✅ Rebuild completed');
                return;
            } else if (status === 'errored') {
                throw new Error('Rebuild failed');
            }
            
            console.log(`  Status: ${status}`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.error('Error checking action:', error.message);
        }
    }
}

async function testWebhook() {
    console.log('\n🧪 Testing webhook...');
    
    const testUrl = 'http://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=REBUILD_TEST';
    
    for (let i = 0; i < 5; i++) {
        try {
            console.log(`  Attempt ${i + 1}/5...`);
            const response = await axios.get(testUrl, { timeout: 10000 });
            
            if (response.data === 'REBUILD_TEST') {
                console.log('🎉 WEBHOOK IS WORKING!');
                console.log('📱 Meta verification should work now');
                console.log('\n📋 Use these settings in Meta:');
                console.log('   URL: http://hubix.duckdns.org/webhook');
                console.log('   Token: jarvish_webhook_2024');
                return;
            }
        } catch (error) {
            console.log(`  ❌ Attempt ${i + 1} failed:`, error.message);
        }
        
        if (i < 4) {
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('⚠️ Webhook still not responding');
}

rebuildDroplet();