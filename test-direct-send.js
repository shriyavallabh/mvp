const axios = require('axios');

async function testDirectSend() {
    console.log('📱 TESTING DIRECT WHATSAPP SEND\n');
    
    const PHONE_ID = '574744175733556';
    const TOKEN = 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';
    
    const message = '🔍 DIRECT TEST: If you see this, WhatsApp API is working. Time: ' + new Date().toLocaleTimeString();
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        console.log('✅ SUCCESS! Message sent directly via API');
        console.log('Message ID:', response.data.messages?.[0]?.id);
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('You should see:', message);
        
    } catch (error) {
        console.log('❌ FAILED! API Error:');
        console.log(error.response?.data?.error || error.message);
        console.log('\nThis means the WhatsApp credentials are wrong or expired');
    }
}

testDirectSend();
