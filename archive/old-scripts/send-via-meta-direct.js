#!/usr/bin/env node
/**
 * Send WhatsApp messages using Meta Cloud API directly (no AiSensy)
 */

require('dotenv').config();

const advisors = [
    { name: 'Shruti Petkar', phone: '919673758777' },
    { name: 'Vidyadhar Petkar', phone: '918975758513' },
    { name: 'Shriya Vallabh Petkar', phone: '919765071249' },
    { name: 'Mr. Tranquil Veda', phone: '919022810769' }
];

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TEMPLATE_NAME = 'daily_content_unlock_v5_meta';

function getTodayDate() {
    const date = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function sendTemplateToAdvisor(advisor) {
    console.log(`\n📤 Sending to ${advisor.name} (${advisor.phone})...`);

    const payload = {
        messaging_product: "whatsapp",
        to: advisor.phone,
        type: "template",
        template: {
            name: TEMPLATE_NAME,
            language: {
                code: "en"
            },
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: advisor.name.split(' ')[0] // {{1}} = First name
                        },
                        {
                            type: "text",
                            text: getTodayDate() // {{2}} = Date
                        }
                    ]
                }
            ]
        }
    };

    try {
        const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.messages) {
            console.log(`✅ Success! Message ID: ${result.messages[0].id}`);
            return { advisor: advisor.name, status: 'success', messageId: result.messages[0].id };
        } else {
            console.log(`❌ Failed:`, result.error?.message || 'Unknown error');
            return { advisor: advisor.name, status: 'failed', error: result.error };
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { advisor: advisor.name, status: 'error', error: error.message };
    }
}

async function sendToAllAdvisors() {
    console.log('🚀 JarvisDaily - Send via Meta Cloud API Direct');
    console.log('=' .repeat(60));
    console.log(`📅 Date: ${getTodayDate()}`);
    console.log(`📱 Template: ${TEMPLATE_NAME}`);
    console.log(`👥 Recipients: ${advisors.length} advisors`);
    console.log('=' .repeat(60));

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        console.log('\n❌ Missing credentials in .env:\n');
        console.log('WHATSAPP_PHONE_NUMBER_ID:', PHONE_NUMBER_ID ? '✅' : '❌ Missing');
        console.log('WHATSAPP_ACCESS_TOKEN:', ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
        console.log('\n💡 Run: node setup-meta-direct.js for setup guide');
        return;
    }

    const results = [];

    for (const advisor of advisors) {
        const result = await sendTemplateToAdvisor(advisor);
        results.push(result);

        // Wait 2 seconds between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(60));

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status !== 'success').length;

    console.log(`✅ Successful: ${successful}/${advisors.length}`);
    console.log(`❌ Failed: ${failed}/${advisors.length}`);

    console.log('\n📋 Detailed Results:');
    results.forEach(r => {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`${icon} ${r.advisor}: ${r.status}`);
        if (r.error) {
            console.log(`   Error: ${r.error.message || JSON.stringify(r.error)}`);
        }
    });

    console.log('\n🔔 What Happens Next:');
    console.log('   1. Advisors receive utility template ✅');
    console.log('   2. They click "📱 Send Content" button');
    console.log('   3. Meta webhook triggers → /api/webhook');
    console.log('   4. Your webhook sends 3 free-flow messages:');
    console.log('      • WhatsApp message text');
    console.log('      • LinkedIn post text');
    console.log('      • Status image info');
    console.log('   5. All content delivered in WhatsApp! 🎉');

    console.log('\n💰 Cost Breakdown:');
    console.log(`   Utility templates: ${successful} × ₹0.22 = ₹${(successful * 0.22).toFixed(2)}`);
    console.log(`   Free-flow messages: FREE (within 24-hour window)`);
    console.log(`   Meta API usage: ₹0 (no monthly fee)`);
    console.log(`   Total: ₹${(successful * 0.22).toFixed(2)}`);

    console.log('\n💸 vs AiSensy:');
    console.log(`   AiSensy cost: ₹2,399/month + ₹${(successful * 0.22).toFixed(2)}`);
    console.log(`   Meta Direct cost: ₹0/month + ₹${(successful * 0.22).toFixed(2)}`);
    console.log(`   Savings: ₹2,399/month 🎉`);

    console.log('\n📊 Monitor webhook:');
    console.log('   vercel logs --follow');

    console.log('\n' + '=' .repeat(60) + '\n');

    return results;
}

sendToAllAdvisors();
