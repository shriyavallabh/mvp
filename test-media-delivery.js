#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function testMediaDelivery() {
    console.log('🧪 TESTING MEDIA CONTENT DELIVERY\n');
    console.log('=' .repeat(60));
    
    // Step 1: Send utility template with button
    console.log('1️⃣ Sending utility template with button...');
    
    try {
        const templateResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Investment' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Market Analysis + Charts Ready' }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template sent successfully!');
        console.log('   Message ID:', templateResponse.data.messages[0].id);
        console.log('\n📱 CHECK YOUR WHATSAPP:');
        console.log('   Click "Retrieve Content" button');
        console.log('   You should receive:');
        console.log('   • Market chart image');
        console.log('   • Market analysis text');
        console.log('   • Portfolio allocation image');
        console.log('   • Investment strategy text');
        
    } catch (error) {
        console.log('❌ Template failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 2: Also test direct image sending
    console.log('\n2️⃣ Testing direct media delivery...');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send test image
    try {
        const imageResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'image',
                image: {
                    link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
                    caption: '📊 Test: Market Performance Chart\n\nIf you see this image, media delivery is working!'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Test image sent!');
        console.log('   Message ID:', imageResponse.data.messages[0].id);
        
    } catch (error) {
        console.log('❌ Image failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 3: Send test text
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        const textResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'text',
                text: { 
                    body: `🧪 *TEST MESSAGE*\n\n✅ If you see this, text delivery works!\n\n*When you click "Retrieve Content" button, you'll get:*\n• 2 images (charts)\n• 2 text messages (analysis)\n\nTotal: 4 messages in sequence`
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Test text sent!');
        console.log('   Message ID:', textResponse.data.messages[0].id);
        
    } catch (error) {
        console.log('❌ Text failed:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n✅ WHAT YOU SHOULD SEE:');
    console.log('1. Utility template with "Retrieve Content" button');
    console.log('2. Test image with caption');
    console.log('3. Test text message');
    
    console.log('\n🔘 WHEN YOU CLICK THE BUTTON:');
    console.log('The webhook should send:');
    console.log('• Image 1: Market chart');
    console.log('• Text 1: Market analysis');
    console.log('• Image 2: Portfolio chart');
    console.log('• Text 2: Investment strategy');
    
    console.log('\n⚠️  IF CONTENT NOT RECEIVED:');
    console.log('Check webhook logs:');
    console.log('ssh root@159.89.166.94');
    console.log('pm2 logs webhook --lines 50');
}

testMediaDelivery().catch(console.error);