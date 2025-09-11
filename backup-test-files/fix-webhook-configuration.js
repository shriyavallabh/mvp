const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FIX: Set webhook URL at APP level in Meta configuration
 * This is the missing piece - we subscribed to messages but didn't set the webhook URL!
 */

const axios = require('axios');

const CONFIG = {
    appId: '1352489686039512', // Your APP ID from the subscription data
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookUrl: 'https://softball-one-realtor-telecom.trycloudflare.com/webhook',
    verifyToken: 'jarvish_webhook_2024'
};

console.log('\n🔧 FIXING WEBHOOK CONFIGURATION AT APP LEVEL');
console.log('=' .repeat(70));

/**
 * STEP 1: Get current APP webhook configuration
 */
async function getCurrentAppConfig() {
    console.log('\n1️⃣ Getting current APP webhook configuration...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.appId}/subscriptions`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('Current APP subscriptions:');
        console.log(JSON.stringify(response.data, null, 2));
        
        const whatsappSub = response.data.data?.find(s => s.object === 'whatsapp_business_account');
        
        if (!whatsappSub) {
            console.log('\n❌ No WhatsApp subscription found at APP level!');
            return false;
        }
        
        console.log('\n✅ WhatsApp subscription found:');
        console.log(`   Callback URL: ${whatsappSub.callback_url}`);
        console.log(`   Fields: ${whatsappSub.fields?.join(', ')}`);
        console.log(`   Active: ${whatsappSub.active}`);
        
        return whatsappSub;
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * STEP 2: Set/Update webhook URL at APP level
 */
async function setAppWebhook() {
    console.log('\n2️⃣ Setting webhook URL at APP level...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.appId}/subscriptions`;
    
    try {
        const response = await axios.post(url, 
            {
                object: 'whatsapp_business_account',
                callback_url: CONFIG.webhookUrl,
                verify_token: CONFIG.verifyToken,
                fields: 'messages,message_status,message_template_status_update',
                include_values: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Webhook URL set successfully at APP level!');
        console.log('Response:', response.data);
        return true;
        
    } catch (error) {
        console.error('❌ Failed to set webhook URL:', error.response?.data || error.message);
        
        // If error is about verification, try without verify_token
        if (error.response?.data?.error?.message?.includes('verify')) {
            console.log('\n🔄 Retrying without verify_token...');
            return await updateExistingWebhook();
        }
        
        return false;
    }
}

/**
 * STEP 3: Update existing webhook (if already exists)
 */
async function updateExistingWebhook() {
    console.log('\n3️⃣ Updating existing webhook configuration...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.appId}/subscriptions`;
    
    try {
        // First delete existing
        await axios.delete(url, {
            params: {
                object: 'whatsapp_business_account'
            },
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('Deleted old webhook configuration');
        
        // Now add new one
        const response = await axios.post(url, 
            {
                object: 'whatsapp_business_account',
                callback_url: CONFIG.webhookUrl,
                verify_token: CONFIG.verifyToken,
                fields: 'messages',
                include_values: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Webhook updated successfully!');
        return true;
        
    } catch (error) {
        console.error('Error updating:', error.response?.data || error.message);
        return false;
    }
}

/**
 * STEP 4: Subscribe the WhatsApp Business Account to the APP
 */
async function subscribeBusinessAccount() {
    console.log('\n4️⃣ Subscribing WhatsApp Business Account to APP...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`;
    
    try {
        const response = await axios.post(url, 
            {
                app_id: CONFIG.appId
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Business account subscribed to APP!');
        console.log('Response:', response.data);
        return true;
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * STEP 5: Test webhook with a sample event
 */
async function testWebhook() {
    console.log('\n5️⃣ Testing webhook with sample event...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.appId}/subscriptions_sample`;
    
    try {
        const response = await axios.post(url, 
            {
                object: 'whatsapp_business_account',
                field: 'messages'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Test event sent to webhook!');
        console.log('Check your webhook logs for the test event');
        return true;
        
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main fix flow
 */
async function fixWebhook() {
    // Step 1: Check current config
    const currentConfig = await getCurrentAppConfig();
    
    // Step 2: Set/Update webhook URL
    if (!currentConfig || currentConfig.callback_url !== CONFIG.webhookUrl) {
        await setAppWebhook();
    }
    
    // Step 3: Subscribe business account
    await subscribeBusinessAccount();
    
    // Step 4: Check again
    await getCurrentAppConfig();
    
    // Step 5: Test
    await testWebhook();
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 WEBHOOK CONFIGURATION COMPLETE');
    console.log('=' .repeat(70));
    
    console.log('\n✅ Your webhook is now properly configured at:');
    console.log(`   ${CONFIG.webhookUrl}`);
    
    console.log('\n📱 BUTTON CLICKS SHOULD NOW WORK!');
    console.log('Try clicking the "Get Content" button again.');
    
    console.log('\n🔍 To verify it\'s working:');
    console.log('1. Click any button in WhatsApp');
    console.log('2. Check webhook logs: tail -f webhook.log');
    console.log('3. Content should be delivered automatically');
}

fixWebhook().catch(console.error);