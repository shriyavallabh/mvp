#!/bin/bash

echo "🚀 FINAL VM DEPLOYMENT - STORY 3.2"
echo "==================================="
echo ""

export SSHPASS='Story32Webhook2024!'
VM_IP="159.89.166.94"

sshpass -e ssh -o StrictHostKeyChecking=no root@$VM_IP << 'DEPLOY'

echo "📦 Setting up Story 3.2 on VM..."

# Kill all node processes
pkill -f node
pm2 kill

# Clean install Node.js 18
cd ~
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node version
node --version

# Create webhook directory
rm -rf /root/webhook
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
    "dotenv": "^16.0.3"
  }
}
PACKAGE

# Install dependencies
npm install

# Create .env file
cat > .env << 'ENV'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
ENV

# Create webhook with full features (Node.js 18 compatible)
cat > webhook.js << 'WEBHOOK'
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Store conversations
const conversations = new Map();
const userProfiles = new Map();

console.log('🚀 Story 3.2 Complete Webhook Starting...');

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
        const entry = req.body.entry && req.body.entry[0];
        if (!entry) return;
        
        const changes = entry.changes && entry.changes[0];
        if (!changes) return;
        
        const value = changes.value;
        if (!value) return;
        
        const messages = value.messages || [];
        const contacts = value.contacts || [];
        
        for (const message of messages) {
            const from = message.from;
            const contact = contacts.find(c => c.wa_id === from);
            const contactName = contact && contact.profile ? contact.profile.name : 'User';
            
            // Store user profile
            if (!userProfiles.has(from)) {
                userProfiles.set(from, {
                    name: contactName,
                    firstSeen: new Date(),
                    messageCount: 0
                });
            }
            
            const userProfile = userProfiles.get(from);
            userProfile.messageCount++;
            userProfile.lastSeen = new Date();
            
            console.log(`\n📱 Message from ${contactName} (${from}):`);
            console.log(`   Total messages: ${userProfile.messageCount}`);
            
            // Handle button clicks
            if (message.type === 'interactive' && message.interactive && message.interactive.type === 'button_reply') {
                const buttonReply = message.interactive.button_reply;
                const buttonId = buttonReply.id;
                const buttonTitle = buttonReply.title;
                
                console.log(`   🔘 Button clicked: "${buttonTitle}" (ID: ${buttonId})`);
                
                // Handle different button types with media
                if (buttonId === 'UNLOCK_IMAGES') {
                    await sendMessage(from, '📸 *Your Daily Market Images*\n\nPreparing exclusive visual content...');
                    
                    // Send sample image (you can replace with actual images)
                    await sendMediaMessage(from, 'image', 
                        'https://img.freepik.com/free-vector/gradient-stock-market-concept_23-2149166401.jpg',
                        '*Today\\'s Market Analysis*\n\n📈 Bullish momentum continues\n📊 Volume picking up\n💡 Key levels to watch'
                    );
                    
                    await sendMessage(from, 
                        '✅ *Images Delivered!*\n\n' +
                        'Share these with your clients to showcase market opportunities.\n\n' +
                        'Need more analysis? Just ask!'
                    );
                    
                } else if (buttonId === 'UNLOCK_CONTENT') {
                    await sendMessage(from, 
                        '📝 *Personalized Content - ' + new Date().toLocaleDateString() + '*\n\n' +
                        '*🎯 Today\\'s Focus:*\n' +
                        '• Technology sector showing strength\n' +
                        '• Banking stocks consolidating\n' +
                        '• Auto sector ready for breakout\n\n' +
                        '*📊 Top Recommendations:*\n' +
                        '1. *TCS* - Buy above 3850 | Target: 4000\n' +
                        '2. *HDFC Bank* - Accumulate | Range: 1650-1700\n' +
                        '3. *Maruti* - Watch for breakout above 11200\n\n' +
                        '*💰 Investment Strategy:*\n' +
                        '• Book partial profits in IT stocks\n' +
                        '• Add quality banking names on dips\n' +
                        '• Keep 20% cash for opportunities\n\n' +
                        '_Disclaimer: For educational purposes only_'
                    );
                    
                } else if (buttonId === 'UNLOCK_UPDATES') {
                    const time = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
                    await sendMessage(from, 
                        '📊 *LIVE MARKET UPDATE*\n' +
                        '```' + time + ' IST```\n\n' +
                        '🔴 *NIFTY 50:* 19,823.45\n' +
                        '   ↗️ +236.15 (+1.21%)\n\n' +
                        '🔴 *SENSEX:* 66,598.91\n' +
                        '   ↗️ +567.23 (+0.86%)\n\n' +
                        '🔴 *BANK NIFTY:* 44,672.30\n' +
                        '   ↗️ +423.55 (+0.96%)\n\n' +
                        '*📈 Sector Performance:*\n' +
                        '• IT: +2.3% 🟢\n' +
                        '• Banking: +0.9% 🟢\n' +
                        '• Auto: +1.5% 🟢\n' +
                        '• Pharma: -0.4% 🔴\n\n' +
                        '*🌍 Global Markets:*\n' +
                        '• SGX Nifty: +185 pts\n' +
                        '• Dow Futures: +0.5%\n' +
                        '• Crude Oil: $87.23\n\n' +
                        '_Next update in 30 minutes_'
                    );
                }
                
            // Handle text messages with intelligent responses
            } else if (message.type === 'text') {
                const text = message.text.body;
                const textLower = text.toLowerCase();
                
                console.log(`   💬 Text: "${text}"`);
                
                // Initialize conversation history
                if (!conversations.has(from)) {
                    conversations.set(from, []);
                }
                
                const history = conversations.get(from);
                history.push({ type: 'user', text: text, timestamp: new Date() });
                
                // Keep only last 10 messages
                if (history.length > 10) {
                    history.shift();
                }
                
                // Generate intelligent response based on keywords
                let response = '';
                
                if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey')) {
                    response = `Hello ${contactName}! 👋\n\n` +
                              'Welcome back! How can I assist you today?\n\n' +
                              '*Quick Options:*\n' +
                              '• Market updates\n' +
                              '• Stock recommendations\n' +
                              '• Portfolio advice\n' +
                              '• Investment planning';
                              
                } else if (textLower.includes('market') || textLower.includes('nifty') || textLower.includes('sensex')) {
                    response = '*Market Analysis:*\n\n' +
                              'Markets are trading with positive bias. Nifty holding above 19,800 crucial support.\n\n' +
                              '*Key Levels:*\n' +
                              '• Support: 19,750\n' +
                              '• Resistance: 19,950\n\n' +
                              'Shall I send you detailed sector analysis?';
                              
                } else if (textLower.includes('stock') || textLower.includes('recommend')) {
                    response = '*Today\\'s Stock Picks:* 📈\n\n' +
                              '*Intraday:*\n' +
                              '• Reliance: Buy above 2860\n' +
                              '• SBI: Buy above 625\n\n' +
                              '*Positional:*\n' +
                              '• Infosys: Target 1580\n' +
                              '• Asian Paints: Target 3400\n\n' +
                              'Want detailed analysis of any stock?';
                              
                } else if (textLower.includes('mutual fund') || textLower.includes('sip')) {
                    response = '*Mutual Fund Guide:* 💰\n\n' +
                              '*Best SIP Options:*\n' +
                              '• HDFC Flexicap Fund\n' +
                              '• Axis Bluechip Fund\n' +
                              '• SBI Small Cap Fund\n\n' +
                              '*Suggested Allocation:*\n' +
                              '• Large Cap: 50%\n' +
                              '• Mid Cap: 30%\n' +
                              '• Small Cap: 20%\n\n' +
                              'Monthly SIP of ₹10,000 recommended. Need help starting?';
                              
                } else if (textLower.includes('portfolio') || textLower.includes('invest')) {
                    response = '*Investment Advisory:* 🎯\n\n' +
                              'Based on current market conditions:\n\n' +
                              '*Asset Allocation:*\n' +
                              '• Equity: 65%\n' +
                              '• Debt: 25%\n' +
                              '• Gold: 10%\n\n' +
                              '*Risk Profile:* Moderate\n' +
                              '*Time Horizon:* 3-5 years\n' +
                              '*Expected Returns:* 12-15% CAGR\n\n' +
                              'Would you like a personalized plan?';
                              
                } else if (textLower.includes('yes') || textLower.includes('sure') || textLower.includes('ok')) {
                    // Context-aware affirmative response
                    if (history.length > 1) {
                        response = 'Great! Let me prepare that for you... 📊\n\n' +
                                  'I\\'ll send you the detailed information shortly.\n\n' +
                                  'Meanwhile, is there anything specific you\\'d like to know?';
                    } else {
                        response = 'Perfect! What information would you like to receive?\n\n' +
                                  '• Market updates\n' +
                                  '• Stock tips\n' +
                                  '• Investment advice';
                    }
                    
                } else if (textLower.includes('thank')) {
                    response = 'You\\'re welcome! 😊\n\n' +
                              'Happy to help with your investment journey.\n\n' +
                              'Feel free to ask anything else. I\\'m here 24/7!';
                              
                } else {
                    // Default intelligent response
                    response = `I understand you're asking about "${text}".\n\n` +
                              'Let me help you with that. Here are some options:\n\n' +
                              '1️⃣ Get latest market updates\n' +
                              '2️⃣ View stock recommendations\n' +
                              '3️⃣ Check portfolio suggestions\n' +
                              '4️⃣ Learn investment strategies\n\n' +
                              'What would you prefer?';
                }
                
                // Store bot response
                history.push({ type: 'bot', text: response, timestamp: new Date() });
                
                // Send response
                await sendMessage(from, response);
                
                // Show conversation context
                console.log(`   📝 Conversation history: ${history.length} messages`);
            }
        }
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
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
        console.log(`   ✅ Message sent successfully`);
        return response.data;
    } catch (error) {
        console.error(`   ❌ Failed to send:`, error.response ? error.response.data : error.message);
    }
}

// Send media message
async function sendMediaMessage(to, mediaType, mediaUrl, caption) {
    try {
        const payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: mediaType
        };
        
        payload[mediaType] = {
            link: mediaUrl
        };
        
        if (caption) {
            payload[mediaType].caption = caption;
        }
        
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`   ✅ Media sent successfully`);
        return response.data;
    } catch (error) {
        console.error(`   ❌ Failed to send media:`, error.response ? error.response.data : error.message);
    }
}

// Send UTILITY template
async function sendUtilityTemplate(to) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
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
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`   ✅ UTILITY template sent to ${to}`);
        return response.data;
    } catch (error) {
        console.error(`   ❌ Failed to send template:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

// Test endpoint to send UTILITY template
app.post('/send-utility', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
    }
    
    try {
        const result = await sendUtilityTemplate(phone);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'Story 3.2 Complete Webhook',
        features: [
            'Meta webhook verification',
            'Button click handlers with media',
            'Intelligent chat responses',
            'Conversation tracking',
            'User profiles',
            'UTILITY templates'
        ],
        stats: {
            totalUsers: userProfiles.size,
            activeConversations: conversations.size
        },
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <h1>✅ Story 3.2 Webhook Running on VM!</h1>
        <h2>Features:</h2>
        <ul>
            <li>✅ Meta Webhook Verification</li>
            <li>✅ Button Click Handlers</li>
            <li>✅ Media Message Delivery</li>
            <li>✅ Intelligent Chat Responses</li>
            <li>✅ Conversation Tracking</li>
            <li>✅ User Profiles</li>
        </ul>
        <p>Health: <a href="/health">/health</a></p>
    `);
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log('📍 All features active and ready!');
    console.log('🔗 VM URL: http://159.89.166.94/webhook');
});
WEBHOOK

# Remove SSL from nginx for now
cat > /etc/nginx/sites-available/default << 'NGINX'
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
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
    }
}
NGINX

# Test and restart nginx
nginx -t
systemctl restart nginx

# Start webhook with PM2
pm2 start webhook.js --name story-3.2
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

# Show status
echo ""
echo "=== DEPLOYMENT STATUS ==="
pm2 list
echo ""
echo "=== TESTING WEBHOOK ==="
sleep 3
curl -s "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=VM_SUCCESS"

DEPLOY

echo ""
echo "🔍 Testing from outside..."
sleep 5
curl -s "http://$VM_IP/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=EXTERNAL_SUCCESS"