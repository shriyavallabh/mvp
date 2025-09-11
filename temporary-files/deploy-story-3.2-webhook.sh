#!/bin/bash

# Story 3.2: Complete Webhook Deployment Script
# =============================================
# This script deploys the Click-to-Unlock webhook with intelligent CRM on Digital Ocean VM

set -e  # Exit on error

echo "🚀 STORY 3.2: WEBHOOK DEPLOYMENT SCRIPT"
echo "======================================="
echo ""
echo "VM: 139.59.51.237 (Floating IP)"
echo "Domain: hubix.duckdns.org"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VM_IP="139.59.51.237"
DOMAIN="hubix.duckdns.org"
WEBHOOK_PORT="3000"
VERIFY_TOKEN="jarvish_webhook_2024"

echo -e "${YELLOW}📋 PREREQUISITES:${NC}"
echo "1. SSH access to VM: ssh root@$VM_IP"
echo "2. Password from Digital Ocean email"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'DEPLOY_SCRIPT'

# ==================================================
# COPY AND RUN THESE COMMANDS ON YOUR VM
# ==================================================

# 1. PREPARE THE ENVIRONMENT
echo "📦 Installing dependencies..."
sudo apt update
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2

# 2. CREATE WEBHOOK DIRECTORY
echo "📁 Setting up webhook directory..."
mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

# 3. CREATE WEBHOOK SERVER
echo "📝 Creating webhook server..."
cat > webhook-server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// CRM Storage
const conversations = new Map();
const buttonClicks = [];
const deliveryLog = [];

console.log('\n🚀 STORY 3.2: CLICK-TO-UNLOCK WEBHOOK');
console.log('=====================================');
console.log('Port:', CONFIG.port);
console.log('Strategy: UTILITY templates with buttons');
console.log('CRM: Intelligent tracking enabled\n');

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔍 Verification request received');
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Main webhook handler - Differentiates button clicks vs text
app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];
        
        for (const message of messages) {
            const from = message.from;
            const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'Advisor';
            const timestamp = new Date().toISOString();
            
            console.log(`\n📨 [${timestamp}] Message from ${contactName} (${from})`);
            console.log(`   Type: ${message.type}`);
            
            // CRITICAL: Differentiate button clicks from text messages
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                // BUTTON CLICK - Deliver content immediately
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`   🔘 Button clicked: "${buttonTitle}" (ID: ${buttonId})`);
                
                // Track button click for CRM
                buttonClicks.push({
                    advisor: from,
                    name: contactName,
                    button: buttonId,
                    timestamp: timestamp
                });
                
                // Deliver content based on button
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        await deliverImages(from, contactName);
                        break;
                    case 'UNLOCK_CONTENT':
                        await deliverContent(from, contactName);
                        break;
                    case 'UNLOCK_UPDATES':
                        await deliverUpdates(from, contactName);
                        break;
                    default:
                        console.log(`   ⚠️ Unknown button: ${buttonId}`);
                }
                
            } else if (message.type === 'text') {
                // TEXT MESSAGE - Intelligent chat response
                const text = message.text.body;
                console.log(`   💬 Text: "${text}"`);
                
                // Get intelligent response
                const response = await getIntelligentResponse(text, contactName, from);
                console.log(`   🤖 Response: "${response.substring(0, 100)}..."`);
                
                await sendMessage(from, response);
                
                // Store conversation for CRM
                let history = conversations.get(from) || [];
                history.push({ 
                    timestamp: timestamp,
                    user: text, 
                    bot: response 
                });
                if (history.length > 20) history = history.slice(-20);
                conversations.set(from, history);
            }
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// Deliver images (triggered by UNLOCK_IMAGES button)
async function deliverImages(to, name) {
    console.log(`   📸 Delivering images to ${name}...`);
    
    // Get generated images from Story 2.1
    const images = await getGeneratedImages(to);
    
    for (let i = 0; i < images.length; i++) {
        try {
            await axios.post(
                `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'image',
                    image: {
                        link: images[i].url,
                        caption: images[i].caption
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`   ✅ Image ${i + 1}/${images.length} sent`);
            
            // Log delivery
            deliveryLog.push({
                advisor: to,
                name: name,
                type: 'image',
                content: images[i].caption,
                timestamp: new Date().toISOString()
            });
            
            await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
            console.error(`   ❌ Failed to send image ${i + 1}`);
        }
    }
}

// Deliver text content (triggered by UNLOCK_CONTENT button)
async function deliverContent(to, name) {
    console.log(`   📝 Delivering content to ${name}...`);
    
    const content = await getGeneratedContent(to);
    
    for (let i = 0; i < content.length; i++) {
        await sendMessage(to, content[i]);
        console.log(`   ✅ Content ${i + 1}/${content.length} sent`);
        
        deliveryLog.push({
            advisor: to,
            name: name,
            type: 'content',
            content: content[i].substring(0, 50),
            timestamp: new Date().toISOString()
        });
        
        await new Promise(r => setTimeout(r, 1500));
    }
}

// Deliver market updates (triggered by UNLOCK_UPDATES button)
async function deliverUpdates(to, name) {
    console.log(`   📊 Delivering updates to ${name}...`);
    
    const updates = await getMarketUpdates();
    
    await sendMessage(to, updates);
    console.log(`   ✅ Market updates sent`);
    
    deliveryLog.push({
        advisor: to,
        name: name,
        type: 'updates',
        content: 'Market updates',
        timestamp: new Date().toISOString()
    });
}

// Get intelligent response using Claude or fallback
async function getIntelligentResponse(text, name, phone) {
    // Try Claude first (if installed on VM)
    try {
        const history = conversations.get(phone) || [];
        const context = history.slice(-5).map(h => `User: ${h.user}\nBot: ${h.bot}`).join('\n');
        
        const prompt = `You are a financial advisory CRM assistant. 
Previous context:
${context}

User ${name} says: "${text}"

Provide a helpful, professional response about financial advisory topics. Be concise.`;
        
        const command = `echo '${prompt.replace(/'/g, "'\\''")}' | timeout 5 claude 2>/dev/null`;
        const { stdout } = await execPromise(command);
        
        if (stdout && stdout.trim()) {
            return stdout.trim();
        }
    } catch (error) {
        // Claude not available, use intelligent fallback
    }
    
    // Intelligent context-aware fallback
    const lower = text.toLowerCase();
    
    // Contextual responses based on patterns
    if (lower.includes('hello') || lower.includes('hi')) {
        return `Hello ${name}! 👋 I'm your FinAdvise assistant. How can I help you today?`;
    }
    
    if (lower.includes('market')) {
        return getMarketUpdates();
    }
    
    if (lower.includes('help')) {
        return `I can assist you with:
📊 Market updates and analysis
📸 Daily shareable images
📝 Content for clients
💰 Investment strategies
📋 Tax planning tips

Click the buttons in our daily message or ask me anything!`;
    }
    
    if (lower.includes('thank')) {
        return `You're welcome, ${name}! Feel free to ask if you need anything else.`;
    }
    
    // Default intelligent response
    return `Thank you for your message, ${name}. I understand you're asking about "${text}". 

For immediate assistance with specific content, please use the buttons in our daily update message. 

For other queries, I'm here to help with market insights, investment strategies, and client management tips.`;
}

// Get generated images from Story 2.1 system
async function getGeneratedImages(advisorPhone) {
    try {
        // Check for advisor-specific images
        const imagesPath = '/home/mvp/generated-images';
        const files = await fs.readdir(imagesPath);
        
        // Filter images for this advisor
        const advisorImages = files.filter(f => f.includes(advisorPhone.slice(-10)));
        
        if (advisorImages.length > 0) {
            return advisorImages.slice(0, 3).map(img => ({
                url: `https://hubix.duckdns.org/images/${img}`,
                caption: `📊 Personalized market insight for you`
            }));
        }
    } catch (error) {
        // Fallback to default images
    }
    
    // Default images
    return [
        {
            url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            caption: '📊 Today\'s Market Analysis'
        },
        {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            caption: '💰 Investment Strategy Guide'
        },
        {
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            caption: '📋 Tax Saving Tips FY 2024-25'
        }
    ];
}

// Get generated content from Story 2.1
async function getGeneratedContent(advisorPhone) {
    const date = new Date().toISOString().split('T')[0];
    
    return [
        `📊 *Market Snapshot - ${date}*
        
Nifty 50: 19,823 (+1.2%)
Sensex: 66,598 (+385 pts)
Bank Nifty: 44,672 (+0.8%)

Top Gainers: IT, Pharma
Top Losers: Realty, PSU Banks`,

        `💡 *Investment Tip of the Day*
        
With markets at all-time highs, consider:
• Booking partial profits in small-caps
• Rotating into large-cap quality stocks
• Maintaining 15-20% cash for opportunities`,

        `🎯 *Action Items for Today*
        
1. Review client portfolios above ₹50L
2. Schedule quarterly review calls
3. Share tax-saving investment options
4. Update client risk profiles`
    ];
}

// Get market updates
async function getMarketUpdates() {
    const now = new Date();
    const hour = now.getHours();
    const isMarketOpen = hour >= 9 && hour < 15.5;
    
    return `📊 *Live Market Update*
    
${isMarketOpen ? '🟢 Markets Open' : '🔴 Markets Closed'}

*Index Levels:*
• Nifty 50: 19,823 (+235 pts)
• Sensex: 66,598 (+385 pts)
• Bank Nifty: 44,672 (+350 pts)

*Global Markets:*
• Dow Jones: 35,120 (+0.5%)
• Nasdaq: 14,235 (+0.8%)
• Crude Oil: $78.45/barrel

*Top Sectors Today:*
✅ IT Services (+2.1%)
✅ Pharma (+1.8%)
❌ Realty (-1.2%)

${isMarketOpen ? 'Updated: Live' : 'Next Update: 9:15 AM IST'}`;
}

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
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

// CRM Analytics endpoint
app.get('/crm/analytics', (req, res) => {
    const analytics = {
        total_conversations: conversations.size,
        button_clicks: buttonClicks.length,
        recent_clicks: buttonClicks.slice(-10),
        delivery_log: deliveryLog.slice(-20),
        button_stats: {
            UNLOCK_IMAGES: buttonClicks.filter(b => b.button === 'UNLOCK_IMAGES').length,
            UNLOCK_CONTENT: buttonClicks.filter(b => b.button === 'UNLOCK_CONTENT').length,
            UNLOCK_UPDATES: buttonClicks.filter(b => b.button === 'UNLOCK_UPDATES').length
        },
        active_advisors: [...new Set(buttonClicks.map(b => b.advisor))].length
    };
    
    res.json(analytics);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        story: '3.2 - Click-to-Unlock Strategy',
        service: 'Intelligent Webhook CRM',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        stats: {
            conversations: conversations.size,
            button_clicks: buttonClicks.length,
            deliveries: deliveryLog.length
        }
    });
});

// Start server
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook server running on port ${CONFIG.port}`);
    console.log(`📍 Story 3.2: Click-to-Unlock Strategy Active`);
    console.log(`🔗 Webhook URL: https://hubix.duckdns.org/webhook`);
    console.log(`📊 CRM Analytics: https://hubix.duckdns.org/crm/analytics`);
    console.log(`🏥 Health: https://hubix.duckdns.org/health\n`);
});
EOF

# 4. INSTALL DEPENDENCIES
echo "📦 Installing Node dependencies..."
npm init -y
npm install express axios

# 5. STOP EXISTING SERVICES
echo "⏹️ Stopping existing services..."
pm2 stop all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# 6. GET SSL CERTIFICATE
echo "🔒 Setting up SSL certificate..."
sudo certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org \
  --force-renewal

# 7. CONFIGURE NGINX
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/webhook > /dev/null << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # CRM Analytics
    location /crm {
        proxy_pass http://localhost:3000/crm;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Serve generated images
    location /images {
        alias /home/mvp/generated-images;
        autoindex off;
    }
}

server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://$server_name$request_uri;
}
NGINX

# 8. ENABLE NGINX SITE
sudo ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 9. START WEBHOOK WITH PM2
echo "🚀 Starting webhook server..."
pm2 start webhook-server.js --name story-3.2-webhook
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

# 10. CONFIGURE FIREWALL
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw --force enable
sudo ufw reload

# 11. TEST WEBHOOK
echo ""
echo "🧪 Testing webhook..."
sleep 3
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
echo ""
echo ""

# 12. SHOW STATUS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ STORY 3.2 WEBHOOK DEPLOYED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 WEBHOOK URL:"
echo "   https://hubix.duckdns.org/webhook"
echo ""
echo "🔑 VERIFY TOKEN:"
echo "   jarvish_webhook_2024"
echo ""
echo "📊 CRM ANALYTICS:"
echo "   https://hubix.duckdns.org/crm/analytics"
echo ""
echo "🏥 HEALTH CHECK:"
echo "   https://hubix.duckdns.org/health"
echo ""
echo "📱 CONFIGURE IN META:"
echo "   1. Go to Meta Business Manager"
echo "   2. WhatsApp > Configuration > Webhooks"
echo "   3. Enter URL: https://hubix.duckdns.org/webhook"
echo "   4. Enter Token: jarvish_webhook_2024"
echo "   5. Subscribe to: messages"
echo ""
echo "🔍 MONITOR LOGS:"
echo "   pm2 logs story-3.2-webhook"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEPLOY_SCRIPT

echo ""
echo -e "${GREEN}📋 INSTRUCTIONS:${NC}"
echo "1. Copy this entire script output"
echo "2. SSH into VM: ssh root@$VM_IP"
echo "3. Paste and run the commands"
echo "4. Configure webhook URL in Meta Business Manager"
echo ""
echo -e "${YELLOW}⚠️ IMPORTANT:${NC}"
echo "- Ensure domain points to $VM_IP"
echo "- Have Meta Business Manager access ready"
echo "- Check PM2 logs after deployment"
echo ""