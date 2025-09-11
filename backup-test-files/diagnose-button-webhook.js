const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * DEEP DIAGNOSIS: Why button clicks aren't reaching webhook
 * This will identify and fix the issue
 */

const axios = require('axios');
const express = require('express');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024'
};

console.log('\n🔍 DEEP BUTTON WEBHOOK DIAGNOSIS');
console.log('=' .repeat(70));

/**
 * STEP 1: Check current webhook configuration
 */
async function checkWebhookConfig() {
    console.log('\n1️⃣ Checking current webhook configuration...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('Current webhook subscriptions:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if messages field is subscribed
        const subscriptions = response.data.data?.[0]?.subscribed_fields || [];
        const hasMessages = subscriptions.includes('messages');
        
        if (!hasMessages) {
            console.log('\n❌ PROBLEM FOUND: "messages" field is NOT subscribed!');
            return false;
        } else {
            console.log('\n✅ "messages" field is subscribed');
            return true;
        }
        
    } catch (error) {
        console.error('Error checking webhook:', error.response?.data || error.message);
        return false;
    }
}

/**
 * STEP 2: Subscribe to messages field
 */
async function subscribeToMessages() {
    console.log('\n2️⃣ Subscribing to messages field...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`;
    
    try {
        const response = await axios.post(url, 
            {
                subscribed_fields: 'messages'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Successfully subscribed to messages field!');
        console.log('Response:', response.data);
        return true;
        
    } catch (error) {
        console.error('❌ Failed to subscribe:', error.response?.data || error.message);
        return false;
    }
}

/**
 * STEP 3: Create a test button message with correct format
 */
async function sendCorrectButtonTemplate() {
    console.log('\n3️⃣ Sending correctly formatted button template...\n');
    
    // Try different button approaches
    const templates = [
        {
            name: 'Using quick_reply button in template',
            payload: {
                messaging_product: 'whatsapp',
                to: '919022810769',
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Test User' },
                                { type: 'text', text: 'January 11, 2025' },
                                { type: 'text', text: 'TEST123' }
                            ]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '0',
                            parameters: [{
                                type: 'payload',
                                payload: 'UNLOCK_CONTENT_NOW'
                            }]
                        }
                    ]
                }
            }
        },
        {
            name: 'Using interactive button message',
            payload: {
                messaging_product: 'whatsapp',
                to: '919022810769',
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: '📚 Your Content is Ready!'
                    },
                    body: {
                        text: 'Your daily financial content package is ready for delivery. Click below to receive it instantly.'
                    },
                    footer: {
                        text: 'FinAdvise Content Service'
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: 'UNLOCK_BUTTON_CLICKED',
                                    title: 'Get Content'
                                }
                            }
                        ]
                    }
                }
            }
        }
    ];
    
    for (const template of templates) {
        console.log(`Testing: ${template.name}`);
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
                template.payload,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ Sent successfully: ${response.data.messages?.[0]?.id}`);
            
        } catch (error) {
            console.log(`❌ Failed: ${error.response?.data?.error?.message || error.message}`);
        }
        
        await new Promise(r => setTimeout(r, 3000));
    }
}

/**
 * STEP 4: Create a test webhook listener that logs EVERYTHING
 */
async function createDiagnosticWebhook() {
    console.log('\n4️⃣ Creating diagnostic webhook listener...\n');
    
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Log ALL incoming requests
    app.use((req, res, next) => {
        console.log('\n📨 INCOMING REQUEST:');
        console.log(`Method: ${req.method}`);
        console.log(`Path: ${req.path}`);
        console.log(`Headers:`, req.headers);
        console.log(`Body:`, JSON.stringify(req.body, null, 2));
        next();
    });
    
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
    
    // Webhook events
    app.post('/webhook', (req, res) => {
        console.log('\n🎯 WEBHOOK EVENT RECEIVED!');
        
        res.status(200).send('OK');
        
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log('\n📱 Message Details:');
            console.log(`From: ${message.from}`);
            console.log(`Type: ${message.type}`);
            console.log(`ID: ${message.id}`);
            
            if (message.type === 'button') {
                console.log('🔘 BUTTON CLICK DETECTED!');
                console.log(`Payload: ${message.button?.payload}`);
                console.log(`Text: ${message.button?.text}`);
            }
            
            if (message.type === 'interactive') {
                console.log('🔘 INTERACTIVE BUTTON DETECTED!');
                console.log(`Button ID: ${message.interactive?.button_reply?.id}`);
                console.log(`Button Title: ${message.interactive?.button_reply?.title}`);
            }
            
            if (message.type === 'text') {
                console.log(`Text: ${message.text?.body}`);
            }
        }
    });
    
    const PORT = 5002;
    app.listen(PORT, () => {
        console.log(`📡 Diagnostic webhook listening on port ${PORT}`);
        console.log('This will log EVERYTHING that Meta sends');
    });
}

/**
 * STEP 5: Check webhook URL configuration in Meta
 */
async function checkWebhookURL() {
    console.log('\n5️⃣ Checking webhook URL configuration...\n');
    
    // Get app subscriptions
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}`;
    
    try {
        const response = await axios.get(url, {
            params: {
                fields: 'id,name,webhook_configuration'
            },
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('Business Account Info:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Main diagnosis flow
 */
async function diagnose() {
    // Step 1: Check current config
    const isSubscribed = await checkWebhookConfig();
    
    // Step 2: Subscribe if needed
    if (!isSubscribed) {
        await subscribeToMessages();
    }
    
    // Step 3: Check webhook URL
    await checkWebhookURL();
    
    // Step 4: Send test messages
    await sendCorrectButtonTemplate();
    
    // Step 5: Start diagnostic listener
    await createDiagnosticWebhook();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n✅ NEXT STEPS:');
    console.log('1. Check WhatsApp for two new messages with buttons');
    console.log('2. Click both buttons');
    console.log('3. Watch this console for webhook events');
    console.log('4. If no events appear, the issue is Meta webhook config');
    console.log('\n🔧 TO FIX IN META BUSINESS MANAGER:');
    console.log('1. Go to: WhatsApp > Configuration > Webhooks');
    console.log('2. Edit webhook settings');
    console.log('3. Make sure "messages" field is checked');
    console.log('4. Save changes');
}

diagnose().catch(console.error);