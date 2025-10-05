#!/usr/bin/env node

/**
 * WEBHOOK BUTTON HANDLER
 * Handles button clicks and sends content back
 * Can be deployed to jarvisdaily.com or run locally for testing
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const CONFIG = {
    VERIFY_TOKEN: 'finadvise-webhook-2024',
    ACCESS_TOKEN: 'EAATOFQtMe9gBPiWoU2cDKvujQs58K60mrVGR1uxKjvxH4ZBkMKZBtqDHjGLp530kF7snQ2fqZCiZA9NSuZAAEojyiku77ZB0MMCC8VhkyGkOfv53236F5qDPbzWiRf1C2QOh1tTqc61glyKAtx6mZARZBOIEBpwAlYUdZAlKmkR7m5q2q6J5s9ZCYHPx7cpLZAyggZDZD',
    APP_SECRET: '1991d7e325d42daef6bc5d6720508ea3',
    PHONE_NUMBER_ID: '574744175733556',
    PORT: process.env.PORT || 3000
};

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   🔘 WEBHOOK BUTTON HANDLER ACTIVE                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const app = express();
app.use(bodyParser.json());

// Generate app secret proof
function generateAppSecretProof(accessToken, appSecret) {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(accessToken);
    return hmac.digest('hex');
}

// Log all events
function logEvent(type, data) {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${type}`);
    console.log('─'.repeat(60));
    console.log(JSON.stringify(data, null, 2));

    // Also save to file
    const log = { timestamp, type, data };
    fs.appendFileSync('webhook-events.log', JSON.stringify(log) + '\n');
}

// Send WhatsApp message
async function sendWhatsAppMessage(to, content) {
    const appSecretProof = generateAppSecretProof(CONFIG.ACCESS_TOKEN, CONFIG.APP_SECRET);
    const url = `https://graph.facebook.com/v17.0/${CONFIG.PHONE_NUMBER_ID}/messages?appsecret_proof=${appSecretProof}`;

    const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: content
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.messages) {
            console.log(`✅ Content sent to ${to}`);
            return true;
        } else {
            console.log(`❌ Failed to send content:`, result);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error sending message:`, error.message);
        return false;
    }
}

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook Verification Request');
    console.log(`Mode: ${mode}, Token: ${token}`);

    if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.sendStatus(403);
    }
});

// Webhook handler (POST)
app.post('/webhook', async (req, res) => {
    // ALWAYS respond with 200 immediately
    res.status(200).send('EVENT_RECEIVED');

    // Process the webhook event
    try {
        const body = req.body;

        logEvent('WEBHOOK_RECEIVED', body);

        if (body.object === 'whatsapp_business_account') {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
                const change = body.entry[0].changes[0];
                const value = change.value;

                if (value.messages && value.messages[0]) {
                    const message = value.messages[0];
                    const from = message.from;

                    console.log('\n🎯 MESSAGE RECEIVED!');
                    console.log(`From: ${from}`);
                    console.log(`Type: ${message.type}`);

                    // Handle button click
                    if (message.type === 'button') {
                        console.log('\n🔘 BUTTON CLICKED!');
                        console.log(`Button Text: ${message.button.text}`);
                        console.log(`Button Payload: ${message.button.payload}`);

                        // Send content based on button
                        let content = '';

                        if (message.button.text === 'Review' ||
                            message.button.text === 'View Details' ||
                            message.button.text === 'Retrieve Content' ||
                            message.button.text === 'View Information') {

                            content = `📊 *Financial Report*\n\n`;
                            content += `Dear Financial Advisor,\n\n`;
                            content += `Here's your requested information:\n\n`;
                            content += `📈 *Market Update:*\n`;
                            content += `• Sensex: 82,876 (+0.22%)\n`;
                            content += `• Nifty: 25,423 (+0.37%)\n`;
                            content += `• Gold: ₹62,500/10g (+0.5%)\n\n`;
                            content += `💼 *Portfolio Summary:*\n`;
                            content += `• Total Value: ₹12,45,000\n`;
                            content += `• Today's Change: +₹28,500\n`;
                            content += `• Monthly Return: +8.5%\n\n`;
                            content += `🎯 *Action Items:*\n`;
                            content += `1. Review IT sector allocation\n`;
                            content += `2. Consider profit booking\n`;
                            content += `3. Rebalance portfolio\n\n`;
                            content += `_Report generated at ${new Date().toLocaleString()}_`;

                        } else if (message.button.text === 'Confirm' || message.button.text === 'YES') {
                            content = `✅ *Confirmed!*\n\n`;
                            content += `Your request has been confirmed.\n`;
                            content += `Transaction ID: FIN${Date.now()}\n\n`;
                            content += `Thank you for using FinAdvise!`;

                        } else if (message.button.text === 'Cancel' || message.button.text === 'NO') {
                            content = `❌ *Cancelled*\n\n`;
                            content += `Your request has been cancelled.\n`;
                            content += `If you need assistance, reply "help".`;

                        } else {
                            content = `Thank you for clicking "${message.button.text}"!\n\n`;
                            content += `Your content is being processed...\n`;
                            content += `Reference: ${Date.now()}`;
                        }

                        console.log('\n📤 Sending content response...');
                        const sent = await sendWhatsAppMessage(from, content);

                        if (sent) {
                            console.log('✅✅✅ CONTENT DELIVERED SUCCESSFULLY!');
                            console.log('\n🎊 END-TO-END TEST COMPLETE!');
                            console.log('Button Click → Webhook → Content Delivery ✅');
                        }

                    } else if (message.type === 'interactive') {
                        // Handle interactive button replies
                        if (message.interactive && message.interactive.type === 'button_reply') {
                            console.log('\n🔘 INTERACTIVE BUTTON CLICKED!');
                            console.log(`Button ID: ${message.interactive.button_reply.id}`);
                            console.log(`Button Title: ${message.interactive.button_reply.title}`);

                            let content = `📊 *Response to: ${message.interactive.button_reply.title}*\n\n`;
                            content += `Processing your request...\n`;
                            content += `This is your personalized content!\n\n`;
                            content += `Time: ${new Date().toLocaleString()}`;

                            await sendWhatsAppMessage(from, content);
                        }

                    } else if (message.type === 'text') {
                        console.log(`Text: ${message.text.body}`);

                        // Auto-reply to text messages
                        if (message.text.body.toLowerCase().includes('test')) {
                            await sendWhatsAppMessage(from, '✅ Webhook is working! Send a template with buttons to test button clicks.');
                        }
                    }
                }

                // Handle status updates
                if (value.statuses && value.statuses[0]) {
                    const status = value.statuses[0];
                    console.log(`📬 Message Status: ${status.status} for ${status.id}`);
                }
            }
        }
    } catch (error) {
        console.log('❌ Error processing webhook:', error);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <h1>🔘 FinAdvise Webhook</h1>
        <p>Status: Active</p>
        <p>Webhook URL: /webhook</p>
        <p>Health: /health</p>
        <p>Token: ${CONFIG.VERIFY_TOKEN}</p>
    `);
});

// Start server
app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Webhook server running on port ${CONFIG.PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${CONFIG.PORT}/webhook`);
    console.log(`💚 Health check: http://localhost:${CONFIG.PORT}/health`);
    console.log(`🔐 Verify token: ${CONFIG.VERIFY_TOKEN}`);
    console.log('');
    console.log('✅ Ready to handle button clicks!');
    console.log('');
    console.log('📋 MONITORING EVENTS:');
    console.log('═'.repeat(60));
});