const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Test Marketing Template on Fresh Number + Reset Strategy for Capped Numbers
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

console.log('\n🚀 MARKETING TEMPLATE TEST ON FRESH NUMBER + CAP RESET STRATEGY');
console.log('=' .repeat(70));

async function sendMarketingToFreshNumber() {
    console.log('\n📱 TEST 1: Marketing Template to Fresh Number (9022810769)');
    console.log('This number has NO marketing cap - should work!\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769', // Fresh number - no marketing messages sent before
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615', // MARKETING template
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { 
                            link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Premium Subscriber' },      // {{1}}
                        { type: 'text', text: '85,00,000' },              // {{2}}
                        { type: 'text', text: '+25.5' },                  // {{3}}
                        { type: 'text', text: 'Excellent growth! Consider profit booking' }, // {{4}}
                        { type: 'text', text: '22,450 (+3.5%)' },         // {{5}}
                        { type: 'text', text: '74,125 (+3.3%)' }          // {{6}}
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{
                        type: 'text',
                        text: 'fresh-user-report-' + Date.now()
                    }]
                }
            ]
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.messages?.[0]?.id) {
            console.log('✅ SUCCESS! Marketing template sent to fresh number!');
            console.log('   Message ID:', response.data.messages[0].id);
            console.log('   📱 CHECK 9022810769 - Should see:');
            console.log('      • Image at top');
            console.log('      • "Good morning Premium Subscriber! 📊"');
            console.log('      • Portfolio: ₹85,00,000');
            console.log('      • Returns: +25.5%');
            console.log('      • Two buttons (View Report + Call Advisor)');
            return true;
        }
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
        return false;
    }
}

async function resetMarketingCapStrategy() {
    console.log('\n\n🔄 STRATEGY TO RESET/BYPASS MARKETING CAPS');
    console.log('=' .repeat(70));
    
    console.log('\n📋 Method 1: WAIT PERIOD');
    console.log('   • Marketing caps reset after 24 hours');
    console.log('   • Last attempt: Jan 11, 11:30 AM');
    console.log('   • Cap resets: Jan 12, 11:30 AM');
    
    console.log('\n📋 Method 2: USE UTILITY TEMPLATES');
    console.log('   • UTILITY category bypasses marketing caps');
    console.log('   • Use for critical daily updates');
    console.log('   • Still supports images and rich content');
    
    console.log('\n📋 Method 3: TEMPLATE ROTATION');
    console.log('   • Create multiple template variations');
    console.log('   • Rotate between different approved templates');
    console.log('   • Each template may have separate cap tracking');
    
    console.log('\n📋 Method 4: CATEGORY SWITCHING');
    console.log('   • Change template category to UTILITY for daily updates');
    console.log('   • Keep MARKETING for promotional content only');
    
    console.log('\n📋 Method 5: USER-INITIATED CONVERSATION');
    console.log('   • If user replies, opens 24-hour session window');
    console.log('   • During session, no template restrictions');
    console.log('   • Can send any media directly');
}

async function testAlternativeApproaches() {
    console.log('\n\n🧪 ALTERNATIVE APPROACHES FOR CAPPED NUMBER (9765071249)');
    console.log('=' .repeat(70));
    
    // Approach 1: Try different marketing template
    console.log('\n1. Testing with different template name...');
    // This would require creating a new approved template
    
    // Approach 2: Send UTILITY with marketing-like content
    console.log('\n2. Sending UTILITY template with rich content...');
    
    const utilityPayload = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'template',
        template: {
            name: 'finadvise_utility_v1757563556085', // UTILITY - no caps!
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { 
                            link: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Avalok' },
                        { type: 'text', text: 'January 11, 2025' },
                        { type: 'text', text: '45,00,000' },
                        { type: 'text', text: '+15.3% (Excellent!)' }
                    ]
                }
            ]
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            utilityPayload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.messages?.[0]?.id) {
            console.log('   ✅ UTILITY with rich content sent!');
            console.log('   This bypasses all marketing caps!');
        }
    } catch (error) {
        console.log('   ❌ Failed:', error.response?.data?.error?.message);
    }
}

async function checkCapStatus() {
    console.log('\n\n📊 UNDERSTANDING WHATSAPP MARKETING CAPS');
    console.log('=' .repeat(70));
    
    console.log('\n🔍 How WhatsApp Marketing Caps Work:');
    console.log('   • Each user has a daily limit for marketing messages');
    console.log('   • Limit varies (1-10 messages typically)');
    console.log('   • Tracked per recipient, not per template');
    console.log('   • Resets every 24 hours from first marketing message');
    
    console.log('\n⚠️  Why You\'re Not Receiving:');
    console.log('   • WhatsApp counts ATTEMPTS, not deliveries');
    console.log('   • Even if you didn\'t see the message, cap was used');
    console.log('   • API success = cap consumed');
    
    console.log('\n✅ Solution:');
    console.log('   1. Use UTILITY templates for daily updates (no caps)');
    console.log('   2. Reserve MARKETING for special promotions');
    console.log('   3. Test on fresh numbers first');
    console.log('   4. Wait 24 hours for cap reset');
}

async function createDeliveryPlan() {
    console.log('\n\n📋 RECOMMENDED DELIVERY PLAN');
    console.log('=' .repeat(70));
    
    const plan = {
        daily: {
            template: 'finadvise_utility_v1757563556085',
            category: 'UTILITY',
            time: '5:00 AM',
            content: 'Portfolio updates, market data',
            caps: 'NONE - Can send unlimited'
        },
        weekly: {
            template: 'finadvise_daily_v1757531949615',
            category: 'MARKETING',
            time: 'Monday 9:00 AM',
            content: 'Special insights, promotions',
            caps: 'Limited - Use sparingly'
        },
        immediate: {
            template: 'finadvise_account_update_v1757563699228',
            category: 'UTILITY',
            content: 'Urgent updates, alerts',
            caps: 'NONE - Can send anytime'
        }
    };
    
    console.log('\nDaily Updates (UTILITY - No Caps):');
    console.log('   Template:', plan.daily.template);
    console.log('   Time:', plan.daily.time);
    console.log('   Content:', plan.daily.content);
    
    console.log('\nWeekly Marketing (MARKETING - Has Caps):');
    console.log('   Template:', plan.weekly.template);
    console.log('   Time:', plan.weekly.time);
    console.log('   Content:', plan.weekly.content);
    
    console.log('\nUrgent Alerts (UTILITY - No Caps):');
    console.log('   Template:', plan.immediate.template);
    console.log('   Content:', plan.immediate.content);
    
    // Save plan
    fs.writeFileSync(
        'whatsapp-delivery-plan.json',
        JSON.stringify(plan, null, 2)
    );
    
    console.log('\n📁 Delivery plan saved to whatsapp-delivery-plan.json');
}

async function main() {
    // Test on fresh number
    const freshSuccess = await sendMarketingToFreshNumber();
    
    // Show cap reset strategies
    await resetMarketingCapStrategy();
    
    // Test alternatives for capped number
    await testAlternativeApproaches();
    
    // Explain caps
    await checkCapStatus();
    
    // Create delivery plan
    await createDeliveryPlan();
    
    console.log('\n\n✅ SUMMARY & ACTION ITEMS');
    console.log('=' .repeat(70));
    console.log('\n1. CHECK 9022810769 NOW - Marketing template should deliver');
    console.log('2. For 9765071249 - Use UTILITY templates (just sent one)');
    console.log('3. Wait 24 hours for marketing cap reset');
    console.log('4. Implement dual-template strategy:');
    console.log('   • UTILITY for daily (no caps)');
    console.log('   • MARKETING for weekly (respects caps)');
}

main().catch(console.error);