#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendButtonTemplate() {
    console.log('📱 SENDING BUTTON TEMPLATE MESSAGE\n');
    
    const url = `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: CONFIG.recipientNumber,
        type: 'template',
        template: {
            name: 'daily_content_ready_v1',
            language: {
                code: 'en'
            }
        }
    };

    try {
        console.log('📤 Sending template: daily_content_ready_v1');
        console.log('   To:', CONFIG.recipientNumber);
        console.log('   Button: "Retrieve Content"\n');
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Template sent');
        console.log('Message ID:', response.data.messages[0].id);
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('You should see a message with:');
        console.log('- Content ready notification');
        console.log('- Button: "Retrieve Content"');
        console.log('\n🔘 Click the button to test the flow!');
        
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
    }
}

sendButtonTemplate();
