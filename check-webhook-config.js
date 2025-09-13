#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    businessAccountId: '1861646317956355',
    phoneNumberId: '574744175733556'
};

async function checkWebhookConfiguration() {
    console.log('🔍 CHECKING META WEBHOOK CONFIGURATION\n');
    console.log('=' .repeat(60));
    
    // Step 1: Check current webhook subscriptions
    console.log('1️⃣ Checking webhook subscriptions...');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v17.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        
        console.log('✅ Subscriptions found:');
        if (response.data.data && response.data.data.length > 0) {
            response.data.data.forEach(app => {
                console.log(`   App: ${app.name || app.id}`);
                console.log(`   Subscriptions:`, app.subscribed_fields || 'None');
            });
        } else {
            console.log('   ⚠️  No subscriptions found!');
        }
    } catch (error) {
        console.log('❌ Failed to check subscriptions:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 2: Subscribe to necessary webhook fields
    console.log('\n2️⃣ Updating webhook subscriptions...');
    
    const requiredFields = ['messages', 'message_deliveries', 'message_reads'];
    
    try {
        const subscribeResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                subscribed_fields: requiredFields.join(',')
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Subscription updated successfully!');
        console.log('   Subscribed to:', requiredFields.join(', '));
        
    } catch (error) {
        console.log('⚠️  Subscription update failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 3: Verify webhook URL
    console.log('\n3️⃣ Testing webhook URL...');
    
    const webhookUrl = 'https://6ecac5910ac8.ngrok-free.app/webhook';
    
    try {
        const testResponse = await axios.get(
            `${webhookUrl}?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`,
            {
                headers: { 'ngrok-skip-browser-warning': 'true' },
                timeout: 5000
            }
        );
        
        if (testResponse.data === 'test123') {
            console.log('✅ Webhook URL verification successful!');
            console.log('   URL:', webhookUrl);
        } else {
            console.log('❌ Webhook verification failed');
        }
    } catch (error) {
        console.log('❌ Webhook URL not accessible:', error.message);
    }
    
    // Step 4: Send test template to trigger button
    console.log('\n4️⃣ Sending test template...');
    
    try {
        const templateResponse = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Webhook Test' },
                                { type: 'text', text: new Date().toLocaleTimeString() },
                                { type: 'text', text: 'Click to test webhook' }
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
        
        console.log('✅ Template sent! Click the button now.');
        console.log('   Message ID:', templateResponse.data.messages[0].id);
        
    } catch (error) {
        console.log('❌ Template failed:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 WEBHOOK TROUBLESHOOTING SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 POSSIBLE ISSUES:');
    console.log('1. Meta webhook subscriptions not configured properly');
    console.log('2. Webhook URL needs re-verification in Meta Business Manager');
    console.log('3. Button interaction events not subscribed');
    
    console.log('\n📱 NEXT STEPS:');
    console.log('1. Go to: https://business.facebook.com');
    console.log('2. Navigate: WhatsApp > Configuration > Webhook');
    console.log('3. Verify webhook URL and token');
    console.log('4. Ensure these fields are checked:');
    console.log('   • messages');
    console.log('   • message_deliveries');
    console.log('   • message_reads');
    
    console.log('\n🔘 TEST:');
    console.log('Click the button in the template I just sent');
    console.log('Check if webhook logs show button click event');
}

checkWebhookConfiguration().catch(console.error);