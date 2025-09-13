#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendProductionTest() {
    console.log('🎯 PRODUCTION TEST - BULLETPROOF WEBHOOK\n');
    console.log('=' .repeat(60));
    
    try {
        const response = await axios.post(
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
                                { type: 'text', text: 'PRODUCTION TEST' },
                                { type: 'text', text: new Date().toLocaleTimeString() },
                                { type: 'text', text: 'Meta-Grade Engineering' }
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
        
        console.log('✅ Production test template sent!');
        console.log('   Message ID:', response.data.messages[0].id);
        
        console.log('\n🏗️ WEBHOOK FEATURES:');
        console.log('• Comprehensive logging of every step');
        console.log('• Production-grade error handling');
        console.log('• Automatic retry on failures');
        console.log('• Performance optimized delivery');
        console.log('• Meta engineering standards applied');
        
        console.log('\n📱 CONTENT DELIVERY:');
        console.log('When you click "Retrieve Content":');
        console.log('1. 📊 Market overview image');
        console.log('2. 📈 Market analysis text');
        console.log('3. 💼 Portfolio strategy image');  
        console.log('4. 💡 Investment strategy text');
        
        console.log('\n🔍 DEBUGGING:');
        console.log('Every action will be logged in detail');
        console.log('I will see exactly what happens');
        
        console.log('\n📱 CLICK THE BUTTON NOW!');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    }
}

sendProductionTest().catch(console.error);