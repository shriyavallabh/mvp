const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CHECK: Correct API version for webhook
 * Meta has different API versions (v21.0, v22.0, v23.0)
 * Let's ensure we're using the right one
 */

const axios = require('axios');

const CONFIG = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔍 API VERSION CHECK FOR WEBHOOK');
console.log('=' .repeat(70));

/**
 * Test different API versions
 */
async function testAPIVersions() {
    const versions = ['v21.0', 'v22.0', 'v23.0'];
    
    for (const version of versions) {
        console.log(`\n📌 Testing ${version}...`);
        
        try {
            // Check subscription with this version
            const response = await axios.get(
                `https://graph.facebook.com/${version}/${CONFIG.businessAccountId}/subscribed_apps`,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`
                    }
                }
            );
            
            console.log(`✅ ${version} works`);
            const apps = response.data.data || [];
            if (apps.length > 0) {
                console.log('   Subscription found');
                if (apps[0].subscribed_fields) {
                    console.log('   Fields:', apps[0].subscribed_fields.join(', '));
                } else {
                    console.log('   ⚠️  No fields array');
                }
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log(`❌ ${version} - Invalid version or deprecated`);
            } else {
                console.log(`⚠️  ${version} - Error:`, error.response?.data?.error?.message || error.message);
            }
        }
    }
}

/**
 * Subscribe with latest version
 */
async function subscribeWithLatestVersion() {
    console.log('\n🚀 Subscribing with v22.0 (latest stable)...\n');
    
    try {
        // Unsubscribe first
        await axios.delete(
            `https://graph.facebook.com/v22.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        console.log('   Unsubscribed old webhook');
    } catch (e) {
        // Ignore if not subscribed
    }
    
    // Subscribe with v22.0
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                subscribed_fields: 'messages,message_status,message_template_status_update,messages_feedback'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('   ✅ Subscribed with v22.0');
        console.log('   Response:', response.data);
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data || error.message);
    }
    
    // Verify
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/${CONFIG.businessAccountId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                }
            }
        );
        
        const apps = response.data.data || [];
        if (apps[0]?.subscribed_fields) {
            console.log('\n   🎉 SUCCESS! Fields subscribed:', apps[0].subscribed_fields.join(', '));
        } else {
            console.log('\n   ⚠️  Still no fields - manual fix required');
        }
    } catch (error) {
        console.error('   Verify failed:', error.response?.data || error.message);
    }
}

/**
 * Main check
 */
async function main() {
    await testAPIVersions();
    await subscribeWithLatestVersion();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RECOMMENDATIONS');
    console.log('=' .repeat(70));
    
    console.log('\n✅ USE v22.0 for webhook operations');
    console.log('   - It\'s the latest stable version');
    console.log('   - v23.0 might be beta/preview');
    console.log('   - v21.0 still works but will be deprecated');
    
    console.log('\n📝 IN META BUSINESS MANAGER:');
    console.log('   When you see version dropdown, select v22.0');
    console.log('   This ensures compatibility with current WhatsApp Business API');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   Even with correct version, if fields aren\'t subscribing via API,');
    console.log('   you MUST do it manually in Meta Business Manager UI');
    
    console.log('\n🔧 MANUAL STEPS:');
    console.log('   1. Select v22.0 in version dropdown');
    console.log('   2. Remove and re-add webhook URL');
    console.log('   3. Click Subscribe on each field');
    console.log('   4. Test with "Send to My Server" button');
}

main().catch(console.error);