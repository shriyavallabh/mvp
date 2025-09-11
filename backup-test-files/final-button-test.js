const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL BUTTON TEST
 * Send a test button and monitor webhook response
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔘 FINAL BUTTON TEST');
console.log('=' .repeat(70));

async function sendButton(phoneNumber, name) {
    console.log(`\nSending button to ${name} (${phoneNumber})...`);
    
    const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'text',
                text: '🎯 Final Webhook Test'
            },
            body: {
                text: `Hello ${name}! This is the final test to verify webhook configuration.

Please click the button below to test if webhooks are working.

Test Time: ${new Date().toLocaleTimeString()}
Test ID: ${Date.now()}`
            },
            footer: {
                text: 'Your Jarvis Daily Assistant'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: `FINAL_TEST_${Date.now()}`,
                            title: '✅ Click Me!'
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
        
        console.log('✅ Button sent successfully!');
        console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
        console.log(`   Status: ${response.data.messages?.[0]?.message_status || 'sent'}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data?.error || error.message);
        return false;
    }
}

async function checkWebhookHealth() {
    console.log('\n🏥 Checking webhook health...');
    
    try {
        const response = await axios.get('http://localhost:5001/health');
        console.log('✅ Webhook is healthy!');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Service: ${response.data.service}`);
        return true;
    } catch (error) {
        console.error('❌ Webhook health check failed:', error.message);
        return false;
    }
}

async function main() {
    // Check webhook health
    await checkWebhookHealth();
    
    // Send test buttons
    const recipients = [
        { number: '919765071249', name: 'Avalok' },
        { number: '919022810769', name: 'Test User' }
    ];
    
    for (const recipient of recipients) {
        await sendButton(recipient.number, recipient.name);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between sends
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📋 WHAT TO DO NOW:');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣ CHECK WHATSAPP:');
    console.log('   - Open WhatsApp on both phones');
    console.log('   - You should see a message with "✅ Click Me!" button');
    console.log('   - CLICK THE BUTTON');
    
    console.log('\n2️⃣ MONITOR WEBHOOK:');
    console.log('   In another terminal, run:');
    console.log('   tail -f webhook.log');
    
    console.log('\n3️⃣ IF BUTTON CLICKS DON\'T WORK:');
    console.log('   Follow the guide in WEBHOOK_PROBLEM_FOUND.md');
    console.log('   The issues are:');
    console.log('   - Phone-level webhook is overriding WABA webhook');
    console.log('   - Messages field is not subscribed');
    
    console.log('\n4️⃣ EXPECTED RESULT:');
    console.log('   When you click the button, webhook.log should show:');
    console.log('   "WEBHOOK EVENT RECEIVED!"');
    console.log('   "BUTTON CLICK DETECTED!"');
    
    console.log('\n🔍 DIAGNOSTIC COMMAND:');
    console.log('   node check-webhook-hierarchy.js');
    console.log('   (Run this to verify configuration)');
}

main().catch(console.error);