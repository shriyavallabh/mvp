const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL VERIFICATION TEST
 * Now that fields are subscribed, test if button clicks work
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n✅ FINAL VERIFICATION TEST');
console.log('=' .repeat(70));
console.log('You confirmed: messages field is subscribed and tested');
console.log('Now testing if button clicks reach your webhook...\n');

/**
 * Send button message
 */
async function sendButtonTest() {
    console.log('📱 Sending button message to 919765071249 (Avalok)...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'text',
                text: '🎉 Webhook Working Test'
            },
            body: {
                text: `Great news! Your webhook fields are subscribed.

This is the final test to verify button clicks are working.

Test Time: ${new Date().toLocaleTimeString()}
API Version: v23.0
Fields: messages ✅`
            },
            footer: {
                text: 'Click to verify webhook'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'FINAL_VERIFY_' + Date.now(),
                            title: '✅ Test Click'
                        }
                    }
                ]
            }
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Button message sent successfully!');
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        console.log('   Status:', response.data.messages?.[0]?.message_status || 'sent');
        return true;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data?.error || error.message);
        return false;
    }
}

/**
 * Send text message for reply test
 */
async function sendTextTest() {
    console.log('\n📝 Sending text message for reply test...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'text',
        text: {
            body: 'Reply "YES" to this message to test webhook text reception.\n\nTime: ' + new Date().toLocaleTimeString()
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
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
 * Main test
 */
async function main() {
    // Send both tests
    await sendButtonTest();
    await sendTextTest();
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 ACTION REQUIRED');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣ CHECK WHATSAPP:');
    console.log('   - Open WhatsApp on 919765071249');
    console.log('   - You should see 2 messages');
    
    console.log('\n2️⃣ TEST ACTIONS:');
    console.log('   a) Click the "✅ Test Click" button');
    console.log('   b) Reply "YES" to the text message');
    
    console.log('\n3️⃣ MONITOR WEBHOOK:');
    console.log('   In another terminal, run:');
    console.log('   tail -f webhook.log');
    
    console.log('\n4️⃣ EXPECTED RESULTS:');
    console.log('   When you click the button, you should see:');
    console.log('   - "WEBHOOK EVENT RECEIVED!"');
    console.log('   - Event type: interactive');
    console.log('   - Button ID: FINAL_VERIFY_[timestamp]');
    
    console.log('   When you reply "YES", you should see:');
    console.log('   - "WEBHOOK EVENT RECEIVED!"');
    console.log('   - Event type: text');
    console.log('   - Message body: "YES"');
    
    console.log('\n✅ SUCCESS CRITERIA:');
    console.log('   If webhook logs show these events, everything is working!');
    console.log('   The Click-to-Unlock strategy will function properly.');
    
    console.log('\n❌ IF NO EVENTS:');
    console.log('   1. Check Cloudflare tunnel is running');
    console.log('   2. Verify webhook server is on port 5001');
    console.log('   3. Check Meta sent test events successfully in their UI');
}

main().catch(console.error);