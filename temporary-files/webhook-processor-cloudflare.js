const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Webhook Processor for Cloudflare Tunnel
 * Processes button clicks and delivers content automatically
 */

const express = require('express');
const axios = require('axios');
const { Logger } = require('./utils/logger');
const fs = require('fs').promises;
const path = require('path');

const logger = new Logger({ name: 'CloudflareWebhook' });
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration matching your Meta webhook
const WEBHOOK_CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Content storage
const CONTENT_QUEUE = {};

/**
 * Webhook verification endpoint (GET)
 * Meta will call this to verify the webhook
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔐 Webhook Verification Request:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === WEBHOOK_CONFIG.verifyToken) {
        console.log('✅ Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

/**
 * Main webhook endpoint (POST)
 * Receives events from WhatsApp
 */
app.post('/webhook', async (req, res) => {
    console.log('\n📨 Webhook Event Received');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Acknowledge receipt immediately
    res.status(200).send('OK');
    
    try {
        const { entry } = req.body;
        
        if (!entry || !Array.isArray(entry)) {
            console.log('Invalid webhook format');
            return;
        }
        
        // Process each entry
        for (const entryItem of entry) {
            const changes = entryItem.changes || [];
            
            for (const change of changes) {
                if (change.field !== 'messages') continue;
                
                const value = change.value;
                const messages = value.messages || [];
                
                // Process each message
                for (const message of messages) {
                    console.log(`\n📱 Processing message from: ${message.from}`);
                    console.log(`   Type: ${message.type}`);
                    
                    // Check for button click
                    if (message.type === 'button') {
                        const payload = message.button?.payload;
                        console.log(`   Button payload: ${payload}`);
                        
                        if (payload && payload.startsWith('UNLOCK_')) {
                            await handleUnlockRequest(message.from, payload);
                        }
                    }
                    
                    // Check for interactive button reply
                    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                        const buttonId = message.interactive.button_reply.id;
                        console.log(`   Interactive button ID: ${buttonId}`);
                        
                        if (buttonId && buttonId.startsWith('UNLOCK_')) {
                            await handleUnlockRequest(message.from, buttonId);
                        }
                    }
                    
                    // Check for text messages with keywords
                    if (message.type === 'text') {
                        const text = message.text?.body?.toLowerCase() || '';
                        console.log(`   Text message: ${text}`);
                        
                        if (text.includes('unlock') || text.includes('content') || text.includes('show')) {
                            console.log('   🔓 Unlock keyword detected!');
                            await handleUnlockRequest(message.from, 'UNLOCK_ALL');
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

/**
 * Handle unlock request - deliver content
 */
async function handleUnlockRequest(fromNumber, payload) {
    console.log(`\n🔓 HANDLING UNLOCK REQUEST`);
    console.log(`   From: ${fromNumber}`);
    console.log(`   Payload: ${payload}`);
    
    // Determine advisor name
    const advisorMap = {
        '919765071249': 'Avalok',
        '919673758777': 'Shruti',
        '918975758513': 'Vidyadhar',
        '919022810769': 'Test User'
    };
    
    const advisorName = advisorMap[fromNumber] || 'Valued Advisor';
    
    console.log(`   Advisor: ${advisorName}`);
    console.log(`   Delivering content...`);
    
    try {
        // Send introduction
        await sendWhatsAppMessage(fromNumber, {
            type: 'text',
            text: {
                body: `🎯 *Content Unlocked Successfully!*\n\n` +
                      `Hi ${advisorName}, here's your daily financial content for sharing:\n\n` +
                      `_Each message below is formatted for easy copying. Long press to copy and share with your clients._`
            }
        });
        
        await delay(1000);
        
        // Send LinkedIn content
        await sendWhatsAppMessage(fromNumber, {
            type: 'text',
            text: {
                body: `*📘 LINKEDIN POST*\n\n` +
                      `🎯 Tax Saving Tip of the Day:\n\n` +
                      `Did you know that investing in ELSS funds can save you up to ₹46,800 in taxes?\n\n` +
                      `Here's how:\n` +
                      `• Investment: ₹1,50,000 (Section 80C limit)\n` +
                      `• Tax bracket: 30% + cess\n` +
                      `• Tax saved: ₹46,800\n\n` +
                      `Plus, ELSS has the shortest lock-in period among all 80C options - just 3 years!\n\n` +
                      `DM me to know the top-performing ELSS funds for 2024.\n\n` +
                      `#TaxSaving #ELSS #FinancialPlanning #WealthCreation`
            }
        });
        
        await delay(1500);
        
        // Send Instagram content with image
        await sendWhatsAppMessage(fromNumber, {
            type: 'image',
            image: {
                link: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
                caption: `📸 *INSTAGRAM POST*\n\n💰 MONEY HACK MONDAY\n\nThe 50-30-20 Rule:\n📊 50% - Needs\n🎮 30% - Wants\n💎 20% - Savings\n\n#MoneyHack #PersonalFinance`
            }
        });
        
        await delay(1500);
        
        // Send completion message
        await sendWhatsAppMessage(fromNumber, {
            type: 'text',
            text: {
                body: `✅ *CONTENT DELIVERED!*\n\n` +
                      `*How to use:*\n` +
                      `1️⃣ Long press to copy each message\n` +
                      `2️⃣ Share on respective platforms\n` +
                      `3️⃣ Forward directly to clients\n\n` +
                      `🔔 Fresh content daily at 5 AM!`
            }
        });
        
        console.log(`   ✅ Content delivered successfully to ${advisorName}`);
        
        // Log the delivery
        await logDelivery(fromNumber, advisorName, payload);
        
    } catch (error) {
        console.error(`   ❌ Failed to deliver content:`, error.message);
    }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message) {
    const url = `https://graph.facebook.com/v21.0/${WEBHOOK_CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace('+', ''),
        ...message
    };
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${WEBHOOK_CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   📤 Message sent: ${response.data.messages?.[0]?.id}`);
        return response.data;
        
    } catch (error) {
        console.error(`   ❌ Send error:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Helper function for delays
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log delivery for tracking
 */
async function logDelivery(phone, name, payload) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        phone,
        name,
        payload,
        status: 'delivered'
    };
    
    try {
        const logFile = 'webhook-deliveries.log';
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        console.error('Failed to log delivery:', error);
    }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhook: 'cloudflare-tunnel',
        verifyToken: WEBHOOK_CONFIG.verifyToken
    });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.send('WhatsApp Webhook Processor - Cloudflare Tunnel Active');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log('\n🚀 WEBHOOK PROCESSOR FOR CLOUDFLARE TUNNEL');
    console.log('=' .repeat(60));
    console.log(`📡 Server running on port: ${PORT}`);
    console.log(`🔗 Webhook URL: https://softball-one-realtor-telecom.trycloudflare.com/webhook`);
    console.log(`🔑 Verify Token: ${WEBHOOK_CONFIG.verifyToken}`);
    console.log(`📱 Phone Number ID: ${WEBHOOK_CONFIG.phoneNumberId}`);
    console.log('\n✅ Ready to process button clicks!');
    console.log('\n📝 Endpoints:');
    console.log('   GET  /webhook - Verification');
    console.log('   POST /webhook - Event processing');
    console.log('   GET  /health - Health check');
});

module.exports = app;