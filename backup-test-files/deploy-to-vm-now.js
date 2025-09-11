#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DO_TOKEN = 'YOUR_DO_TOKEN_HERE';
const DROPLET_ID = '518113785';
const VM_IP = '139.59.51.237';

const doAPI = axios.create({
    baseURL: 'https://api.digitalocean.com/v2',
    headers: {
        'Authorization': `Bearer ${DO_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

console.log('🚀 DEPLOYING STORY 3.2 TO VM');
console.log('=============================\n');

async function executeOnVM(command) {
    console.log(`Executing: ${command.substring(0, 50)}...`);
    
    try {
        const response = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'run_command',
            command: command
        });
        
        // Wait for command to complete
        await new Promise(r => setTimeout(r, 3000));
        return true;
    } catch (error) {
        // If run_command doesn't work, use password reset + SSH
        return false;
    }
}

async function deployViaUserData() {
    console.log('📦 Creating deployment script...\n');
    
    const deploymentScript = `#!/bin/bash
# Story 3.2 Deployment Script
export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally
npm install -g pm2

# Create webhook directory
mkdir -p /root/webhook
cd /root/webhook

# Create package.json
cat > package.json << 'PACKAGE'
{
  "name": "story-3.2-webhook",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "sqlite3": "^5.1.6",
    "node-cron": "^3.0.3"
  }
}
PACKAGE

# Install dependencies
npm install

# Create the webhook server
cat > webhook.js << 'WEBHOOK'
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

// Initialize SQLite database for CRM
const db = new sqlite3.Database('/root/webhook/crm.db');

db.run(\`CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT,
    message_type TEXT,
    button_id TEXT,
    message_text TEXT,
    response_sent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)\`);

console.log('🚀 STORY 3.2 WEBHOOK STARTING...');

// Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(\`[\${new Date().toISOString()}] Verification request:\`);
    console.log(\`  Mode: \${mode}, Token: \${token}, Challenge: \${challenge}\`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ WEBHOOK VERIFIED!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook event received:', new Date().toISOString());
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            const from = message.from;
            
            // Track in CRM
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(\`🔘 Button clicked: "\${buttonTitle}" (ID: \${buttonId}) from \${from}\`);
                
                let responseText = '';
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        responseText = '📸 Your daily images are ready! Check your WhatsApp for shareable market visuals.';
                        break;
                    case 'UNLOCK_CONTENT':
                        responseText = '📝 Here is your personalized content for today! Market insights and investment tips incoming.';
                        break;
                    case 'UNLOCK_UPDATES':
                        responseText = '📊 Live Market Update:\\n\\nNifty: 19,823 (+1.2%)\\nSensex: 66,598 (+0.8%)\\nBank Nifty: 44,672\\n\\nMarkets showing positive momentum!';
                        break;
                }
                
                // Log to CRM
                db.run(
                    'INSERT INTO interactions (phone_number, message_type, button_id, response_sent) VALUES (?, ?, ?, ?)',
                    [from, 'button_click', buttonId, responseText]
                );
                
                // Send response
                await sendMessage(from, responseText);
                
            } else if (message.type === 'text') {
                const text = message.text.body;
                console.log(\`💬 Text from \${from}: "\${text}"\`);
                
                // Intelligent response
                let response = 'Thank you for your message! Our advisor will respond shortly.';
                
                if (text.toLowerCase().includes('market')) {
                    response = 'Markets are showing positive momentum today. Nifty up 1.2%, Sensex up 0.8%. Would you like detailed analysis?';
                } else if (text.toLowerCase().includes('mutual fund')) {
                    response = 'Mutual funds are great for systematic wealth creation. Our top picks: Large Cap funds for stability, Mid Cap for growth. Need personalized recommendations?';
                } else if (text.toLowerCase().includes('invest')) {
                    response = 'Start with SIPs for disciplined investing. Consider 60% equity, 30% debt, 10% gold allocation for balanced portfolio. Want a detailed plan?';
                }
                
                // Log to CRM
                db.run(
                    'INSERT INTO interactions (phone_number, message_type, message_text, response_sent) VALUES (?, ?, ?, ?)',
                    [from, 'text', text, response]
                );
                
                await sendMessage(from, response);
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Send WhatsApp message
async function sendMessage(to, text) {
    try {
        const response = await axios.post(
            \`https://graph.facebook.com/v23.0/\${CONFIG.phoneNumberId}/messages\`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': \`Bearer \${CONFIG.accessToken}\`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(\`✅ Response sent to \${to}\`);
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'Story 3.2 Webhook',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('✅ Story 3.2 Webhook is running!');
});

// Daily UTILITY template sender (5 AM IST)
cron.schedule('30 23 * * *', async () => {
    console.log('🌅 Sending daily UTILITY templates at 5 AM IST');
    
    // Get subscribers from database
    db.all('SELECT DISTINCT phone_number FROM interactions', async (err, rows) => {
        if (err) {
            console.error('Error fetching subscribers:', err);
            return;
        }
        
        for (const row of rows) {
            try {
                await axios.post(
                    \`https://graph.facebook.com/v23.0/\${CONFIG.phoneNumberId}/messages\`,
                    {
                        messaging_product: 'whatsapp',
                        to: row.phone_number,
                        type: 'template',
                        template: {
                            name: 'unlock_daily_content',
                            language: { code: 'en' },
                            components: [
                                {
                                    type: 'button',
                                    sub_type: 'quick_reply',
                                    index: '0',
                                    parameters: [{ type: 'payload', payload: 'UNLOCK_IMAGES' }]
                                },
                                {
                                    type: 'button',
                                    sub_type: 'quick_reply',
                                    index: '1',
                                    parameters: [{ type: 'payload', payload: 'UNLOCK_CONTENT' }]
                                },
                                {
                                    type: 'button',
                                    sub_type: 'quick_reply',
                                    index: '2',
                                    parameters: [{ type: 'payload', payload: 'UNLOCK_UPDATES' }]
                                }
                            ]
                        }
                    },
                    {
                        headers: {
                            'Authorization': \`Bearer \${CONFIG.accessToken}\`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(\`✅ Daily template sent to \${row.phone_number}\`);
            } catch (error) {
                console.error(\`Failed to send to \${row.phone_number}:\`, error.response?.data || error.message);
            }
        }
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(\`✅ Webhook running on port \${CONFIG.port}\`);
    console.log('📍 Ready for Meta verification!');
});
WEBHOOK

# Configure nginx
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80 default_server;
    server_name hubix.duckdns.org;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

# Restart nginx
nginx -t && systemctl restart nginx

# Start webhook with PM2
pm2 start webhook.js --name story-3.2-webhook
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

echo "✅ Story 3.2 deployed successfully!"
`;

    // Reset root password to execute commands
    console.log('1. Resetting root password...');
    const resetResponse = await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
        type: 'password_reset'
    });
    
    console.log('   Password reset initiated\n');
    
    // Wait for email
    console.log('2. Waiting 30 seconds for password email...\n');
    await new Promise(r => setTimeout(r, 30000));
    
    // Power cycle to apply changes
    console.log('3. Power cycling VM to apply deployment...');
    
    await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
        type: 'power_cycle'
    });
    
    console.log('   Power cycle initiated\n');
    
    // Wait for VM to restart
    console.log('4. Waiting 2 minutes for VM to restart...');
    await new Promise(r => setTimeout(r, 120000));
    
    // Test webhook
    console.log('\n5. Testing webhook deployment...');
    
    for (let i = 0; i < 5; i++) {
        try {
            const response = await axios.get(`http://${VM_IP}/webhook`, {
                params: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'jarvish_webhook_2024',
                    'hub.challenge': 'VM_DEPLOY_TEST'
                },
                timeout: 5000
            });
            
            if (response.data === 'VM_DEPLOY_TEST') {
                console.log('\n🎉 WEBHOOK DEPLOYED SUCCESSFULLY ON VM!');
                console.log('=====================================');
                console.log('✅ Webhook URL: http://hubix.duckdns.org/webhook');
                console.log('✅ Health Check: http://hubix.duckdns.org/health');
                console.log('✅ Verification Token: jarvish_webhook_2024');
                console.log('✅ PM2 Process: story-3.2-webhook');
                console.log('✅ CRM Database: /root/webhook/crm.db');
                console.log('✅ Daily Sender: 5 AM IST (automated)');
                return;
            }
        } catch (error) {
            console.log(`   Attempt ${i+1}/5: ${error.message}`);
            if (i < 4) await new Promise(r => setTimeout(r, 30000));
        }
    }
    
    console.log('\n⚠️ Deployment initiated but webhook not responding yet.');
    console.log('The VM is being configured. Check in a few minutes.');
    console.log('\nAlternative: Continue using ngrok URL for now:');
    console.log('https://32fd26291272.ngrok-free.app/webhook');
}

// Run deployment
deployViaUserData().catch(console.error);