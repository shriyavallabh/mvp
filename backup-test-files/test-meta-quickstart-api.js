const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Test using Meta's Quick Start API example
 * This tests if webhooks are properly configured
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔬 TESTING META QUICK START API FLOW');
console.log('=' .repeat(70));

/**
 * 1. Send hello_world template (from Meta Quick Start)
 */
async function sendHelloWorldTemplate() {
    console.log('\n1️⃣ Sending hello_world template (Meta Quick Start example)...\n');
    
    const payload = { 
        messaging_product: "whatsapp", 
        to: "919765071249", 
        type: "template", 
        template: { 
            name: "hello_world", 
            language: { 
                code: "en_US" 
            } 
        } 
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template sent successfully!');
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        return false;
    }
}

/**
 * 2. Send a text message to test webhook
 */
async function sendTextMessage() {
    console.log('\n2️⃣ Sending text message to test webhook...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'text',
        text: {
            body: 'Reply to this message to test if webhook receives it.\n\nTime: ' + new Date().toLocaleTimeString()
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
        
        console.log('✅ Text message sent!');
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        return false;
    }
}

/**
 * 3. Check webhook subscription fields
 */
async function checkSubscriptionFields() {
    console.log('\n3️⃣ Checking WABA webhook subscription fields...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/1861646317956355/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        
        const apps = response.data.data || [];
        if (apps.length > 0) {
            const fields = apps[0].subscribed_fields || [];
            console.log('📋 Subscribed fields:', fields.length > 0 ? fields.join(', ') : 'NONE');
            
            // Check critical fields
            const requiredFields = ['messages', 'message_status'];
            const missingFields = requiredFields.filter(f => !fields.includes(f));
            
            if (missingFields.length > 0) {
                console.log('❌ Missing critical fields:', missingFields.join(', '));
                console.log('\n   FIX: In Meta Business Manager, subscribe to these fields');
            } else {
                console.log('✅ All critical fields are subscribed');
            }
            
            return fields;
        } else {
            console.log('❌ No webhook subscription found!');
            return [];
        }
    } catch (error) {
        console.error('Error:', error.response?.data?.error || error.message);
        return [];
    }
}

/**
 * 4. Send interactive button to test
 */
async function sendInteractiveButton() {
    console.log('\n4️⃣ Sending interactive button message...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: 'Test webhook button click detection'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'TEST_WEBHOOK_' + Date.now(),
                            title: 'Test Click'
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
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        return false;
    }
}

/**
 * Main test flow
 */
async function main() {
    // Check subscription first
    const fields = await checkSubscriptionFields();
    
    // Send test messages
    await sendHelloWorldTemplate();
    await sendTextMessage();
    await sendInteractiveButton();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 ANALYSIS');
    console.log('=' .repeat(70));
    
    if (!fields.includes('messages')) {
        console.log('\n❌ MAIN ISSUE: "messages" field is NOT subscribed!');
        console.log('\nTO FIX:');
        console.log('1. Go to Meta Business Manager');
        console.log('2. Navigate to WhatsApp Settings → Configuration → Webhooks');
        console.log('3. You should see a list of fields with "Subscribe/Unsubscribe" buttons');
        console.log('4. Find "messages" field and click "Subscribe"');
        console.log('5. It should change to show "Unsubscribe" (meaning it\'s now active)');
    } else {
        console.log('\n✅ Webhook configuration looks correct!');
        console.log('Messages field is subscribed.');
    }
    
    console.log('\n📱 TEST ACTIONS:');
    console.log('1. Check WhatsApp for the messages sent');
    console.log('2. Reply to the text message');
    console.log('3. Click the "Test Click" button');
    console.log('4. Monitor webhook: tail -f webhook.log');
    
    console.log('\n🔍 WEBHOOK SHOULD RECEIVE:');
    console.log('- Delivery status updates (message_status)');
    console.log('- User replies (messages)');
    console.log('- Button clicks (messages with type=interactive)');
    
    console.log('\n💡 KEY INSIGHT:');
    console.log('The webhook URL configured at WABA level applies to ALL phone numbers');
    console.log('under that WABA. Each message identifies its source via phone_number_id.');
    console.log('Your webhook at port 5001 should receive ALL events for ALL numbers.');
}

main().catch(console.error);