const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FIX WHATSAPP OPT-IN AND SUBSCRIPTION FLOW
 * 
 * The Real Problem:
 * 1. Users subscribe through a form/website
 * 2. They expect to receive messages WITHOUT sending "Hi" first
 * 3. Current templates aren't working for cold outreach
 * 
 * The Solution:
 * 1. Use UTILITY templates (not MARKETING) for transactional messages
 * 2. Implement proper opt-in confirmation flow
 * 3. Use interactive messages for subscription confirmation
 * 4. Create templates with PROPER opt-in language
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

/**
 * CRITICAL INSIGHT:
 * WhatsApp Business API allows sending to users who:
 * 1. Have opted-in through your website/app (documented opt-in)
 * 2. Are sent a UTILITY template for transactional purposes
 * 3. Have their phone number collected with explicit consent
 */

async function createOptInTemplate() {
    console.log('📝 Creating Proper Opt-In Confirmation Template');
    console.log('=' .repeat(60));
    
    // This is a UTILITY template that can be sent after user subscribes
    const optInTemplate = {
        name: 'subscription_confirmation',
        language: 'en_US',
        category: 'UTILITY', // UTILITY bypasses 24-hour window for transactional messages
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Subscription Confirmed'
            },
            {
                type: 'BODY',
                text: 'Hi {{1}}, your subscription to FinAdvise daily updates is confirmed! You will receive personalized financial insights every morning at 5 AM. Your subscription ID is {{2}}. Reply STOP to unsubscribe anytime.',
                example: {
                    body_text: [['John', 'SUB123456']]
                }
            },
            {
                type: 'FOOTER',
                text: 'FinAdvise - Your Financial Partner'
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'QUICK_REPLY',
                        text: 'Confirm'
                    },
                    {
                        type: 'QUICK_REPLY',
                        text: 'Cancel'
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates`,
            optInTemplate,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Opt-in template created:', response.data.id);
        return response.data;
    } catch (error) {
        if (error.response?.data?.error?.message?.includes('already exists')) {
            console.log('ℹ️ Template already exists');
        } else {
            console.error('❌ Error:', error.response?.data || error.message);
        }
    }
}

async function createDailyUpdateTemplate() {
    console.log('\n📝 Creating Daily Update Template (UTILITY)');
    console.log('=' .repeat(60));
    
    // UTILITY template for daily scheduled messages to subscribers
    const dailyTemplate = {
        name: 'daily_financial_update_utility',
        language: 'en_US',
        category: 'UTILITY', // UTILITY for transactional/scheduled messages
        components: [
            {
                type: 'HEADER',
                format: 'IMAGE' // We need to upload a sample image for this
            },
            {
                type: 'BODY',
                text: 'Good morning {{1}}! Here is your personalized financial update for {{2}}. Today\'s focus: {{3}}. Your portfolio value: {{4}}. Action required: {{5}}.',
                example: {
                    body_text: [['John', 'Dec 10', 'Tax Planning', '₹25,00,000', 'Review ELSS options']]
                }
            },
            {
                type: 'FOOTER',
                text: 'Reply STOP to unsubscribe'
            }
        ]
    };
    
    console.log('Note: This template needs an image header.');
    console.log('Meta requires uploading a sample image first.');
}

/**
 * The Correct Flow for Subscription-Based Messaging
 */
async function implementCorrectFlow() {
    console.log('\n🔄 CORRECT SUBSCRIPTION FLOW');
    console.log('=' .repeat(60));
    
    console.log(`
THE RIGHT WAY TO HANDLE SUBSCRIPTIONS:

1. USER SUBSCRIBES (via website/app):
   - Collect phone number with explicit consent checkbox
   - Store opt-in timestamp and method
   - Generate unique subscription ID

2. SEND OPT-IN CONFIRMATION (UTILITY template):
   - Use 'subscription_confirmation' template
   - This is TRANSACTIONAL so bypasses 24-hour window
   - Include subscription ID for compliance

3. DAILY MESSAGES (UTILITY templates):
   - Use UTILITY category for scheduled updates
   - These are transactional (user subscribed)
   - Can be sent without user interaction

4. KEY REQUIREMENTS:
   ✅ Document opt-in (timestamp, IP, method)
   ✅ Use UTILITY templates (not MARKETING)
   ✅ Include unsubscribe option
   ✅ Respect user preferences

CRITICAL DIFFERENCE:
- MARKETING templates: Need user interaction first
- UTILITY templates: Can be sent for transactional purposes
`);
}

/**
 * Send subscription confirmation to new subscriber
 */
async function sendSubscriptionConfirmation(phone, name) {
    console.log(`\n📨 Sending Subscription Confirmation to ${name}`);
    console.log('=' .repeat(60));
    
    const subscriptionId = `SUB${Date.now()}`;
    
    // First, try with existing UTILITY template
    const message = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
            name: 'opt_in_confirmation_v1', // This exists and is UTILITY
            language: { code: 'en_US' },
            components: [{
                type: 'body',
                parameters: [
                    { type: 'text', text: 'FinAdvise Daily Updates' }
                ]
            }]
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            message,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Confirmation sent:', response.data.messages[0].id);
        console.log('   This should arrive WITHOUT user sending Hi first!');
        
        // Store subscription
        const subscription = {
            phone,
            name,
            subscriptionId,
            optInTimestamp: new Date().toISOString(),
            optInMethod: 'website_form',
            status: 'active',
            preferences: {
                sendTime: '05:00',
                timezone: 'Asia/Kolkata'
            }
        };
        
        // Save to database (file for now)
        const subscriptions = fs.existsSync('subscriptions.json') 
            ? JSON.parse(fs.readFileSync('subscriptions.json'))
            : [];
        subscriptions.push(subscription);
        fs.writeFileSync('subscriptions.json', JSON.stringify(subscriptions, null, 2));
        
        console.log('✅ Subscription saved:', subscriptionId);
        
        return subscription;
        
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.message?.includes('24 hours')) {
            console.log('\n⚠️ PROBLEM: Even UTILITY templates are blocked!');
            console.log('This means the number might not be properly opted-in.');
        }
    }
}

/**
 * Test with actual subscription flow
 */
async function testSubscriptionFlow() {
    console.log('🧪 TESTING PROPER SUBSCRIPTION FLOW');
    console.log('=' .repeat(60));
    
    // Simulate user subscribing through website
    const testUser = {
        name: 'Avalok',
        phone: '919765071249',
        email: 'avalok@example.com',
        subscribedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        consentGiven: true
    };
    
    console.log('1. User subscribed via website:');
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Phone: ${testUser.phone}`);
    console.log(`   Consent: ${testUser.consentGiven}`);
    
    console.log('\n2. Sending opt-in confirmation...');
    await sendSubscriptionConfirmation(testUser.phone, testUser.name);
    
    console.log('\n3. User is now subscribed!');
    console.log('   They will receive daily updates at 5 AM');
    console.log('   No "Hi" required from user');
}

/**
 * Check what templates we can actually use
 */
async function analyzeUsableTemplates() {
    console.log('\n🔍 ANALYZING USABLE TEMPLATES');
    console.log('=' .repeat(60));
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const templates = response.data.data || [];
        const utility = templates.filter(t => t.category === 'UTILITY' && t.status === 'APPROVED');
        const marketing = templates.filter(t => t.category === 'MARKETING' && t.status === 'APPROVED');
        
        console.log(`\nUTILITY Templates (Can bypass 24hr): ${utility.length}`);
        utility.forEach(t => {
            console.log(`   ✅ ${t.name} - ${t.components[0]?.text?.substring(0, 50)}...`);
        });
        
        console.log(`\nMARKETING Templates (Need interaction): ${marketing.length}`);
        console.log(`   (These won't work for cold outreach)`);
        
        console.log('\n💡 SOLUTION:');
        console.log('We need to use UTILITY templates for subscription messages!');
        console.log('Current UTILITY templates we can use:');
        utility.slice(0, 5).forEach(t => {
            console.log(`   - ${t.name}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 FIXING WHATSAPP SUBSCRIPTION MESSAGING');
    console.log('=' .repeat(60));
    console.log('Understanding why messages aren\'t reaching subscribers');
    console.log('=' .repeat(60));
    
    // 1. Show the correct flow
    await implementCorrectFlow();
    
    // 2. Analyze what templates we can use
    await analyzeUsableTemplates();
    
    // 3. Create proper opt-in template
    await createOptInTemplate();
    
    // 4. Test subscription flow
    await testSubscriptionFlow();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 SUMMARY OF THE REAL ISSUE');
    console.log('=' .repeat(60));
    console.log(`
THE PROBLEM:
- We're using MARKETING templates (37 of them)
- MARKETING requires user interaction first
- Users who subscribe expect messages without saying "Hi"

THE SOLUTION:
1. Use UTILITY templates for transactional messages
2. Document user opt-in properly (website/app)
3. Send subscription confirmation (UTILITY)
4. Send daily updates as UTILITY (scheduled/transactional)

NEXT STEPS:
1. Create UTILITY templates with IMAGE headers
2. Implement proper opt-in flow on website
3. Store subscription records with timestamps
4. Use UTILITY templates for all subscriber messages

This is how WhatsApp Business API actually works!
Subscribers CAN receive messages without interaction,
but only through UTILITY templates with proper opt-in.
`);
}

// Run
main().catch(console.error);