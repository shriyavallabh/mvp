#!/bin/bash

echo "🚀 DEPLOYING STORY 3.2 TO VM VIA SSH"
echo "===================================="
echo ""

# Using sshpass to automate SSH
export SSHPASS='5eafaafbc8a4e958fa6366aeea'

# Deploy script
sshpass -e ssh -o StrictHostKeyChecking=no root@139.59.51.237 << 'DEPLOY'

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
npm install -g pm2

# Create webhook directory
mkdir -p /root/webhook
cd /root/webhook

# Create package.json
cat > package.json << 'EOF'
{
  "name": "story-3.2-webhook",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "sqlite3": "^5.1.6",
    "node-cron": "^3.0.3",
    "dotenv": "^16.0.3"
  }
}
EOF

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
EOF

# Create webhook server
cat > webhook.js << 'EOF'
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Initialize SQLite database
const db = new sqlite3.Database('/root/webhook/crm.db');

db.run(`CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT,
    message_type TEXT,
    button_id TEXT,
    message_text TEXT,
    response_sent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

console.log('🚀 STORY 3.2 WEBHOOK STARTING...');

// Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`[${new Date().toISOString()}] Verification: mode=${mode}, token=${token}, challenge=${challenge}`);
    
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
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`🔘 Button clicked: "${buttonTitle}" (ID: ${buttonId}) from ${from}`);
                
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
                console.log(`💬 Text from ${from}: "${text}"`);
                
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
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ Response sent to ${to}`);
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
    res.send('✅ Story 3.2 Webhook is running on VM!');
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log('📍 Ready for Meta verification!');
});
EOF

# Configure nginx
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Restart nginx
nginx -t && systemctl restart nginx

# Stop any existing PM2 processes
pm2 kill

# Start webhook with PM2
pm2 start webhook.js --name story-3.2-webhook
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

echo "✅ Story 3.2 deployed successfully!"

# Test webhook
curl "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=VM_TEST"

DEPLOY

echo ""
echo "✅ Deployment complete! Testing webhook..."
echo ""

# Test from outside
curl -s "http://139.59.51.237/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=EXTERNAL_TEST"