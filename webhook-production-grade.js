const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Production-grade configuration
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

console.log('🚀 PRODUCTION-GRADE WEBHOOK v2.0');
console.log('📱 Phone:', CONFIG.phoneNumberId);
console.log('🎯 Target:', CONFIG.recipientNumber);

// Content library - optimized for delivery
const CONTENT = [
    {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
        caption: '📊 *MARKET OVERVIEW*\nToday\'s key market indicators'
    },
    {
        type: 'text',
        body: `📈 *MARKET ANALYSIS*\n\n• Nifty 50: 19,875 (+1.2%)\n• Sensex: 65,432 (+0.9%)\n• Bank Nifty: 44,250 (+1.5%)\n\n💎 *TOP PICKS:*\n1. HDFC Bank - ₹1,750\n2. Reliance - ₹2,950\n3. TCS - ₹3,850\n\n🎯 Strong buy recommendations with 15-20% upside`
    },
    {
        type: 'image', 
        url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&q=80',
        caption: '💼 *PORTFOLIO STRATEGY*\nOptimal allocation for maximum returns'
    },
    {
        type: 'text',
        body: `💡 *INVESTMENT STRATEGY*\n\n✅ *ALLOCATION:*\n• Large Cap: 50%\n• Mid Cap: 30% \n• Debt: 20%\n\n⚠️ *RISKS:* Global volatility, rate changes\n\n🚀 *ACTIONS:*\n• Book profits in overvalued stocks\n• Accumulate quality on dips\n• Keep 15% cash ready\n\n📱 Share with your clients for maximum impact!`
    }
];

// Production-grade message sender with retry logic
async function sendWhatsAppMessage(content, attempt = 1) {
    const MAX_RETRIES = 3;
    
    try {
        console.log(`📤 Sending ${content.type} (attempt ${attempt})`);
        
        let payload = {
            messaging_product: 'whatsapp',
            to: CONFIG.recipientNumber
        };
        
        if (content.type === 'text') {
            payload.type = 'text';
            payload.text = { body: content.body };
        } else if (content.type === 'image') {
            payload.type = 'image';
            payload.image = {
                link: content.url,
                caption: content.caption
            };
        }
        
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        const messageId = response.data.messages?.[0]?.id;
        console.log(`✅ ${content.type} sent successfully! ID: ${messageId}`);
        return { success: true, messageId };
        
    } catch (error) {
        console.error(`❌ ${content.type} failed (attempt ${attempt}):`, 
            error.response?.data?.error?.message || error.message);
            
        if (attempt < MAX_RETRIES) {
            console.log(`⏳ Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return sendWhatsAppMessage(content, attempt + 1);
        }
        
        return { success: false, error: error.message };
    }
}

// Production-grade content delivery sequence
async function deliverContentSequence() {
    console.log('\n🎬 STARTING CONTENT DELIVERY SEQUENCE');
    console.log(`📦 Total messages: ${CONTENT.length}`);
    console.log(`🕐 Started at: ${new Date().toLocaleTimeString()}`);
    
    const results = [];
    
    for (let i = 0; i < CONTENT.length; i++) {
        const content = CONTENT[i];
        console.log(`\n📨 Message ${i + 1}/${CONTENT.length}: ${content.type}`);
        
        const result = await sendWhatsAppMessage(content);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ Message ${i + 1} delivered successfully`);
        } else {
            console.log(`❌ Message ${i + 1} failed: ${result.error}`);
        }
        
        // Inter-message delay to avoid rate limiting
        if (i < CONTENT.length - 1) {
            console.log('⏳ Waiting 2 seconds before next message...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n🏁 SEQUENCE COMPLETE: ${successful}/${CONTENT.length} delivered`);
    console.log(`🕐 Finished at: ${new Date().toLocaleTimeString()}`);
    
    return results;
}

// Webhook verification (Meta standard)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verification successful');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.sendStatus(403);
    }
});

// Main webhook handler - production grade
app.post('/webhook', async (req, res) => {
    // Always respond immediately (Meta requirement)
    res.sendStatus(200);
    
    try {
        console.log('\n' + '='.repeat(60));
        console.log('📥 WEBHOOK EVENT RECEIVED');
        console.log('🕐 Time:', new Date().toLocaleTimeString());
        console.log('='.repeat(60));
        
        const body = req.body;
        
        // Defensive validation
        if (!body?.entry?.[0]?.changes?.[0]?.value) {
            console.log('❌ Invalid webhook payload structure');
            return;
        }
        
        const value = body.entry[0].changes[0].value;
        const messages = value.messages;
        
        if (!messages || messages.length === 0) {
            console.log('ℹ️  Non-message event (status update)');
            return;
        }
        
        const message = messages[0];
        const from = message.from;
        
        console.log(`📱 Message from: ${from}`);
        console.log(`📋 Message type: ${message.type}`);
        console.log(`📄 Full message:`, JSON.stringify(message, null, 2));
        
        // Handle different message types
        if (message.type === 'button') {
            // Template button click
            const buttonText = message.button?.text;
            const buttonPayload = message.button?.payload;
            
            console.log('\n🔘 BUTTON CLICK DETECTED');
            console.log(`📝 Button text: "${buttonText}"`);
            console.log(`🏷️  Button payload: "${buttonPayload}"`);
            
            if (from === CONFIG.recipientNumber) {
                console.log('✅ Button click from authorized user');
                console.log('🚀 Triggering content delivery...');
                
                const results = await deliverContentSequence();
                console.log(`📊 Delivery summary: ${results.filter(r => r.success).length}/${results.length} successful`);
            } else {
                console.log(`❌ Button click from unauthorized user: ${from}`);
            }
            
        } else if (message.type === 'interactive') {
            // Interactive button click (alternative format)
            const buttonReply = message.interactive?.button_reply;
            console.log('\n🔘 INTERACTIVE BUTTON DETECTED');
            console.log(`📝 Button:`, JSON.stringify(buttonReply, null, 2));
            
            if (from === CONFIG.recipientNumber) {
                await deliverContentSequence();
            }
            
        } else if (message.type === 'text') {
            // Text message
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 TEXT MESSAGE: "${text}"`);
            
            if (from === CONFIG.recipientNumber && 
                (text.includes('content') || text.includes('retrieve'))) {
                console.log('🎯 Keyword match - delivering content');
                await deliverContentSequence();
            }
            
        } else {
            console.log(`⚠️  Unhandled message type: ${message.type}`);
        }
        
    } catch (error) {
        console.error('\n❌ WEBHOOK ERROR:', error);
        console.error('Stack trace:', error.stack);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.0',
        type: 'Production Webhook',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
            phoneNumberId: CONFIG.phoneNumberId,
            contentItems: CONTENT.length
        }
    });
});

// Start server
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PRODUCTION WEBHOOK ONLINE');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${CONFIG.port}`);
    console.log(`📱 Phone: ${CONFIG.phoneNumberId}`);
    console.log(`📦 Content: ${CONTENT.length} messages ready`);
    console.log(`🕐 Started: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
});

// Production error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});