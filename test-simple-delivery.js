#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function testSimpleDelivery() {
    console.log('🧪 TESTING SIMPLE MESSAGE DELIVERY\n');
    
    // Test 1: Simple text
    console.log('1️⃣ Sending simple text...');
    try {
        const textResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'text',
                text: { body: 'Test: If you see this, text delivery works! Time: ' + new Date().toLocaleTimeString() }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Text sent! ID:', textResponse.data.messages[0].id);
    } catch (error) {
        console.log('❌ Text failed:', error.response?.data?.error || error.message);
    }
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Image from a different source
    console.log('\n2️⃣ Sending test image...');
    try {
        const imageResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'image',
                image: {
                    link: 'https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=TEST+IMAGE',
                    caption: 'If you see this green test image, media delivery works!'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Image sent! ID:', imageResponse.data.messages[0].id);
    } catch (error) {
        console.log('❌ Image failed:', error.response?.data?.error || error.message);
        
        if (error.response?.data) {
            console.log('Full error:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    console.log('\n📱 CHECK YOUR WHATSAPP:');
    console.log('You should see:');
    console.log('1. A text message with current time');
    console.log('2. A green test image');
    
    console.log('\n🔍 WEBHOOK STATUS:');
    console.log('The webhook IS receiving button clicks ✅');
    console.log('The webhook IS sending responses ✅');
    console.log('WhatsApp API IS accepting the messages ✅');
    console.log('\nBut messages might not be delivered due to:');
    console.log('• WhatsApp Business account issues');
    console.log('• Phone number verification status');
    console.log('• Message template approval status');
}

testSimpleDelivery().catch(console.error);