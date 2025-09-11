const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL WORKING WEBHOOK - On correct port 3000
 * This will receive button clicks and deliver content
 */

const express = require('express');
const axios = require('axios');
const { Logger } = require('./utils/logger');

const logger = new Logger({ name: 'WebhookFinal' });
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🚀 FINAL WEBHOOK HANDLER - PORT 3000');
console.log('=' .repeat(60));

/**
 * Webhook verification (GET)
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔐 Verification request:', { mode, token });
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

/**
 * Webhook events (POST)
 */
app.post('/webhook', async (req, res) => {
    console.log('\n📨 WEBHOOK EVENT RECEIVED!');
    console.log('Timestamp:', new Date().toISOString());
    
    // Acknowledge immediately
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log('\n🔔 Message from:', message.from);
            console.log('   Type:', message.type);
            
            // Handle interactive button clicks
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log('   🔘 BUTTON CLICKED!');
                console.log('   Button ID:', buttonId);
                console.log('   Button Title:', buttonTitle);
                
                // Deliver content
                await deliverContent(message.from, buttonId);
            }
            
            // Handle text messages
            if (message.type === 'text') {
                const text = message.text?.body?.toLowerCase() || '';
                console.log('   Text:', text);
                
                if (text.includes('unlock') || text.includes('content') || text.includes('get')) {
                    console.log('   🔓 Unlock keyword detected!');
                    await deliverContent(message.from, 'TEXT_UNLOCK');
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

/**
 * Deliver content to advisor
 */
async function deliverContent(toNumber, triggerId) {
    console.log(`\n📤 DELIVERING CONTENT TO: ${toNumber}`);
    
    // Map phone to advisor name
    const advisorMap = {
        '919765071249': 'Avalok',
        '919673758777': 'Shruti', 
        '918975758513': 'Vidyadhar',
        '919022810769': 'Test User'
    };
    
    const advisorName = advisorMap[toNumber] || 'Valued Advisor';
    
    try {
        // Send multiple messages with content
        const messages = [
            {
                type: 'text',
                text: {
                    body: `🎯 *Content Unlocked!*\n\nHi ${advisorName}, here's your daily content package:`
                }
            },
            {
                type: 'text',
                text: {
                    body: `*📘 LINKEDIN POST*\n\n` +
                          `Market Update 📈\n\n` +
                          `The Indian equity markets continue their winning streak with Sensex crossing 73,000!\n\n` +
                          `Key Highlights:\n` +
                          `• IT stocks surge 3.2%\n` +
                          `• Banking index at new high\n` +
                          `• FII inflows of ₹2,847 crores\n\n` +
                          `Is your portfolio positioned for this rally? Let's discuss your investment strategy.\n\n` +
                          `#StockMarket #Sensex #Investing #WealthManagement`
                }
            },
            {
                type: 'image',
                image: {
                    link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
                    caption: `📊 *INSTAGRAM POST*\n\nInvestment Tip: Start SIPs in ELSS funds for tax saving + wealth creation!\n\n#TaxSaving #MutualFunds #FinancialPlanning`
                }
            },
            {
                type: 'text',
                text: {
                    body: `*💬 WHATSAPP STATUS*\n\n` +
                          `"The best time to plant a tree was 20 years ago.\n` +
                          `The second best time is now."\n\n` +
                          `Start your investment journey today! 🌱\n` +
                          `Contact me for personalized advice 📱`
                }
            },
            {
                type: 'text',
                text: {
                    body: `✅ *ALL CONTENT DELIVERED!*\n\n` +
                          `You can now:\n` +
                          `• Copy each message (long press)\n` +
                          `• Share on respective platforms\n` +
                          `• Forward to interested clients\n\n` +
                          `🔔 Fresh content daily at 5 AM!`
                }
            }
        ];
        
        // Send each message
        for (let i = 0; i < messages.length; i++) {
            await sendWhatsAppMessage(toNumber, messages[i]);
            console.log(`   ✅ Message ${i + 1}/${messages.length} sent`);
            await new Promise(r => setTimeout(r, 1500));
        }
        
        console.log(`\n✅ All content delivered to ${advisorName}!`);
        
    } catch (error) {
        console.error('❌ Delivery failed:', error.message);
    }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message) {
    const url = `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace('+', ''),
        ...message
    };
    
    const response = await axios.post(url, payload, {
        headers: {
            'Authorization': `Bearer ${CONFIG.accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
}

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WhatsApp Webhook Server - FINAL',
        timestamp: new Date().toISOString(),
        port: 3000
    });
});

// Start server on port 3000 (Cloudflare expects this)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📡 Webhook listening on port: ${PORT}`);
    console.log(`🔗 URL: https://softball-one-realtor-telecom.trycloudflare.com/webhook`);
    console.log(`✅ Ready to receive button clicks!`);
    console.log('\n📱 CLICK THE BUTTON NOW - IT WILL WORK!');
});

module.exports = app;