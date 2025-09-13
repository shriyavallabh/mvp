#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function debugButtonClick() {
    console.log('🔍 DEBUG: BUTTON CLICK FLOW\n');
    console.log('=' .repeat(60));
    
    // Send template
    console.log('📱 Sending template with button...');
    
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
                                { type: 'text', text: 'DEBUG TEST' },
                                { type: 'text', text: new Date().toLocaleTimeString() },
                                { type: 'text', text: 'Click button to test' }
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
        
        console.log('✅ Template sent!');
        console.log('   Message ID:', response.data.messages[0].id);
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📌 NOW PLEASE:');
    console.log('1. Click the "Retrieve Content" button in WhatsApp');
    console.log('2. Tell me what happens');
    console.log('3. I\'m monitoring the webhook logs...');
    console.log('=' .repeat(60));
    
    // Also test if webhook is reachable
    console.log('\n🔧 Testing webhook endpoint...');
    
    try {
        const webhookTest = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 5000
        });
        console.log('✅ Webhook is reachable:', webhookTest.data.type);
    } catch (error) {
        console.log('❌ Webhook not reachable');
    }
    
    // Test direct POST to webhook
    console.log('\n🧪 Simulating button click event to webhook...');
    
    const simulatedEvent = {
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: CONFIG.recipientNumber,
                        type: 'interactive',
                        interactive: {
                            type: 'button_reply',
                            button_reply: {
                                id: 'RETRIEVE_CONTENT',
                                title: 'Retrieve Content'
                            }
                        }
                    }]
                }
            }]
        }]
    };
    
    try {
        const simulateResponse = await axios.post(
            'https://6ecac5910ac8.ngrok-free.app/webhook',
            simulatedEvent,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                timeout: 5000
            }
        );
        console.log('✅ Webhook accepted simulated event');
        console.log('   Check if you received content from simulation');
    } catch (error) {
        console.log('❌ Simulation failed:', error.message);
    }
}

debugButtonClick().catch(console.error);