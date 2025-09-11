#!/bin/bash

echo "🔍 DEEP VM DIAGNOSTIC & FIX"
echo "============================"
echo ""

# Check VM IP
echo "1. Checking VM network status..."
VM_IP="139.59.51.237"
NEW_VM_IP="159.89.166.94"

# Try both IPs
echo "   Testing original IP: $VM_IP"
curl -s --max-time 5 "http://$VM_IP/" > /dev/null 2>&1 && echo "   ✅ Original IP responding" || echo "   ❌ Original IP not responding"

echo "   Testing new IP: $NEW_VM_IP"
curl -s --max-time 5 "http://$NEW_VM_IP/" > /dev/null 2>&1 && echo "   ✅ New IP responding" || echo "   ❌ New IP not responding"

# SSH into VM and fix
echo ""
echo "2. Connecting to VM to diagnose and fix..."
export SSHPASS='Story32Webhook2024!'

sshpass -e ssh -o StrictHostKeyChecking=no root@$NEW_VM_IP << 'VMFIX'

echo "=== VM DIAGNOSTIC ==="

# Check if webhook exists
if [ -d "/root/webhook" ]; then
    echo "✅ Webhook directory exists"
else
    echo "❌ Webhook directory missing - creating now"
    mkdir -p /root/webhook
fi

cd /root/webhook

# Check PM2 status
echo ""
echo "PM2 Status:"
pm2 list

# Kill existing processes
pm2 kill

# Update Node.js to v18
echo ""
echo "Updating Node.js to v18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Recreate package.json
cat > package.json << 'EOF'
{
  "name": "story-3.2-webhook",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.0.3",
    "form-data": "^4.0.0"
  }
}
EOF

# Install dependencies
npm install

# Create .env
cat > .env << 'EOF'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
EOF

# Create enhanced webhook with media support
cat > webhook.js << 'EOF'
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Store conversation context
const conversations = new Map();

console.log('🚀 Story 3.2 Enhanced Webhook Starting...');

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
        const messages = entry?.changes?.[0]?.value?.messages || [];
        const contacts = entry?.changes?.[0]?.value?.contacts || [];
        
        for (const message of messages) {
            const from = message.from;
            const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'User';
            
            console.log(`\nMessage from ${contactName} (${from}):`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`  🔘 Button clicked: "${buttonTitle}" (ID: ${buttonId})`);
                
                // Handle button clicks with media
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        await sendMessage(from, '📸 Your daily market images are being prepared...');
                        await sendMediaMessage(from, 'image', 'https://via.placeholder.com/800x600.png?text=Market+Analysis+Chart');
                        await sendMessage(from, 'Share these exclusive market visuals with your clients!');
                        break;
                        
                    case 'UNLOCK_CONTENT':
                        await sendMessage(from, '📝 Here is your personalized content for today!');
                        await sendMessage(from, 
                            '*Market Insights - ' + new Date().toLocaleDateString() + '*\\n\\n' +
                            '📈 *Top Picks:*\\n' +
                            '• Reliance Industries: Buy @ 2850\\n' +
                            '• HDFC Bank: Accumulate @ 1680\\n' +
                            '• Infosys: Hold @ 1520\\n\\n' +
                            '💡 *Investment Tip:* Focus on large-cap stocks for stability in current market conditions.'
                        );
                        break;
                        
                    case 'UNLOCK_UPDATES':
                        await sendMessage(from, 
                            '📊 *Live Market Update*\\n\\n' +
                            '🔴 *Nifty 50:* 19,823.45 (+236.15, +1.21%)\\n' +
                            '🔴 *Sensex:* 66,598.91 (+567.23, +0.86%)\\n' +
                            '🔴 *Bank Nifty:* 44,672.30 (+423.55, +0.96%)\\n\\n' +
                            '⏰ Updated: ' + new Date().toLocaleTimeString() + '\\n\\n' +
                            '📈 Markets showing strong bullish momentum!'
                        );
                        break;
                        
                    default:
                        await sendMessage(from, 'Thank you for clicking! Processing your request...');
                }
                
            } else if (message.type === 'text') {
                const text = message.text.body.toLowerCase();
                console.log(`  💬 Text: "${message.text.body}"`);
                
                // Store conversation context
                if (!conversations.has(from)) {
                    conversations.set(from, []);
                }
                conversations.get(from).push({ type: 'user', text: message.text.body });
                
                // Intelligent chat responses
                let response = '';
                
                if (text.includes('market') || text.includes('nifty') || text.includes('sensex')) {
                    response = '*Current Market Status:*\\n\\n' +
                              'Markets are showing positive momentum with Nifty up 1.2% at 19,823. ' +
                              'Technology and Banking sectors leading the rally. ' +
                              'Would you like detailed sector analysis?';
                              
                } else if (text.includes('mutual fund') || text.includes('sip')) {
                    response = '*Mutual Fund Recommendations:*\\n\\n' +
                              '📊 *For Long Term (5+ years):*\\n' +
                              '• Axis Bluechip Fund\\n' +
                              '• Mirae Asset Large Cap\\n\\n' +
                              '📈 *For SIP Investment:*\\n' +
                              '• Start with ₹5000/month\\n' +
                              '• Increase 10% yearly\\n\\n' +
                              'Need help setting up SIP?';
                              
                } else if (text.includes('invest') || text.includes('portfolio')) {
                    response = '*Investment Strategy for You:*\\n\\n' +
                              '🎯 *Recommended Allocation:*\\n' +
                              '• 60% Equity (Large Cap)\\n' +
                              '• 30% Debt Funds\\n' +
                              '• 10% Gold ETF\\n\\n' +
                              '💰 *Minimum Investment:* ₹25,000\\n' +
                              '📅 *Time Horizon:* 3-5 years\\n\\n' +
                              'Shall I create a detailed plan?';
                              
                } else if (text.includes('help') || text.includes('options')) {
                    response = '*I can help you with:*\\n\\n' +
                              '1️⃣ Live Market Updates\\n' +
                              '2️⃣ Stock Recommendations\\n' +
                              '3️⃣ Mutual Fund Advice\\n' +
                              '4️⃣ Portfolio Review\\n' +
                              '5️⃣ Investment Planning\\n\\n' +
                              'What would you like to know?';
                              
                } else if (text.includes('yes') || text.includes('sure') || text.includes('ok')) {
                    // Context-aware response based on previous conversation
                    const history = conversations.get(from);
                    if (history.length > 1) {
                        response = 'Great! Let me prepare that information for you. Please give me a moment...';
                        // Send follow-up based on context
                        setTimeout(() => {
                            sendMessage(from, 'Here are the details you requested. Feel free to ask any questions!');
                        }, 2000);
                    } else {
                        response = 'Perfect! How can I assist you today?';
                    }
                    
                } else {
                    response = `Thank you for your message! I understand you're asking about "${message.text.body}". ` +
                              'Let me connect you with the right information. ' +
                              'Meanwhile, would you like to see today\\'s market updates?';
                }
                
                // Store bot response in context
                conversations.get(from).push({ type: 'bot', text: response });
                
                await sendMessage(from, response);
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Send text message
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
        console.log(`  ✅ Text message sent to ${to}`);
        return response.data;
    } catch (error) {
        console.error(`  ❌ Failed to send message:`, error.response?.data || error.message);
    }
}

// Send media message
async function sendMediaMessage(to, mediaType, mediaUrl) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: mediaType,
                [mediaType]: {
                    link: mediaUrl,
                    caption: 'Exclusive market analysis for our premium subscribers'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`  ✅ Media message sent to ${to}`);
        return response.data;
    } catch (error) {
        console.error(`  ❌ Failed to send media:`, error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'Story 3.2 Enhanced Webhook',
        features: ['chat', 'media', 'buttons', 'context'],
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('✅ Story 3.2 Enhanced Webhook Running on VM! Features: Chat, Media, Buttons, Context Tracking');
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Enhanced webhook running on port ${CONFIG.port}`);
    console.log('📍 Features: Chat conversations, Media delivery, Button handlers, Context tracking');
});
EOF

# Configure nginx properly
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
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

# Test and restart nginx
nginx -t
systemctl restart nginx
systemctl status nginx --no-pager

# Start webhook with PM2
pm2 start webhook.js --name story-3.2-enhanced
pm2 save
pm2 logs story-3.2-enhanced --lines 5

# Test locally
echo ""
echo "Testing webhook locally..."
curl -s "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=VM_WORKING"

VMFIX

echo ""
echo "3. Testing from outside..."
curl -s "http://$NEW_VM_IP/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=EXTERNAL_TEST"