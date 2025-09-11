const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * DEBUG: Why webhook isn't receiving events despite subscription
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔍 DEBUGGING WEBHOOK SUBSCRIPTION ISSUE');
console.log('=' .repeat(70));
console.log('You say fields are subscribed but webhook isn\'t receiving events.');
console.log('Let\'s investigate...\n');

/**
 * 1. Force re-subscribe to fields
 */
async function forceResubscribe() {
    console.log('1️⃣ Force re-subscribing to webhook fields...\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                subscribed_fields: 'messages,message_status,message_template_status_update'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Re-subscribed to fields successfully');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Re-subscribe failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 2. Check actual subscription status
 */
async function checkActualSubscription() {
    console.log('\n2️⃣ Checking actual subscription status from Meta...\n');
    
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
            console.log('✅ Webhook subscription found:');
            console.log(JSON.stringify(apps[0], null, 2));
            
            const fields = apps[0].subscribed_fields || [];
            if (fields.includes('messages')) {
                console.log('\n✅ "messages" field IS subscribed');
            } else {
                console.log('\n❌ "messages" field NOT in subscription list');
            }
        } else {
            console.log('❌ No subscription found');
        }
        
        return apps;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return [];
    }
}

/**
 * 3. Test webhook URL accessibility
 */
async function testWebhookUrl() {
    console.log('\n3️⃣ Testing if webhook URL is accessible...\n');
    
    const webhookUrl = 'https://softball-one-realtor-telecom.trycloudflare.com/webhook';
    
    try {
        // Test with the verification challenge
        const response = await axios.get(webhookUrl, {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'jarvish_webhook_2024',
                'hub.challenge': 'TEST_CHALLENGE_123'
            }
        });
        
        if (response.data === 'TEST_CHALLENGE_123') {
            console.log('✅ Webhook URL is accessible and responding correctly');
        } else {
            console.log('⚠️  Webhook responded but with unexpected data:', response.data);
        }
        return true;
    } catch (error) {
        console.error('❌ Webhook URL not accessible:', error.message);
        return false;
    }
}

/**
 * 4. Send a message and check delivery status
 */
async function sendAndCheckDelivery() {
    console.log('\n4️⃣ Sending test message to check delivery...\n');
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'text',
                text: {
                    body: `Webhook Debug Test\nTime: ${new Date().toISOString()}\nPlease reply "ok" to test webhook`
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Message sent');
        console.log('Message ID:', response.data.messages?.[0]?.id);
        console.log('\n📱 Please reply "ok" to this message in WhatsApp');
        
        return response.data.messages?.[0]?.id;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 5. Check webhook logs
 */
async function checkWebhookLogs() {
    console.log('\n5️⃣ Checking local webhook server...\n');
    
    try {
        const response = await axios.get('http://localhost:5001/health');
        console.log('✅ Webhook server is running');
        console.log('Health:', response.data);
    } catch (error) {
        console.error('❌ Webhook server not responding on port 5001');
    }
    
    try {
        const response = await axios.get('http://localhost:3000/health');
        console.log('✅ Alternative webhook on port 3000 is running');
    } catch (error) {
        console.log('ℹ️  No webhook on port 3000');
    }
}

/**
 * Main diagnosis
 */
async function diagnose() {
    // Force re-subscribe
    await forceResubscribe();
    
    // Check subscription
    const apps = await checkActualSubscription();
    
    // Test webhook URL
    const webhookAccessible = await testWebhookUrl();
    
    // Check local webhook
    await checkWebhookLogs();
    
    // Send test message
    const messageId = await sendAndCheckDelivery();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('=' .repeat(70));
    
    console.log('\n🔍 FINDINGS:');
    
    if (apps.length > 0 && apps[0].subscribed_fields?.includes('messages')) {
        console.log('✅ Webhook fields ARE subscribed in Meta');
    } else {
        console.log('❌ Webhook fields NOT properly subscribed');
    }
    
    if (webhookAccessible) {
        console.log('✅ Webhook URL is publicly accessible');
    } else {
        console.log('❌ Webhook URL not accessible from internet');
    }
    
    console.log('\n💡 POSSIBLE ISSUES:');
    console.log('1. Cloudflare tunnel might be blocking Meta\'s IPs');
    console.log('2. Webhook might be returning wrong HTTP status code');
    console.log('3. Meta might be caching old webhook configuration');
    console.log('4. The webhook verify token might be wrong');
    
    console.log('\n🛠️ NEXT STEPS:');
    console.log('1. Check Cloudflare tunnel logs: Look for incoming requests from Meta');
    console.log('2. Monitor webhook logs: tail -f webhook.log');
    console.log('3. Try removing and re-adding the webhook URL in Meta');
    console.log('4. Check if you\'re receiving ANY events (even delivery status)');
    
    console.log('\n📝 TEST NOW:');
    console.log('1. Reply to the message I just sent');
    console.log('2. Watch webhook logs for ANY incoming requests');
    console.log('3. Check Cloudflare tunnel dashboard for blocked requests');
}

diagnose().catch(console.error);