#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function testDirectAPI() {
    console.log('🧪 TESTING DIRECT API (bypassing webhook)\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'text',
                text: { 
                    body: `🔥 DIRECT API TEST - ${new Date().toLocaleTimeString()}

If you see this message, the API is working fine!

The issue is either:
1. Button clicks not reaching webhook
2. Webhook response being blocked

Please confirm if you see THIS message.` 
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Direct API call successful!');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('\n📱 Check if you received the direct message');
        console.log('   This bypasses the webhook completely');
        
    } catch (error) {
        console.log('❌ Direct API failed:', error.response?.data?.error?.message || error.message);
        
        if (error.response?.data) {
            console.log('Full error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDirectAPI().catch(console.error);