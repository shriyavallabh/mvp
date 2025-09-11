const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * PRODUCTION CLICK-TO-UNLOCK HANDLER
 * Receives button clicks and delivers marketing content
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// Store content queue per advisor
const contentQueue = new Map();

// Marketing content templates
const MARKETING_CONTENT = {
    investment_strategies: {
        messages: [
            {
                type: 'text',
                content: `📊 *Today's Investment Insight*

*Market Update:*
• Nifty 50: +1.2% 📈
• Sensex: +380 points
• Gold: ₹62,450/10g

*Recommended Strategy:*
Consider diversifying with a 60-40 equity-debt split for balanced growth.

*Top Performing Sectors:*
1. Banking & Finance
2. IT Services
3. Pharmaceuticals`
            },
            {
                type: 'text',
                content: `💡 *Smart SIP Strategy*

Start a SIP of ₹10,000 in these funds:
• Large Cap Fund (40%)
• Mid Cap Fund (30%)
• Debt Fund (30%)

Expected Returns: 12-15% CAGR

*Pro Tip:* Increase SIP by 10% annually for wealth acceleration.`
            },
            {
                type: 'text',
                content: `🎯 *Action Items for Advisors:*

1. Review client portfolios for rebalancing
2. Schedule quarterly review calls
3. Update risk assessments

*Share this with your clients:*
"Markets reward patience. Stay invested for long-term wealth creation."`
            }
        ]
    },
    tax_planning: {
        messages: [
            {
                type: 'text',
                content: `📋 *Tax Saving Opportunities*

*Section 80C Options:*
• ELSS Funds - Up to ₹1.5L
• PPF - 7.1% returns
• Life Insurance Premium
• Children's Tuition Fees

*New Tax Regime Benefits:*
• Standard Deduction: ₹75,000
• Lower tax rates
• No investment required`
            },
            {
                type: 'text',
                content: `💰 *HNI Tax Planning*

*Advanced Strategies:*
• NPS additional ₹50,000 (80CCD)
• Health Insurance ₹25,000-₹1L
• Home Loan Interest ₹2L
• Education Loan Interest

*Capital Gains Planning:*
• Harvest losses before March 31
• Use indexation benefits wisely`
            }
        ]
    }
};

console.log('\n🚀 PRODUCTION CLICK-TO-UNLOCK HANDLER');
console.log('=' .repeat(70));
console.log(`Port: ${CONFIG.port}`);
console.log('Status: Ready to handle button clicks\n');

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

// Handle webhook events
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    console.log(`\n[${new Date().toISOString()}] Event received`);
    
    // Always respond immediately
    res.status(200).send('OK');
    
    // Process events
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    
    for (const message of messages) {
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            const from = message.from;
            
            console.log(`\n🔘 BUTTON CLICK DETECTED`);
            console.log(`   From: ${from}`);
            console.log(`   Button: ${buttonId}`);
            
            // Check if this is an unlock request
            if (buttonId.includes('UNLOCK_CONTENT')) {
                await handleUnlockRequest(from, buttonId);
            }
        }
    }
});

// Handle unlock request
async function handleUnlockRequest(advisorPhone, buttonId) {
    console.log(`\n📬 Processing unlock request from ${advisorPhone}`);
    
    // Determine content type from button ID
    const contentType = buttonId.includes('INVESTMENT') ? 'investment_strategies' : 'tax_planning';
    const content = MARKETING_CONTENT[contentType];
    
    if (!content) {
        console.error('No content found for type:', contentType);
        return;
    }
    
    console.log(`   Delivering ${content.messages.length} messages...`);
    
    // Send each message with delay
    for (let i = 0; i < content.messages.length; i++) {
        const msg = content.messages[i];
        
        try {
            await sendMessage(advisorPhone, msg.content);
            console.log(`   ✅ Message ${i + 1}/${content.messages.length} sent`);
            
            // Wait 2 seconds between messages
            if (i < content.messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`   ❌ Failed to send message ${i + 1}:`, error.message);
        }
    }
    
    console.log(`   ✅ Content delivery complete for ${advisorPhone}`);
}

// Send WhatsApp message
async function sendMessage(to, text) {
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
}

// Send UTILITY template with unlock button
async function sendUnlockTemplate(advisorPhone, contentType = 'investment') {
    console.log(`\n📤 Sending unlock template to ${advisorPhone}`);
    
    const buttonId = `UNLOCK_CONTENT_${contentType.toUpperCase()}_${Date.now()}`;
    
    const response = await axios.post(
        `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to: advisorPhone,
            type: 'interactive',
            interactive: {
                type: 'button',
                header: {
                    type: 'text',
                    text: '📊 Daily Financial Insights'
                },
                body: {
                    text: `Good morning! Today's exclusive content is ready for you.

Topic: ${contentType === 'investment' ? 'Investment Strategies & Market Update' : 'Tax Planning Guide'}

This content includes:
• Market analysis
• Actionable strategies
• Client talking points

Click below to receive your content immediately.`
                },
                footer: {
                    text: 'FinAdvise - Your Partner in Growth'
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: buttonId,
                                title: '📥 Get Content'
                            }
                        }
                    ]
                }
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    console.log('   ✅ Template sent successfully');
    return response.data;
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'click-to-unlock-production'
    });
});

// Start server
app.listen(CONFIG.port, () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log('Waiting for button clicks...\n');
});

// Export for testing
module.exports = { sendUnlockTemplate, handleUnlockRequest };