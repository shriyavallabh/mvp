#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    userPhone: '919765071249' // India country code + your number
};

console.log('📱 SENDING TEST MESSAGE TO USER');
console.log('================================\n');

async function sendUtilityTemplate() {
    console.log(`📤 Sending UTILITY template to ${CONFIG.userPhone}...`);
    console.log('   Template: unlock_daily_content');
    console.log('   Buttons: UNLOCK_IMAGES, UNLOCK_CONTENT, UNLOCK_UPDATES\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.userPhone,
                type: 'template',
                template: {
                    name: 'unlock_daily_content',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '0',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_IMAGES' }]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '1',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_CONTENT' }]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '2',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_UPDATES' }]
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
        
        console.log('✅ SUCCESS! Template sent');
        console.log('📊 Response details:');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('   Status:', response.data.messages[0].message_status || 'sent');
        console.log('\n📲 CHECK YOUR WHATSAPP!');
        console.log('   You should see a message with 3 buttons:');
        console.log('   • 📸 Unlock Images');
        console.log('   • 📝 Unlock Content');
        console.log('   • 📊 Unlock Updates\n');
        
        console.log('🔔 When you click any button:');
        console.log('   - The webhook at https://32fd26291272.ngrok-free.app will receive the event');
        console.log('   - It will send you the appropriate response based on button clicked\n');
        
        return true;
    } catch (error) {
        console.error('❌ FAILED TO SEND!');
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
            
            // Common error explanations
            if (error.response.data.error) {
                const errorCode = error.response.data.error.code;
                const errorMessage = error.response.data.error.message;
                
                console.log('\n⚠️  Error Analysis:');
                
                if (errorCode === 131030) {
                    console.log('   Template not found or not approved');
                    console.log('   Solution: Check if "unlock_daily_content" template exists and is approved');
                } else if (errorCode === 100) {
                    console.log('   Invalid parameter or phone number');
                    console.log('   Solution: Verify phone number format and WhatsApp registration');
                } else if (errorCode === 190) {
                    console.log('   Access token issue');
                    console.log('   Solution: Token may be expired or invalid');
                } else {
                    console.log(`   Error ${errorCode}: ${errorMessage}`);
                }
            }
        } else {
            console.error('Network error:', error.message);
        }
        return false;
    }
}

async function sendSimpleTextMessage() {
    console.log('\n📝 Sending simple text message as fallback...');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.userPhone,
                type: 'text',
                text: { 
                    body: '🎯 Story 3.2 Test Message\n\n' +
                          'Hello! This is a test from the Story 3.2 webhook system.\n\n' +
                          '✅ Webhook URL: https://32fd26291272.ngrok-free.app/webhook\n' +
                          '✅ Features: Button handlers, Media delivery, Chat responses\n\n' +
                          'Reply to this message to test the intelligent chat system!'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Text message sent successfully!');
        console.log('   Message ID:', response.data.messages[0].id);
        return true;
    } catch (error) {
        console.error('❌ Failed to send text message:', error.response?.data || error.message);
        return false;
    }
}

async function main() {
    console.log('Starting message delivery to 9765071249...\n');
    
    // Try UTILITY template first
    const templateSent = await sendUtilityTemplate();
    
    // If template fails, send text message
    if (!templateSent) {
        console.log('\n🔄 Template failed, trying text message...');
        await sendSimpleTextMessage();
    }
    
    console.log('\n📌 WEBHOOK STATUS:');
    console.log('   The webhook is listening at: https://32fd26291272.ngrok-free.app/webhook');
    console.log('   When you interact with the message, check webhook logs with:');
    console.log('   tail -f webhook.log\n');
}

// Run the test
main();