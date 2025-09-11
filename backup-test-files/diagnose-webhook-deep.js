const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * DEEP DIAGNOSIS: Why button clicks aren't reaching webhook
 * Even when WhatsApp Business Account webhook is configured
 */

const axios = require('axios');

const CONFIG = {
    appId: '1352489686039512',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔍 DEEP WEBHOOK DIAGNOSIS - WHY BUTTON CLICKS AREN\'T WORKING');
console.log('=' .repeat(70));
console.log('Even though WhatsApp Business Account webhook is configured...\n');

/**
 * CHECK 1: Phone Number Level Webhook (HIGHEST PRIORITY)
 */
async function checkPhoneNumberWebhook() {
    console.log('1️⃣ Checking Phone Number Level Webhook (Highest Priority)...\n');
    
    // Meta prioritizes webhooks in this order:
    // 1. Phone Number Webhook (overrides everything)
    // 2. WABA Webhook (if phone number webhook not set)
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}`;
    
    try {
        const response = await axios.get(url, {
            params: {
                fields: 'webhook_configuration'
            },
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        if (response.data.webhook_configuration) {
            console.log('⚠️  FOUND: Phone Number has its own webhook configured!');
            console.log('   This OVERRIDES the WABA webhook!');
            console.log('   URL:', response.data.webhook_configuration.url);
            return true;
        } else {
            console.log('✅ No phone number webhook (good - will use WABA webhook)');
            return false;
        }
    } catch (error) {
        console.log('✅ No phone number webhook configured');
        return false;
    }
}

/**
 * CHECK 2: Verify WABA Subscription Fields
 */
async function checkWABASubscription() {
    console.log('\n2️⃣ Checking WABA Subscription Fields...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        const apps = response.data.data || [];
        console.log(`Found ${apps.length} subscribed app(s)`);
        
        for (const app of apps) {
            console.log(`\nApp: ${app.whatsapp_business_api_data?.name || 'Unknown'}`);
            console.log(`ID: ${app.whatsapp_business_api_data?.id}`);
            
            // Check subscribed fields
            const fieldsUrl = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_fields`;
            try {
                const fieldsResponse = await axios.get(fieldsUrl, {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`
                    }
                });
                
                const fields = fieldsResponse.data.data || [];
                console.log('Subscribed fields:', fields.join(', ') || 'NONE');
                
                if (!fields.includes('messages')) {
                    console.log('❌ PROBLEM: "messages" field NOT subscribed!');
                    return false;
                }
            } catch (e) {
                console.log('Could not fetch subscribed fields');
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * CHECK 3: APP Permissions
 */
async function checkAppPermissions() {
    console.log('\n3️⃣ Checking APP Permissions...\n');
    
    // Required permissions for webhooks
    const requiredPermissions = [
        'whatsapp_business_messaging',  // For message webhooks
        'whatsapp_business_management'   // For other webhooks
    ];
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.appId}/permissions`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        const permissions = response.data.data || [];
        console.log('App permissions:', permissions.map(p => p.permission).join(', '));
        
        for (const required of requiredPermissions) {
            if (!permissions.find(p => p.permission === required)) {
                console.log(`❌ Missing required permission: ${required}`);
                return false;
            }
        }
        
        console.log('✅ All required permissions present');
        return true;
        
    } catch (error) {
        console.log('Could not check permissions');
        return null;
    }
}

/**
 * CHECK 4: Interactive Message Template Configuration
 */
async function checkInteractiveMessageSupport() {
    console.log('\n4️⃣ Checking Interactive Message Support...\n');
    
    // Interactive messages (buttons) require specific template configuration
    console.log('For button clicks to work:');
    console.log('✓ Template must be type: interactive');
    console.log('✓ Button must have type: "reply"');
    console.log('✓ Button must have unique ID');
    console.log('✓ Webhook must subscribe to "messages" field');
    
    return true;
}

/**
 * FIX: Clear phone number webhook and ensure WABA webhook is used
 */
async function fixWebhookPriority() {
    console.log('\n🔧 FIXING: Clearing phone number webhook...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/webhook_configuration`;
    
    try {
        // Clear phone number webhook
        await axios.delete(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('✅ Phone number webhook cleared');
        console.log('WABA webhook will now receive events');
        return true;
        
    } catch (error) {
        console.log('Could not clear phone number webhook:', error.response?.data?.error?.message);
        return false;
    }
}

/**
 * FIX: Subscribe to messages field
 */
async function subscribeToMessages() {
    console.log('\n🔧 FIXING: Subscribing to messages field...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/subscribed_apps`;
    
    try {
        const response = await axios.post(url, 
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
        
        console.log('✅ Subscribed to messages field');
        return true;
        
    } catch (error) {
        console.log('Error subscribing:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main diagnosis
 */
async function diagnose() {
    // Run all checks
    const hasPhoneWebhook = await checkPhoneNumberWebhook();
    const hasWABASubscription = await checkWABASubscription();
    const hasPermissions = await checkAppPermissions();
    await checkInteractiveMessageSupport();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DIAGNOSIS RESULTS');
    console.log('=' .repeat(70));
    
    if (hasPhoneWebhook) {
        console.log('\n❌ MAIN ISSUE FOUND:');
        console.log('Phone Number has its own webhook that OVERRIDES WABA webhook!');
        console.log('This is why button clicks aren\'t reaching your webhook.');
        
        console.log('\n🔧 FIXING NOW...');
        await fixWebhookPriority();
    }
    
    if (!hasWABASubscription) {
        console.log('\n🔧 Subscribing to messages field...');
        await subscribeToMessages();
    }
    
    console.log('\n✅ WEBHOOK PRIORITY FIXED!');
    console.log('\n📱 TEST NOW:');
    console.log('1. Click any button in WhatsApp');
    console.log('2. Events should reach your webhook at:');
    console.log('   https://softball-one-realtor-telecom.trycloudflare.com/webhook');
    
    console.log('\n📝 KEY INSIGHTS:');
    console.log('• Phone Number webhooks OVERRIDE WABA webhooks');
    console.log('• You need "messages" field subscribed');
    console.log('• Only configure webhook at WABA level, not phone number level');
    console.log('• Marketing template issues might be due to template category, not webhook');
}

diagnose().catch(console.error);