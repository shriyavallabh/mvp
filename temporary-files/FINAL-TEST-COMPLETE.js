const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🎯 COMPLETE WEBHOOK TEST');
console.log('=' .repeat(70));
console.log('NEW TUNNEL URL: https://ya-trace-relying-franchise.trycloudflare.com');
console.log('You updated this in Meta: ✅\n');

async function testWebhook() {
    // 1. Test tunnel is accessible
    console.log('1️⃣ Testing tunnel accessibility...');
    try {
        const response = await axios.get('https://ya-trace-relying-franchise.trycloudflare.com/health');
        console.log('✅ Tunnel is working!');
        console.log('   Response:', response.data);
    } catch (error) {
        console.log('❌ Tunnel not accessible yet. Wait 10 seconds...');
    }
    
    // 2. Send button message
    console.log('\n2️⃣ Sending button message...');
    const numbers = ['919765071249', '919022810769'];
    
    for (const number of numbers) {
        try {
            const response = await axios.post(
                `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: number,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        header: {
                            type: 'text',
                            text: '🎉 WEBHOOK TEST FINAL'
                        },
                        body: {
                            text: `This should work now!
                            
New Tunnel: ya-trace-relying-franchise
Time: ${new Date().toLocaleTimeString()}

Click the button below to test webhook.`
                        },
                        action: {
                            buttons: [{
                                type: 'reply',
                                reply: {
                                    id: 'FINAL_TEST_' + Date.now(),
                                    title: '✅ Final Test'
                                }
                            }]
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
            
            console.log(`✅ Sent to ${number}`);
        } catch (error) {
            console.log(`❌ Failed to send to ${number}`);
        }
    }
}

testWebhook().then(() => {
    console.log('\n' + '=' .repeat(70));
    console.log('📱 ACTION REQUIRED:');
    console.log('=' .repeat(70));
    console.log('\n1. CHECK WHATSAPP - You should see the message');
    console.log('2. CLICK THE BUTTON "✅ Final Test"');
    console.log('3. WATCH THE WEBHOOK OUTPUT BELOW!');
    console.log('\nMonitoring webhook output...\n');
});