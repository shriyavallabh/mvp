const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CHECK WEBHOOK HIERARCHY
 * Identifies where webhooks are configured in Meta's system
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
};

console.log('\n🔍 CHECKING WEBHOOK CONFIGURATION HIERARCHY');
console.log('=' .repeat(70));

/**
 * Check WABA level webhook subscription
 */
async function checkWABAWebhook() {
    console.log('\n1️⃣ Checking WABA Level Webhook...\n');
    
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
            console.log('✅ WABA has webhook subscription');
            console.log('   Subscribed fields:', apps[0].subscribed_fields || 'None');
            
            // Check if messages field is subscribed
            const hasMessages = apps[0].subscribed_fields?.includes('messages');
            if (hasMessages) {
                console.log('   ✅ "messages" field is subscribed (button clicks will work)');
            } else {
                console.log('   ❌ "messages" field NOT subscribed (button clicks won\'t work)');
            }
        } else {
            console.log('❌ No WABA webhook subscription found');
        }
        
        return apps;
    } catch (error) {
        console.error('Error:', error.response?.data?.error || error.message);
        return [];
    }
}

/**
 * Check phone number specific configuration
 */
async function checkPhoneWebhook() {
    console.log('\n2️⃣ Checking Phone Number Level Configuration...\n');
    
    try {
        // Get phone number details including webhook info
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}`,
            {
                params: {
                    fields: 'display_phone_number,verified_name,webhook_configuration'
                },
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        
        console.log(`Phone: ${response.data.display_phone_number}`);
        console.log(`Name: ${response.data.verified_name}`);
        
        if (response.data.webhook_configuration) {
            console.log('⚠️  Phone has its own webhook configuration!');
            console.log('   This OVERRIDES the WABA webhook!');
        } else {
            console.log('✅ No phone-level webhook (will use WABA webhook)');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data?.error || error.message);
        return null;
    }
}

/**
 * Test webhook with button message
 */
async function sendTestButton() {
    console.log('\n3️⃣ Sending Test Button Message...\n');
    
    const testNumber = '919765071249'; // Avalok
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: testNumber,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: '🔧 Webhook Hierarchy Test'
                    },
                    body: {
                        text: `Testing webhook configuration hierarchy.
                        
Time: ${new Date().toLocaleTimeString()}
Test ID: ${Date.now()}`
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: 'HIERARCHY_TEST_' + Date.now(),
                                    title: 'Test Click'
                                }
                            }
                        ]
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
        
        console.log('✅ Test button sent to', testNumber);
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data?.error || error.message);
        return false;
    }
}

/**
 * Main diagnosis
 */
async function diagnose() {
    // Check WABA webhook
    const wabaApps = await checkWABAWebhook();
    
    // Check phone webhook
    const phoneConfig = await checkPhoneWebhook();
    
    // Send test
    await sendTestButton();
    
    // Analysis
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DIAGNOSIS');
    console.log('=' .repeat(70));
    
    if (phoneConfig?.webhook_configuration) {
        console.log('\n❌ PROBLEM FOUND:');
        console.log('   Phone has its own webhook that OVERRIDES WABA webhook!');
        console.log('   Button clicks are going to the phone webhook, not your server.');
        console.log('\n   FIX: Remove phone-level webhook in Meta Business Manager');
    } else if (wabaApps.length === 0) {
        console.log('\n❌ PROBLEM FOUND:');
        console.log('   No WABA webhook subscription!');
        console.log('\n   FIX: Configure webhook at WABA level in Meta Business Manager');
    } else if (!wabaApps[0]?.subscribed_fields?.includes('messages')) {
        console.log('\n❌ PROBLEM FOUND:');
        console.log('   WABA webhook exists but "messages" field not subscribed!');
        console.log('\n   FIX: Subscribe to "messages" field in Meta Business Manager');
    } else {
        console.log('\n✅ Configuration looks correct!');
        console.log('   WABA webhook is configured and messages field is subscribed.');
        console.log('   Button clicks should work. Check your webhook logs.');
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Click the test button in WhatsApp');
    console.log('2. Check webhook logs: tail -f webhook.log');
    console.log('3. If no event received, fix configuration in Meta Business Manager');
}

// Run diagnosis
diagnose().catch(console.error);