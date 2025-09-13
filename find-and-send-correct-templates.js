#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendTemplate() {
    console.log('📱 SENDING UTILITY TEMPLATE WITH BUTTON\n');
    
    const url = `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`;
    
    // Try daily_content_ready_v1 with parameters
    const payload = {
        messaging_product: 'whatsapp',
        to: CONFIG.recipientNumber,
        type: 'template',
        template: {
            name: 'daily_content_ready_v1',
            language: {
                code: 'en'
            },
            components: [
                {
                    type: 'body',
                    parameters: [
                        {
                            type: 'text',
                            text: 'Financial Markets'
                        },
                        {
                            type: 'text',
                            text: 'Friday, September 12, 2025'
                        },
                        {
                            type: 'text',
                            text: 'Market Analysis & Investment Opportunities'
                        }
                    ]
                }
            ]
        }
    };

    try {
        console.log('📤 Sending: daily_content_ready_v1');
        console.log('   With 3 parameters for body');
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
        console.log('You should see:');
        console.log('- Content notification with parameters');
        console.log('- Button: "Retrieve Content"');
        console.log('\n🔘 Click the button to test content delivery!');
        
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        
        // If that fails, try hello_world which is simpler
        if (error.response?.data?.error?.code === 132000) {
            console.log('\nTrying simpler template...\n');
            await sendHelloWorld();
        }
    }
}

async function sendHelloWorld() {
    const url = `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: CONFIG.recipientNumber,
        type: 'template',
        template: {
            name: 'hello_world',
            language: {
                code: 'en_US'
            }
        }
    };

    try {
        console.log('📤 Sending: hello_world template');
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Hello World template sent');
        console.log('Message ID:', response.data.messages[0].id);
        
    } catch (error) {
        console.error('❌ Hello World also failed:', error.response?.data?.error || error.message);
    }
}

sendTemplate();
