#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendOnlyTemplate() {
    console.log('📱 SENDING ONLY UTILITY TEMPLATE\n');
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
                                { type: 'text', text: 'Markets' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Fresh Analysis Available' }
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
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('\n📱 NOW:');
        console.log('1. Check WhatsApp for the utility message');
        console.log('2. Click "Retrieve Content" button');
        console.log('3. You should receive content from webhook');
        console.log('\n⚠️  NO other test messages will be sent');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    }
}

sendOnlyTemplate().catch(console.error);