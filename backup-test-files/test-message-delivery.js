const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * TEST: Why messages aren't delivering
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔍 TESTING MESSAGE DELIVERY\n');

async function sendSimpleMessage(phoneNumber) {
    console.log(`Sending to ${phoneNumber}...`);
    
    const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: 'Test button - click below'
            },
            action: {
                buttons: [{
                    type: 'reply',
                    reply: {
                        id: 'TEST_' + Date.now(),
                        title: 'Click Me'
                    }
                }]
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
        
        console.log(`✅ Sent - Message ID: ${response.data.messages?.[0]?.id}`);
        console.log(`   Contact ID: ${response.data.contacts?.[0]?.wa_id || 'N/A'}`);
        
        // Check message status
        if (response.data.messages?.[0]?.message_status) {
            console.log(`   Status: ${response.data.messages[0].message_status}`);
        }
        
        return response.data;
    } catch (error) {
        console.error(`❌ Failed:`, error.response?.data?.error || error.message);
        return null;
    }
}

async function main() {
    // Test multiple numbers
    const numbers = [
        '919765071249',  // Avalok
        '919022810769',  // Test user
        '917666684471'   // The phone number itself (self-test)
    ];
    
    for (const number of numbers) {
        await sendSimpleMessage(number);
        console.log('---');
    }
    
    console.log('\n📱 CHECK ALL THREE NUMBERS');
    console.log('If messages arrive on other numbers but not 919765071249,');
    console.log('it might be a number-specific issue (blocked, not opted in, etc.)');
    
    console.log('\n🔍 MONITOR WEBHOOK:');
    console.log('tail -f webhook.log');
    console.log('\nClick ANY button that arrives to test webhook');
}

main().catch(console.error);