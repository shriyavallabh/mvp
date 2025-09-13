#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendFinalTest() {
    console.log('🎯 FINAL TEST - FULL MEDIA CONTENT\n');
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
                                { type: 'text', text: 'Premium Content' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Media + Analysis Ready!' }
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
        
        console.log('✅ Final template sent!');
        console.log('   Message ID:', response.data.messages[0].id);
        
        console.log('\n🎬 WHEN YOU CLICK "RETRIEVE CONTENT":');
        console.log('You will receive 6 messages:');
        console.log('1. 📊 Market overview chart');
        console.log('2. 📈 Market analysis text');
        console.log('3. 💼 Portfolio strategy chart');
        console.log('4. 💡 Investment tips text');
        console.log('5. 📈 Sectoral trends chart');
        console.log('6. 🌟 Sectoral insights text');
        console.log('\n🔧 Technical fixes applied:');
        console.log('• ✅ Fixed webhook subscriptions');
        console.log('• ✅ Restored full media content');
        console.log('• ✅ Added proper delays between messages');
        console.log('• ✅ Enhanced error handling');
        
        console.log('\n📱 NOW CLICK THE BUTTON!');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    }
}

sendFinalTest().catch(console.error);