#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

// Configuration
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '574744175733556',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249' // Your number
};

async function sendUtilityTemplate() {
    console.log('📱 SENDING UTILITY TEMPLATE MESSAGE\n');
    
    const url = `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: CONFIG.recipientNumber,
        type: 'template',
        template: {
            name: 'utility_update_2', // The template name from Meta
            language: {
                code: 'en_US'
            },
            components: [
                {
                    type: 'header',
                    parameters: [
                        {
                            type: 'text',
                            text: 'Daily Financial Insights'
                        }
                    ]
                },
                {
                    type: 'body',
                    parameters: [
                        {
                            type: 'text',
                            text: 'Market Update'
                        },
                        {
                            type: 'text',
                            text: new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })
                        }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: '0',
                    parameters: [
                        {
                            type: 'payload',
                            payload: 'UNLOCK_CONTENT'
                        }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: '1',
                    parameters: [
                        {
                            type: 'payload',
                            payload: 'SHARE_WITH_CLIENTS'
                        }
                    ]
                }
            ]
        }
    };

    try {
        console.log('📤 Sending to:', CONFIG.recipientNumber);
        console.log('Template: utility_update_2');
        console.log('Buttons: Unlock Content | Share with Clients\n');
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Template message sent');
        console.log('Message ID:', response.data.messages[0].id);
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('You should see:');
        console.log('- Header: "Daily Financial Insights"');
        console.log('- Body with market update and date');
        console.log('- Two buttons: "Unlock Content" and "Share with Clients"');
        console.log('\n🔘 Click "Unlock Content" to test the flow!');
        
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send template:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.message?.includes('template')) {
            console.log('\n💡 Template might not be approved or doesn\'t exist.');
            console.log('Check your Meta Business Manager for approved templates.');
        }
    }
}

// Run the function
sendUtilityTemplate().catch(console.error);
