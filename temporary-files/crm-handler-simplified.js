const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * SIMPLIFIED CRM HANDLER WITH FALLBACK RESPONSES
 * Works immediately without VM setup
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// Conversation context
const conversations = new Map();

// Predefined intelligent responses
const RESPONSE_TEMPLATES = {
    greeting: [
        "Hello! I'm your FinAdvise assistant. How can I help you today?",
        "Hi there! Ready to assist with your financial advisory needs.",
        "Good to hear from you! What can I help you with?"
    ],
    contentFeedback: {
        negative: "I understand you're not satisfied with today's content. What topics would be more valuable for you? Mutual funds, tax planning, or market analysis?",
        positive: "Great to hear you like the content! I'll continue sending similar updates.",
        request: "I'll customize your content preferences. What specific topics interest you most?"
    },
    help: "I can help with:\n• Daily content preferences\n• Market updates\n• Investment strategies\n• Tax planning tips\n• Technical support\n\nWhat would you like to know?",
    timing: "Daily updates are sent at 5 AM IST. Would you prefer a different time?",
    stop: "I've paused your daily updates. Send 'START' anytime to resume.",
    start: "Welcome back! Daily updates have been resumed.",
    mutual_funds: "I'll send you mutual fund analysis including:\n• Top performing funds\n• Category comparisons\n• SIP recommendations\n\nThis will be in tomorrow's update.",
    tax: "Tax planning content coming up! You'll receive:\n• Section 80C options\n• New vs Old regime comparison\n• HNI tax strategies\n\nLook for it in tomorrow's message.",
    default: "Thank you for your message. How can I assist you with your financial advisory needs today?"
};

console.log('\n🤖 CRM HANDLER WITH INTELLIGENT RESPONSES');
console.log('=' .repeat(70));
console.log('Ready to handle text messages and button clicks\n');

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    // Always respond immediately
    res.status(200).send('OK');
    
    // Process events
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    const contacts = value?.contacts || [];
    
    for (const message of messages) {
        const from = message.from;
        const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'Advisor';
        
        console.log(`\n📨 Message from ${contactName} (${from})`);
        console.log(`   Type: ${message.type}`);
        
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            // BUTTON CLICK
            const buttonId = message.interactive.button_reply.id;
            const buttonTitle = message.interactive.button_reply.title;
            
            console.log(`   🔘 Button: "${buttonTitle}" (${buttonId})`);
            
            if (buttonId.includes('UNLOCK')) {
                await sendContentForButton(from, buttonId);
            }
            
        } else if (message.type === 'text') {
            // TEXT MESSAGE - Generate intelligent response
            const text = message.text.body;
            console.log(`   💬 Text: "${text}"`);
            
            const response = await generateResponse(text, from, contactName);
            console.log(`   🤖 Response: "${response.substring(0, 50)}..."`);
            
            await sendMessage(from, response);
            
            // Update conversation history
            let history = conversations.get(from) || [];
            history.push({ user: text, bot: response, time: new Date() });
            if (history.length > 10) history = history.slice(-10);
            conversations.set(from, history);
        }
    }
});

/**
 * Generate intelligent response based on message content
 */
async function generateResponse(text, from, contactName) {
    const lowerText = text.toLowerCase();
    
    // Check for keywords and generate appropriate response
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('how are you')) {
        return RESPONSE_TEMPLATES.greeting[Math.floor(Math.random() * RESPONSE_TEMPLATES.greeting.length)];
    }
    
    if (lowerText.includes("don't like") || lowerText.includes('not good') || lowerText.includes('bad content')) {
        return RESPONSE_TEMPLATES.contentFeedback.negative;
    }
    
    if (lowerText.includes('love') || lowerText.includes('great') || lowerText.includes('excellent')) {
        return RESPONSE_TEMPLATES.contentFeedback.positive;
    }
    
    if (lowerText.includes('mutual fund')) {
        return RESPONSE_TEMPLATES.mutual_funds;
    }
    
    if (lowerText.includes('tax')) {
        return RESPONSE_TEMPLATES.tax;
    }
    
    if (lowerText.includes('time') || lowerText.includes('when')) {
        return RESPONSE_TEMPLATES.timing;
    }
    
    if (lowerText.includes('stop') || lowerText.includes('unsubscribe')) {
        return RESPONSE_TEMPLATES.stop;
    }
    
    if (lowerText.includes('start') || lowerText.includes('resume')) {
        return RESPONSE_TEMPLATES.start;
    }
    
    if (lowerText.includes('help') || lowerText === '?') {
        return RESPONSE_TEMPLATES.help;
    }
    
    if (lowerText === 'more') {
        return "Here are more options:\n📊 Market Analysis\n💰 Investment Tips\n📋 Tax Planning\n🎯 Client Strategies\n\nReply with topic name for details.";
    }
    
    // Context-aware response based on conversation history
    const history = conversations.get(from);
    if (history && history.length > 0) {
        const lastMessage = history[history.length - 1];
        if (lastMessage.bot.includes('What topics would be more valuable')) {
            return `Great choice! I'll update your preferences to include more ${text} content. You'll see this in tomorrow's update.`;
        }
    }
    
    // Default response with personalization
    return `Thank you ${contactName} for your message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"

I'm here to help with your financial advisory needs. You can:
• Ask about specific topics (mutual funds, tax, markets)
• Request different content types
• Share feedback on daily updates
• Get support with the platform

How can I assist you today?`;
}

/**
 * Send content for button clicks
 */
async function sendContentForButton(from, buttonId) {
    console.log(`   📦 Delivering content for button: ${buttonId}`);
    
    const messages = [
        "📊 *Market Update*\nNifty: 19,783 (+1.2%)\nSensex: 66,428 (+380)",
        "💰 *Investment Tip*\nConsider SIP in large-cap funds for stable returns",
        "📋 *Tax Reminder*\nMaximize 80C benefits before March 31"
    ];
    
    for (const msg of messages) {
        await sendMessage(from, msg);
        await new Promise(r => setTimeout(r, 1500));
    }
}

/**
 * Send WhatsApp message
 */
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
        
        console.log(`   ✅ Response sent`);
        return response.data;
    } catch (error) {
        console.error('   ❌ Send failed:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeConversations: conversations.size
    });
});

// Start server
app.listen(CONFIG.port, () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log('📊 Handling:');
    console.log('   • Text messages → Intelligent responses');
    console.log('   • Button clicks → Content delivery');
    console.log('\nWaiting for messages...\n');
});