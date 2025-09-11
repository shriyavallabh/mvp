const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE WEBHOOK TEST
 * Tests everything end-to-end with Your Jarvis Daily Assistant phone
 */

const axios = require('axios');
const express = require('express');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,  // Your Jarvis Daily Assistant
    phoneNumber: '+917666684471',      // Actual phone number
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024'
};

console.log('\n🚀 FINAL WEBHOOK TEST - YOUR JARVIS DAILY ASSISTANT');
console.log('=' .repeat(70));
console.log(`Phone: ${CONFIG.phoneNumber}`);
console.log(`Phone ID: ${CONFIG.phoneNumberId}\n`);

/**
 * Step 1: Check webhook subscription
 */
async function checkWebhookSubscription() {
    console.log('1️⃣ Checking webhook subscription...\n');
    
    const url = `https://graph.facebook.com/v21.0/1861646317956355/subscribed_apps`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        const apps = response.data.data || [];
        if (apps.length > 0) {
            console.log('✅ Webhook is subscribed');
            console.log(`   App: ${apps[0].whatsapp_business_api_data?.name}`);
        } else {
            console.log('❌ No webhook subscription found!');
        }
        
        return apps.length > 0;
    } catch (error) {
        console.error('Error checking subscription:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 2: Subscribe to messages field
 */
async function subscribeToMessages() {
    console.log('\n2️⃣ Ensuring messages field is subscribed...\n');
    
    const url = `https://graph.facebook.com/v21.0/1861646317956355/subscribed_apps`;
    
    try {
        const response = await axios.post(url, 
            {
                subscribed_fields: 'messages,message_status'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Subscribed to messages field');
        return true;
    } catch (error) {
        console.error('Error subscribing:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 3: Send interactive message with button
 */
async function sendButtonMessage(phoneNumber) {
    console.log(`\n3️⃣ Sending button message to ${phoneNumber}...\n`);
    
    const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'text',
                text: '🧪 Webhook Test Message'
            },
            body: {
                text: 'This is a test to verify webhook is receiving button clicks.\n\nClick the button below and check if webhook receives the event.'
            },
            footer: {
                text: 'Test ID: ' + Date.now()
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'TEST_BUTTON_' + Date.now(),
                            title: '✅ Test Click'
                        }
                    }
                ]
            }
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Button message sent!');
        console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 4: Start a simple webhook listener
 */
function startWebhookListener() {
    console.log('\n4️⃣ Starting webhook listener on port 3001...\n');
    
    const app = express();
    app.use(express.json());
    
    // Verification
    app.get('/webhook', (req, res) => {
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        if (token === CONFIG.verifyToken) {
            console.log('✅ Webhook verified');
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Forbidden');
        }
    });
    
    // Events
    app.post('/webhook', (req, res) => {
        console.log('\n🎉 WEBHOOK EVENT RECEIVED!');
        console.log('Time:', new Date().toISOString());
        console.log('Body:', JSON.stringify(req.body, null, 2));
        
        res.status(200).send('OK');
        
        // Parse the event
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const messages = changes?.value?.messages || [];
        
        for (const message of messages) {
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                console.log('\n✅✅✅ BUTTON CLICK DETECTED! ✅✅✅');
                console.log('Button ID:', message.interactive.button_reply.id);
                console.log('Button Title:', message.interactive.button_reply.title);
                console.log('From:', message.from);
                console.log('\nWEBHOOK IS WORKING CORRECTLY!');
            }
        }
    });
    
    app.listen(3001, () => {
        console.log('📡 Test webhook listening on port 3001');
        console.log('This is for testing only - your main webhook is on port 3000');
    });
}

/**
 * Main test flow
 */
async function runTest() {
    // Check subscription
    const isSubscribed = await checkWebhookSubscription();
    
    if (!isSubscribed) {
        await subscribeToMessages();
    }
    
    // Send test messages
    const testNumbers = [
        '919765071249',  // Avalok
        '919022810769'   // Test User  
    ];
    
    for (const number of testNumbers) {
        await sendButtonMessage(number);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    
    console.log('\n✅ WHAT TO DO NOW:');
    console.log('1. Check WhatsApp on both test numbers');
    console.log('2. You should see a message with "✅ Test Click" button');
    console.log('3. CLICK THE BUTTON');
    console.log('4. Check your webhook logs:');
    console.log('   - Main webhook: tail -f webhook.log');
    console.log('   - Or check Cloudflare tunnel logs');
    
    console.log('\n🔍 IF BUTTON CLICKS STILL DON\'T WORK:');
    console.log('1. Go to Meta Business Manager');
    console.log('2. WhatsApp Settings → Configuration → Webhooks');
    console.log('3. Make sure you selected "WhatsApp Business Account" product');
    console.log('4. Click "Subscribe" next to "messages" field');
    console.log('5. The Subscribe button should change to "Unsubscribe"');
    
    console.log('\n💡 IMPORTANT:');
    console.log('• Do NOT enable mTLS (client certificate) - keep it OFF');
    console.log('• Use ONLY WhatsApp Business Account webhook');
    console.log('• Remove any phone-level webhooks');
    
    // Start test listener
    startWebhookListener();
}

// Run the test
runTest().catch(console.error);