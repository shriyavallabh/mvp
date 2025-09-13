#!/usr/bin/env node

const axios = require('axios');

async function sendTestNow() {
    console.log('📱 SENDING TEST MESSAGE WITH CORRECT CREDENTIALS\n');
    
    const PHONE_ID = '574744175733556';  // CORRECT ID from .env
    const TOKEN = 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';
    
    try {
        console.log('Using Phone ID:', PHONE_ID);
        console.log('Sending to: 919765071249\n');
        
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'text',
                text: { body: '✅ SUCCESS! Your WhatsApp bot is NOW WORKING with AI responses!' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('🎉 MESSAGE SENT SUCCESSFULLY!');
        console.log('Message ID:', response.data.messages?.[0]?.id);
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('You should see the success message!');
        
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error || error.message);
    }
}

sendTestNow();
