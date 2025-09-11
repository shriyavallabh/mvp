const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FIX: Properly subscribe webhook with fields
 * The issue is that fields aren't actually subscribed despite UI showing they are
 */

const axios = require('axios');

const CONFIG = {
    appId: '1352489686039512',  // From the subscription response
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔧 FIXING WEBHOOK SUBSCRIPTION WITH FIELDS');
console.log('=' .repeat(70));
console.log('Issue: Subscription exists but fields array is missing');
console.log('This means Meta thinks webhook is subscribed but no fields are active\n');

/**
 * Method 1: Unsubscribe and resubscribe
 */
async function unsubscribeAndResubscribe() {
    console.log('1️⃣ Method 1: Unsubscribe first, then resubscribe with fields...\n');
    
    // First unsubscribe
    console.log('   Unsubscribing...');
    try {
        await axios.delete(
            `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        console.log('   ✅ Unsubscribed');
    } catch (error) {
        console.log('   ⚠️  Unsubscribe failed (might not be subscribed)');
    }
    
    // Wait a moment
    await new Promise(r => setTimeout(r, 2000));
    
    // Now resubscribe with fields
    console.log('   Subscribing with fields...');
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                subscribed_fields: ['messages', 'message_status', 'message_template_status_update']
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('   ✅ Subscribed with fields');
        console.log('   Response:', response.data);
    } catch (error) {
        console.error('   ❌ Subscribe failed:', error.response?.data || error.message);
    }
}

/**
 * Method 2: Subscribe via App Subscriptions endpoint
 */
async function subscribeViaAppEndpoint() {
    console.log('\n2️⃣ Method 2: Subscribe via App Subscriptions endpoint...\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.appId}/subscriptions`,
            {
                object: 'whatsapp_business_account',
                callback_url: 'https://softball-one-realtor-telecom.trycloudflare.com/webhook',
                fields: 'messages,message_status,message_template_status_update',
                verify_token: 'jarvish_webhook_2024',
                include_values: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('   ✅ Subscribed via app endpoint');
        console.log('   Response:', response.data);
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data || error.message);
    }
}

/**
 * Method 3: Direct WABA subscription with explicit fields
 */
async function directWABASubscription() {
    console.log('\n3️⃣ Method 3: Direct WABA subscription with comma-separated fields...\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                subscribed_fields: 'messages,message_status,message_template_status_update,message_echoes'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('   ✅ Subscribed with comma-separated fields');
        console.log('   Response:', response.data);
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data || error.message);
    }
}

/**
 * Verify subscription
 */
async function verifySubscription() {
    console.log('\n4️⃣ Verifying subscription...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        
        const apps = response.data.data || [];
        if (apps.length > 0) {
            console.log('✅ Subscription found:');
            console.log(JSON.stringify(apps[0], null, 2));
            
            if (apps[0].subscribed_fields && apps[0].subscribed_fields.length > 0) {
                console.log('\n🎉 SUCCESS! Fields are now subscribed:');
                console.log('   ', apps[0].subscribed_fields.join(', '));
            } else {
                console.log('\n⚠️  Subscription exists but no fields listed');
            }
        } else {
            console.log('❌ No subscription found');
        }
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Send test message
 */
async function sendTestMessage() {
    console.log('\n5️⃣ Sending test message with button...\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: `Webhook Fix Test - ${new Date().toLocaleTimeString()}`
                    },
                    action: {
                        buttons: [{
                            type: 'reply',
                            reply: {
                                id: 'FIX_TEST_' + Date.now(),
                                title: 'Test Webhook'
                            }
                        }]
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Test message sent');
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        console.log('\n📱 Click the button and check: tail -f webhook.log');
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
    }
}

/**
 * Main fix flow
 */
async function main() {
    // Try all methods
    await unsubscribeAndResubscribe();
    await subscribeViaAppEndpoint();
    await directWABASubscription();
    
    // Verify
    await verifySubscription();
    
    // Test
    await sendTestMessage();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    
    console.log('\n✅ Tried multiple subscription methods');
    console.log('📱 Test message sent - click the button');
    console.log('📝 Monitor webhook: tail -f webhook.log');
    
    console.log('\n💡 IF STILL NOT WORKING:');
    console.log('1. In Meta Business Manager, manually:');
    console.log('   - Remove the webhook URL completely');
    console.log('   - Save (with empty webhook)');
    console.log('   - Re-add the webhook URL');
    console.log('   - Verify and save');
    console.log('   - Click "Subscribe" on each field');
    console.log('2. The issue might be Meta caching the old configuration');
    console.log('3. Try using a different webhook URL temporarily to force refresh');
}

main().catch(console.error);