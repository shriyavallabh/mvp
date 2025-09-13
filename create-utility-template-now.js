#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    wabaId: '476293298899607',
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    userPhone: '919765071249'
};

console.log('🚀 CREATING UTILITY TEMPLATE WITH BUTTONS');
console.log('=========================================\n');

async function createUtilityTemplate() {
    console.log('📝 Creating UTILITY template with unlock buttons...\n');
    
    const templatePayload = {
        name: 'daily_unlock_content',
        category: 'UTILITY',
        language: 'en',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: '🎯 Your Daily Financial Content is Ready!'
            },
            {
                type: 'BODY',
                text: 'Hello {{1}}!\n\nYour personalized financial insights for today are ready. Click below to unlock:\n\n📊 Market Analysis\n📈 Stock Recommendations\n💰 Investment Tips\n\nChoose what you want to access:'
            },
            {
                type: 'FOOTER',
                text: 'Valid for today only'
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'QUICK_REPLY',
                        text: '📸 Unlock Images'
                    },
                    {
                        type: 'QUICK_REPLY',
                        text: '📝 Unlock Content'
                    },
                    {
                        type: 'QUICK_REPLY',
                        text: '📊 Market Updates'
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.wabaId}/message_templates`,
            templatePayload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template created successfully!');
        console.log('   Template ID:', response.data.id);
        console.log('   Name:', response.data.name);
        console.log('   Status:', response.data.status);
        console.log('\n⏳ Note: Template needs Meta approval (usually takes 1-24 hours)\n');
        
        return response.data;
        
    } catch (error) {
        if (error.response?.data?.error?.message?.includes('already exists')) {
            console.log('ℹ️  Template already exists, trying to send it...\n');
            return { name: 'daily_unlock_content', status: 'EXISTS' };
        }
        console.error('❌ Failed to create template:', error.response?.data || error.message);
        return null;
    }
}

async function sendUtilityTemplate() {
    console.log('📤 Sending UTILITY template with buttons to', CONFIG.userPhone);
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.userPhone,
                type: 'template',
                template: {
                    name: 'daily_unlock_content',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Investor' }
                            ]
                        },
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
        
        console.log('\n✅ UTILITY TEMPLATE SENT!');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('   You should see 3 buttons:');
        console.log('   1. 📸 Unlock Images');
        console.log('   2. 📝 Unlock Content');
        console.log('   3. 📊 Market Updates\n');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to send template:', error.response?.data || error.message);
        
        // Try sample_shipping_notification as fallback
        console.log('\n🔄 Trying fallback template...');
        return sendFallbackTemplate();
    }
}

async function sendFallbackTemplate() {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.userPhone,
                type: 'template',
                template: {
                    name: 'sample_shipping_notification',
                    language: { code: 'en_US' }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Fallback template sent (sample_shipping_notification)');
        console.log('   This template doesn\'t have buttons but confirms messaging works\n');
        return true;
        
    } catch (error) {
        console.error('❌ Fallback also failed:', error.response?.data || error.message);
        return false;
    }
}

async function main() {
    console.log('Starting UTILITY template creation and sending...\n');
    
    // Step 1: Create template
    const template = await createUtilityTemplate();
    
    // Step 2: Send template
    if (template) {
        await sendUtilityTemplate();
    }
    
    console.log('\n📊 NEXT STEPS:');
    console.log('1. If template was just created, wait for Meta approval');
    console.log('2. Once approved, the buttons will work');
    console.log('3. Click buttons to test the flow');
    console.log('4. The webhook will handle button clicks and send media\n');
    
    console.log('🔗 WEBHOOK: https://32fd26291272.ngrok-free.app/webhook');
    console.log('📋 LOGS: tail -f webhook.log\n');
}

main();