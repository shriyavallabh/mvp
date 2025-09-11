const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Complete End-to-End Test with Cloudflare Webhook
 * Sends UTILITY templates that will trigger content delivery when clicked
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookUrl: 'https://softball-one-realtor-telecom.trycloudflare.com/webhook'
};

// Load advisors
const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));

// Use a working UTILITY template
const TEMPLATE_NAME = 'daily_content_ready_v1';

console.log('\n🚀 END-TO-END TEST WITH CLOUDFLARE WEBHOOK');
console.log('=' .repeat(70));
console.log(`Webhook URL: ${CONFIG.webhookUrl}`);
console.log(`Template: ${TEMPLATE_NAME} (UTILITY)`);
console.log('\n📱 Sending unlock templates to all advisors...\n');

async function sendUnlockTemplate(advisor) {
    const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    const contentId = `CNT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: advisor.phone.replace('+', ''),
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: { code: 'en' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: advisor.name },
                        { type: 'text', text: today },
                        { type: 'text', text: contentId }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: '0',
                    parameters: [{
                        type: 'payload',
                        payload: `UNLOCK_${contentId}`
                    }]
                }
            ]
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.messages?.[0]?.id) {
            return {
                success: true,
                messageId: response.data.messages[0].id,
                contentId,
                advisor: advisor.name
            };
        }
    } catch (error) {
        return {
            success: false,
            advisor: advisor.name,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

async function runTest() {
    const advisors = [
        ...subscriberData.subscribers,
        { name: 'Test User', phone: '919022810769', segment: 'Premium' }
    ];
    
    const results = [];
    
    for (const advisor of advisors) {
        console.log(`📤 Sending to ${advisor.name} (${advisor.phone})...`);
        
        const result = await sendUnlockTemplate(advisor);
        results.push(result);
        
        if (result.success) {
            console.log(`   ✅ Template sent!`);
            console.log(`   📌 Content ID: ${result.contentId}`);
            console.log(`   🔓 Button will trigger: UNLOCK_${result.contentId}`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(70));
    console.log(`✅ Templates sent: ${successful.length}/${advisors.length}`);
    console.log(`❌ Failed: ${failed.length}/${advisors.length}`);
    
    console.log('\n🎯 WHAT HAPPENS NEXT:');
    console.log('1. Advisors see: "Your scheduled content is ready"');
    console.log('2. Button says: "Retrieve Content"');
    console.log('3. When clicked → Webhook receives the event');
    console.log('4. Content automatically delivered!');
    
    console.log('\n📱 TEST INSTRUCTIONS:');
    console.log('1. Check WhatsApp on all advisor phones');
    console.log('2. Click the "Retrieve Content" button');
    console.log('3. Watch content arrive automatically!');
    
    console.log('\n🔍 MONITORING:');
    console.log('Check webhook logs: tail -f webhook.log');
    console.log('Webhook URL:', CONFIG.webhookUrl);
    
    // Save test results
    fs.writeFileSync(
        `e2e-cloudflare-test-${Date.now()}.json`,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            webhookUrl: CONFIG.webhookUrl,
            template: TEMPLATE_NAME,
            results
        }, null, 2)
    );
    
    console.log('\n✨ End-to-end test initiated! Click buttons to test delivery.');
}

runTest().catch(console.error);