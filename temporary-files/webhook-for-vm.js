const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

// Configuration - Update with your actual token
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

console.log('\n🚀 WEBHOOK RUNNING ON DIGITAL OCEAN VM');
console.log('======================================');
console.log('Port:', CONFIG.port);
console.log('Ready to handle WhatsApp messages!\n');

// Store conversations
const conversations = new Map();

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔍 Verification request received');
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
    // Always respond immediately to Meta
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];
        
        for (const message of messages) {
            const from = message.from;
            const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'User';
            
            console.log(`\n📨 Message from ${contactName} (${from})`);
            console.log(`   Type: ${message.type}`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                // Handle button clicks
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`   🔘 Button clicked: "${buttonTitle}"`);
                
                if (buttonId.includes('UNLOCK_MEDIA') || buttonTitle.includes('Get Images')) {
                    await sendImages(from);
                } else if (buttonId.includes('UNLOCK_CONTENT')) {
                    await sendTextContent(from);
                }
                
            } else if (message.type === 'text') {
                // Handle text messages
                const text = message.text.body;
                console.log(`   💬 Message: "${text}"`);
                
                // Get intelligent response
                const response = await getIntelligentResponse(text, contactName);
                console.log(`   🤖 Responding with: "${response.substring(0, 50)}..."`);
                
                await sendMessage(from, response);
                
                // Store conversation
                let history = conversations.get(from) || [];
                history.push({ user: text, bot: response });
                if (history.length > 10) history = history.slice(-10);
                conversations.set(from, history);
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Get intelligent response (try Claude first, then fallback)
async function getIntelligentResponse(text, name) {
    // First try to use Claude if available on VM
    try {
        const prompt = `User ${name} asks: "${text}". Give a helpful response about financial advisory topics. Be concise.`;
        const command = `echo '${prompt.replace(/'/g, "'\\''")}' | timeout 5 claude 2>/dev/null`;
        const { stdout } = await execPromise(command);
        
        if (stdout && stdout.trim()) {
            return stdout.trim();
        }
    } catch (error) {
        // Claude not available, use fallback
    }
    
    // Intelligent fallback responses
    const lower = text.toLowerCase();
    const now = new Date();
    
    if (lower.includes('hello') || lower.includes('hi')) {
        return `Hello ${name}! 👋 I'm here to help with your financial advisory needs. What can I assist you with today?`;
    }
    
    if (lower.includes('date')) {
        return `Today is ${now.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`;
    }
    
    if (lower.includes('time')) {
        return `The current time is ${now.toLocaleTimeString('en-IN')}`;
    }
    
    if (lower.includes('market')) {
        const hour = now.getHours();
        const isMarketOpen = hour >= 9 && hour < 15.5;
        
        return `Markets are ${isMarketOpen ? 'open' : 'closed'} now.
        
Current levels (approximate):
• Nifty 50: ~19,800
• Sensex: ~66,500
• Bank Nifty: ~44,600

${isMarketOpen ? 'Check NSE/BSE for live data.' : 'Markets open at 9:15 AM IST.'}`;
    }
    
    if (lower.includes('help')) {
        return `I can help you with:
📊 Market updates
💰 Investment strategies
📋 Tax planning
🎯 Client management
📱 Content delivery

What would you like to know?`;
    }
    
    // Default response
    return `Thank you for your message, ${name}. I can help you with market updates, investment strategies, tax planning, and more. What specific information do you need?`;
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

// Send images
async function sendImages(to) {
    console.log('   📸 Sending images...');
    
    const images = [
        {
            url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            caption: '📊 Market Analysis - Share with clients'
        },
        {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            caption: '💰 Investment Portfolio Guide'
        },
        {
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            caption: '📋 Tax Saving Strategies FY 2024-25'
        }
    ];
    
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
            console.log(`   ✅ Image ${i + 1}/3 sent`);
            await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
            console.error(`   ❌ Failed to send image ${i + 1}:`, error.response?.data || error.message);
        }
    }
}

// Send text content
async function sendTextContent(to) {
    console.log('   📝 Sending text content...');
    
    const content = [
        `📊 *Market Update*\nNifty: 19,800 (+1.2%)\nSensex: 66,500 (+380 pts)\n\nKey sectors performing well today.`,
        `💡 *Investment Tip*\nConsider SIP in large-cap funds for stable long-term returns. Start with ₹10,000/month.`,
        `🎯 *Action Item*\nSchedule portfolio review calls with clients who haven't rebalanced in last quarter.`
    ];
    
    for (let i = 0; i < content.length; i++) {
        await sendMessage(to, content[i]);
        console.log(`   ✅ Message ${i + 1}/3 sent`);
        await new Promise(r => setTimeout(r, 1500));
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'finadvise-webhook',
        vm: 'Digital Ocean',
        timestamp: new Date().toISOString(),
        conversations: conversations.size
    });
});

// Start server
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook server running on port ${CONFIG.port}`);
    console.log(`📍 Listening on all interfaces (0.0.0.0)`);
    console.log(`\n🔗 Webhook URL for Meta: http://YOUR_VM_IP:${CONFIG.port}/webhook`);
    console.log(`🏥 Health check: http://YOUR_VM_IP:${CONFIG.port}/health\n`);
});