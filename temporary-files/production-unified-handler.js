const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * PRODUCTION UNIFIED HANDLER
 * Handles ALL webhook events properly:
 * - Button clicks → Deliver appropriate content (text or images)
 * - Text messages → Intelligent CRM responses
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

// Conversation context for CRM
const conversations = new Map();

// Media content library
const MEDIA_CONTENT = {
    market_update: {
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        caption: `📊 *Today's Market Snapshot*

Nifty 50: 19,783 (+1.2%) 📈
Sensex: 66,428 (+380 pts)
Bank Nifty: 44,567 (+0.8%)

*Top Gainers:*
• HDFC Bank +2.3%
• Infosys +1.8%
• Reliance +1.5%

Share this with your clients!`
    },
    investment_strategy: {
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        caption: `💰 *Smart Investment Strategy*

*Portfolio Allocation:*
• Equity: 60%
• Debt: 25%
• Gold: 10%
• Cash: 5%

*Monthly SIP: ₹10,000*
Expected Returns: 12-15% CAGR

Forward to clients for investment planning!`
    },
    tax_planning: {
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        caption: `📋 *Tax Saving Guide FY 2024-25*

*Max Section 80C (₹1.5L):*
• ELSS Mutual Funds
• PPF/EPF
• Life Insurance
• Home Loan Principal

*Additional:*
• NPS: ₹50,000
• Health Insurance: ₹25,000+

Help clients save taxes!`
    }
};

// Text content for regular unlocks
const TEXT_CONTENT = {
    investment: [
        `📊 *Market Update for Advisors*

Nifty: 19,783 (+1.2%)
Sensex: 66,428 (+380)

*Client Talking Points:*
• Markets at all-time highs
• Good time for profit booking
• Rebalance portfolios quarterly`,
        
        `💡 *Investment Strategy*

*For Young Clients (25-35):*
• 70% Equity, 20% Debt, 10% Gold

*For Retired Clients:*
• 30% Equity, 60% Debt, 10% Gold

Share this allocation guide!`,
        
        `🎯 *Action Items:*
1. Review client portfolios
2. Schedule review calls
3. Update risk assessments

*Quote for clients:*
"Time in market beats timing the market"`
    ]
};

// CRM Response templates
const CRM_RESPONSES = {
    greeting: [
        "Hello! I'm your FinAdvise assistant. How can I help you today?",
        "Hi there! Ready to assist with your advisory needs.",
        "Good to hear from you! What can I help you with?"
    ],
    contentFeedback: {
        negative: "I understand you're not satisfied with today's content. What topics would be more valuable? Mutual funds, tax planning, or market analysis?",
        positive: "Great to hear! I'll continue sending similar updates.",
    },
    help: "I can help with:\n• Content preferences\n• Market updates\n• Investment strategies\n• Tax planning\n• Technical support\n\nWhat would you like?",
    default: "Thank you for your message. How can I assist you today?"
};

console.log('\n🚀 PRODUCTION UNIFIED HANDLER');
console.log('=' .repeat(70));
console.log('Handles buttons, text, and media properly\n');

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
            // BUTTON CLICK - Check what type of content to deliver
            const buttonId = message.interactive.button_reply.id;
            const buttonTitle = message.interactive.button_reply.title;
            
            console.log(`   🔘 Button: "${buttonTitle}" (${buttonId})`);
            
            // Route to appropriate handler based on button ID
            if (buttonId.includes('UNLOCK_MEDIA')) {
                // Deliver IMAGES
                await deliverMediaContent(from, buttonId);
            } else if (buttonId.includes('UNLOCK_CONTENT')) {
                // Deliver TEXT content
                await deliverTextContent(from, buttonId);
            } else if (buttonId.includes('GET_IMAGES') || buttonTitle.includes('Get Images')) {
                // Also deliver images for these buttons
                await deliverMediaContent(from, buttonId);
            } else {
                // Generic button handler
                await handleGenericButton(from, buttonId, buttonTitle);
            }
            
        } else if (message.type === 'text') {
            // TEXT MESSAGE - CRM Response
            const text = message.text.body;
            console.log(`   💬 Text: "${text}"`);
            
            const response = await generateCRMResponse(text, from, contactName);
            console.log(`   🤖 Response: "${response.substring(0, 50)}..."`);
            
            await sendTextMessage(from, response);
            
            // Update conversation history
            let history = conversations.get(from) || [];
            history.push({ user: text, bot: response, time: new Date() });
            if (history.length > 10) history = history.slice(-10);
            conversations.set(from, history);
        }
    }
});

/**
 * Deliver MEDIA content (images with captions)
 */
async function deliverMediaContent(from, buttonId) {
    console.log(`   📸 Delivering MEDIA content for: ${buttonId}`);
    
    const mediaItems = Object.values(MEDIA_CONTENT);
    
    for (let i = 0; i < mediaItems.length; i++) {
        const media = mediaItems[i];
        
        try {
            // Send image with caption
            await sendImageMessage(from, media.imageUrl, media.caption);
            console.log(`   ✅ Image ${i + 1}/${mediaItems.length} sent`);
            
            // Wait between messages
            if (i < mediaItems.length - 1) {
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (error) {
            console.error(`   ❌ Failed to send image ${i + 1}:`, error.message);
        }
    }
    
    // Send follow-up
    await sendTextMessage(from, 
        `✅ *Visual Content Delivered!*

You received 3 images with:
📊 Market Update
💰 Investment Strategy
📋 Tax Planning Guide

Share these with your clients!`
    );
}

/**
 * Deliver TEXT content
 */
async function deliverTextContent(from, buttonId) {
    console.log(`   📝 Delivering TEXT content for: ${buttonId}`);
    
    const content = TEXT_CONTENT.investment;
    
    for (let i = 0; i < content.length; i++) {
        await sendTextMessage(from, content[i]);
        console.log(`   ✅ Message ${i + 1}/${content.length} sent`);
        
        if (i < content.length - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }
}

/**
 * Handle generic buttons
 */
async function handleGenericButton(from, buttonId, buttonTitle) {
    console.log(`   📦 Generic button handler`);
    
    // Default content delivery
    await sendTextMessage(from, 
        `Thank you for clicking "${buttonTitle}". 
        
How can I help you further?`
    );
}

/**
 * Generate CRM response for text messages
 */
async function generateCRMResponse(text, from, contactName) {
    const lowerText = text.toLowerCase();
    
    // Greetings
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('how are you')) {
        return CRM_RESPONSES.greeting[Math.floor(Math.random() * CRM_RESPONSES.greeting.length)];
    }
    
    // Negative feedback
    if (lowerText.includes("don't like") || lowerText.includes('not good')) {
        return CRM_RESPONSES.contentFeedback.negative;
    }
    
    // Positive feedback
    if (lowerText.includes('great') || lowerText.includes('excellent')) {
        return CRM_RESPONSES.contentFeedback.positive;
    }
    
    // Help
    if (lowerText.includes('help')) {
        return CRM_RESPONSES.help;
    }
    
    // Specific requests
    if (lowerText.includes('mutual fund')) {
        return "I'll send mutual fund analysis in tomorrow's update. You'll receive top funds, SIP recommendations, and category comparisons.";
    }
    
    if (lowerText.includes('tax')) {
        return "Tax planning content coming up! Tomorrow's update will include Section 80C options, new vs old regime comparison, and HNI strategies.";
    }
    
    // Default personalized response
    return `Thank you ${contactName} for your message. ${CRM_RESPONSES.default}`;
}

/**
 * Send text message
 */
async function sendTextMessage(to, text) {
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
        console.error('   ❌ Send text failed:', error.response?.data || error.message);
    }
}

/**
 * Send image message
 */
async function sendImageMessage(to, imageUrl, caption) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: imageUrl,
                    caption: caption
                }
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
        console.error('   ❌ Send image failed:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'production-unified-handler',
        features: ['button-clicks', 'text-messages', 'media-delivery', 'crm-responses']
    });
});

// Start server
app.listen(CONFIG.port, () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log('\n📊 PRODUCTION FEATURES:');
    console.log('   • Button "Get Images" → Delivers 3 images with captions');
    console.log('   • Button "Unlock Content" → Delivers text messages');
    console.log('   • Text messages → Intelligent CRM responses');
    console.log('   • Maintains conversation context');
    console.log('\nReady for production use!\n');
});