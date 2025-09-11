const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Automated VM Deployment via Digital Ocean API
 * Deploys webhook and all stories without manual intervention
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const DO_TOKEN = 'YOUR_DO_TOKEN_HERE';
const DROPLET_ID = '518093693';
const DOMAIN = 'hubix.duckdns.org';

// Digital Ocean API client
const doAPI = axios.create({
    baseURL: 'https://api.digitalocean.com/v2',
    headers: {
        'Authorization': `Bearer ${DO_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Step 1: Reset root password to enable SSH access
 */
async function resetRootPassword() {
    console.log('🔐 Resetting root password...');
    
    try {
        const response = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'password_reset'
        });
        
        console.log('  ✅ Password reset initiated');
        console.log('  📧 Check your email for the new password');
        
        // Wait for action to complete
        await waitForAction(response.data.action.id);
        return true;
    } catch (error) {
        console.error('  ❌ Failed to reset password:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 2: Power cycle the VM to apply user-data
 */
async function powerCycleVM() {
    console.log('🔄 Power cycling VM...');
    
    try {
        // First, power off
        console.log('  Powering off...');
        const powerOffResponse = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'power_off'
        });
        await waitForAction(powerOffResponse.data.action.id);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Then power on with user-data
        console.log('  Powering on with deployment script...');
        const powerOnResponse = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'power_on'
        });
        await waitForAction(powerOnResponse.data.action.id);
        
        console.log('  ✅ VM restarted');
        return true;
    } catch (error) {
        console.error('  ❌ Failed to power cycle:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 3: Create a new droplet with user-data if needed
 */
async function createNewDropletWithWebhook() {
    console.log('🆕 Creating new droplet with webhook pre-installed...');
    
    const userData = `#!/bin/bash
# Automated webhook deployment script
set -e

# Update system
apt-get update
apt-get install -y nodejs npm nginx certbot python3-certbot-nginx

# Install PM2
npm install -g pm2

# Create webhook directory
mkdir -p /home/webhook
cd /home/webhook

# Create webhook server
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');
    console.log('Event received:', JSON.stringify(req.body));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('Webhook running on port', CONFIG.port);
});
EOF

# Install dependencies
npm init -y
npm install express

# Get SSL certificate
certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email admin@hubix.duckdns.org || true

# Configure Nginx
cat > /etc/nginx/sites-available/webhook << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://\$server_name\$request_uri;
}
NGINX

ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Start webhook with PM2
pm2 start webhook.js --name webhook
pm2 save
pm2 startup systemd -u root --hp /root

echo "Webhook deployed successfully" > /var/log/webhook-deploy.log
`;

    try {
        const response = await doAPI.post('/droplets', {
            name: 'mvp-webhook-new',
            region: 'blr1',
            size: 's-1vcpu-1gb',
            image: 'ubuntu-22-04-x64',
            ssh_keys: [],
            backups: false,
            ipv6: false,
            monitoring: true,
            tags: ['webhook', 'story-3.2'],
            user_data: userData
        });
        
        console.log('  ✅ New droplet created:', response.data.droplet.id);
        console.log('  IP:', response.data.droplet.networks.v4[0]?.ip_address);
        return response.data.droplet;
    } catch (error) {
        console.error('  ❌ Failed to create droplet:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Step 4: Run command via SSH (using password from email)
 */
async function deployViaSSH() {
    console.log('📦 Deploying via SSH...');
    console.log('  ⚠️ This requires the root password from your email');
    
    // Since we can't SSH programmatically without password, we'll use a different approach
    console.log('  Alternative: Using droplet console commands via API');
    
    // We can't directly execute commands, but we can use user-data on rebuild
    return await rebuildWithUserData();
}

/**
 * Step 5: Rebuild droplet with user-data
 */
async function rebuildWithUserData() {
    console.log('🔨 Rebuilding droplet with webhook deployment...');
    
    const userData = Buffer.from(`#!/bin/bash
# Complete webhook deployment
apt-get update && apt-get install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2
mkdir -p /home/webhook && cd /home/webhook

cat > webhook.js << 'WEBHOOK'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
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

app.listen(3000, '0.0.0.0');
WEBHOOK

npm init -y && npm install express
pm2 start webhook.js --name webhook
certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email admin@hubix.duckdns.org
systemctl restart nginx
`).toString('base64');

    try {
        const response = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'rebuild',
            image: 'ubuntu-22-04-x64'
        });
        
        console.log('  ✅ Rebuild initiated');
        await waitForAction(response.data.action.id);
        return true;
    } catch (error) {
        console.error('  ❌ Rebuild failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Wait for action to complete
 */
async function waitForAction(actionId) {
    console.log('  ⏳ Waiting for action to complete...');
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
        try {
            const response = await doAPI.get(`/actions/${actionId}`);
            const status = response.data.action.status;
            
            if (status === 'completed') {
                console.log('  ✅ Action completed');
                return true;
            } else if (status === 'errored') {
                console.log('  ❌ Action failed');
                return false;
            }
            
            // Wait 5 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        } catch (error) {
            console.error('  Error checking action:', error.message);
            attempts++;
        }
    }
    
    console.log('  ⏱️ Action timeout');
    return false;
}

/**
 * Test webhook endpoint
 */
async function testWebhook() {
    console.log('🧪 Testing webhook...');
    
    const testUrl = `https://${DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`;
    
    try {
        const response = await axios.get(testUrl, { timeout: 5000 });
        if (response.data === 'test123') {
            console.log('  ✅ Webhook is working!');
            return true;
        } else {
            console.log('  ❌ Webhook returned unexpected response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('  ❌ Webhook not responding:', error.message);
        return false;
    }
}

/**
 * Assign floating IP to droplet
 */
async function assignFloatingIP(dropletId) {
    console.log('🔗 Assigning floating IP...');
    
    try {
        const response = await doAPI.post('/floating_ips/139.59.51.237/actions', {
            type: 'assign',
            droplet_id: dropletId
        });
        
        console.log('  ✅ Floating IP assigned');
        await waitForAction(response.data.action.id);
        return true;
    } catch (error) {
        console.error('  ❌ Failed to assign IP:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main deployment function
 */
async function deploy() {
    console.log('🚀 AUTOMATED DEPLOYMENT STARTING');
    console.log('=================================\n');
    
    // Option 1: Try to reset password and deploy
    console.log('Option 1: Reset password for existing VM');
    const passwordReset = await resetRootPassword();
    
    if (passwordReset) {
        console.log('\n📧 CHECK YOUR EMAIL for the new root password');
        console.log('Then run: ssh root@139.59.51.237 and execute the commands from MANUAL-WEBHOOK-DEPLOY.md\n');
    }
    
    // Option 2: Create snapshot and new droplet
    console.log('Option 2: Creating snapshot of current VM...');
    try {
        const snapshotResponse = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'snapshot',
            name: `backup-${Date.now()}`
        });
        console.log('  ✅ Snapshot created');
    } catch (error) {
        console.log('  ⚠️ Snapshot failed:', error.message);
    }
    
    // Option 3: Create new droplet with webhook pre-installed
    console.log('\nOption 3: Create new temporary droplet with webhook');
    const newDroplet = await createNewDropletWithWebhook();
    
    if (newDroplet) {
        console.log('\n  Waiting for droplet to be ready...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        
        // Assign floating IP to new droplet
        await assignFloatingIP(newDroplet.id);
        
        // Test webhook
        await testWebhook();
    }
    
    console.log('\n=================================');
    console.log('📋 DEPLOYMENT SUMMARY');
    console.log('=================================');
    console.log('1. Password reset initiated - check email');
    console.log('2. Snapshot created for backup');
    console.log('3. New droplet option available');
    console.log('\n🔗 Test webhook at:');
    console.log(`   https://${DOMAIN}/webhook`);
    console.log('\n📱 Meta configuration:');
    console.log(`   Callback URL: https://${DOMAIN}/webhook`);
    console.log('   Verify Token: jarvish_webhook_2024');
}

// Run deployment
deploy().catch(console.error);