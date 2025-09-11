#!/usr/bin/env node

/**
 * EMERGENCY WEBHOOK FIX - Get Meta verification working NOW
 */

const axios = require('axios');

const DO_TOKEN = 'YOUR_DO_TOKEN_HERE';
const DOMAIN = 'hubix.duckdns.org';
const DROPLET_ID = '518113785';

const doAPI = axios.create({
    baseURL: 'https://api.digitalocean.com/v2',
    headers: {
        'Authorization': `Bearer ${DO_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

console.log('🚨 EMERGENCY WEBHOOK FIX');
console.log('========================\n');

async function createMinimalDroplet() {
    console.log('⚡ Creating minimal droplet for immediate webhook...');
    
    const userData = `#!/bin/bash
set -e

# Ultra-fast webhook deployment
apt-get update
apt-get install -y nodejs npm nginx

# Create minimal webhook
mkdir -p /webhook && cd /webhook

cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Verification:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('VERIFIED!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    console.log('Event received');
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(80, '0.0.0.0', () => {
    console.log('Webhook on port 80');
});
EOF

# Install express
npm init -y
npm install express

# Start webhook on port 80 (no SSL needed for testing)
nohup node webhook.js > webhook.log 2>&1 &

echo "Webhook started on port 80"
`;

    try {
        const response = await doAPI.post('/droplets', {
            name: 'emergency-webhook',
            region: 'blr1', 
            size: 's-1vcpu-1gb',
            image: 'ubuntu-22-04-x64',
            ssh_keys: [],
            backups: false,
            user_data: userData
        });
        
        console.log(`✅ Emergency droplet created: ${response.data.droplet.id}`);
        return response.data.droplet;
    } catch (error) {
        console.error('❌ Failed to create emergency droplet:', error.response?.data);
        return null;
    }
}

async function fixExistingDroplet() {
    console.log('🔧 Attempting to fix existing droplet...');
    
    // Power cycle the existing droplet to force user-data re-execution
    try {
        console.log('  Rebooting droplet...');
        const response = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'reboot'
        });
        console.log('✅ Reboot initiated');
        return true;
    } catch (error) {
        console.error('❌ Reboot failed:', error.response?.data);
        return false;
    }
}

async function testWebhookHTTP() {
    console.log('🧪 Testing HTTP webhook (port 80)...');
    
    try {
        const response = await axios.get('http://hubix.duckdns.org/webhook', {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'jarvish_webhook_2024',
                'hub.challenge': 'test123'
            },
            timeout: 5000
        });
        
        if (response.data === 'test123') {
            console.log('✅ HTTP webhook working!');
            return true;
        }
    } catch (error) {
        console.log('❌ HTTP webhook not ready:', error.message);
    }
    
    return false;
}

async function main() {
    // Try to fix existing droplet first
    await fixExistingDroplet();
    
    // Wait a bit
    console.log('⏳ Waiting 2 minutes for reboot...');
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    // Test if HTTPS webhook is working
    try {
        const httpsTest = await axios.get('https://hubix.duckdns.org/webhook', {
            params: {
                'hub.mode': 'subscribe', 
                'hub.verify_token': 'jarvish_webhook_2024',
                'hub.challenge': 'https_test'
            },
            timeout: 10000
        });
        
        if (httpsTest.data === 'https_test') {
            console.log('🎉 HTTPS WEBHOOK IS WORKING!');
            console.log('📱 Meta verification should work now');
            return;
        }
    } catch (error) {
        console.log('⚠️ HTTPS webhook still not ready');
    }
    
    // If HTTPS doesn't work, test HTTP
    const httpWorking = await testWebhookHTTP();
    
    if (!httpWorking) {
        // Create emergency droplet as last resort
        console.log('\n🆘 Creating emergency backup droplet...');
        await createMinimalDroplet();
        
        console.log('⏳ Waiting for emergency droplet...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        await testWebhookHTTP();
    }
    
    console.log('\n=================================');
    console.log('📋 EMERGENCY STATUS');
    console.log('=================================');
    console.log('If webhook still not working:');
    console.log('1. Check: curl http://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test');
    console.log('2. Try HTTP instead of HTTPS temporarily');
    console.log('3. Check droplet console logs');
}

main().catch(console.error);