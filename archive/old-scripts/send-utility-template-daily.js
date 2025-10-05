#!/usr/bin/env node
/**
 * Send daily utility templates to all advisors
 * This is the script that runs at 9 AM daily via PM2 cron
 */

require('dotenv').config();

const advisors = [
    { name: 'Shruti Petkar', phone: '919673758777', arn: 'ARN_SHRUTI_001' },
    { name: 'Vidyadhar Petkar', phone: '918975758513', arn: 'ARN_VIDYADHAR_002' },
    { name: 'Shriya Vallabh Petkar', phone: '919765071249', arn: 'ARN_SHRIYA_003' },
    { name: 'Mr. Tranquil Veda', phone: '919022810769', arn: 'ADV_004' }
];

const AISENSY_API_KEY = process.env.AISENSY_API_KEY;
const TEMPLATE_NAME = 'daily_content_unlock_v4';

// Get today's date in readable format
function getTodayDate() {
    const date = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options); // e.g., "Oct 3, 2024"
}

async function sendTemplateToAdvisor(advisor) {
    console.log(`\n📤 Sending to ${advisor.name} (${advisor.phone})...`);

    const payload = {
        apiKey: AISENSY_API_KEY,
        campaignName: `daily_content_${Date.now()}`,
        destination: advisor.phone,
        userName: 'JarvisDaily',
        templateParams: [
            advisor.name.split(' ')[0], // {{1}} = First name
            getTodayDate()               // {{2}} = Date
        ],
        source: 'api',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {}
    };

    try {
        const response = await fetch(
            `https://backend.aisensy.com/campaign/t1/api/v2/template/${TEMPLATE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            console.log(`✅ Success: ${result.message || 'Template sent'}`);
            return { advisor: advisor.name, status: 'success', result };
        } else {
            console.log(`❌ Failed: ${result.message || 'Unknown error'}`);
            return { advisor: advisor.name, status: 'failed', result };
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { advisor: advisor.name, status: 'error', error: error.message };
    }
}

async function sendToAllAdvisors() {
    console.log('🚀 JarvisDaily - Daily Content Delivery');
    console.log('=' .repeat(50));
    console.log(`📅 Date: ${getTodayDate()}`);
    console.log(`📱 Template: ${TEMPLATE_NAME}`);
    console.log(`👥 Recipients: ${advisors.length} advisors`);
    console.log('=' .repeat(50));

    const results = [];

    for (const advisor of advisors) {
        const result = await sendTemplateToAdvisor(advisor);
        results.push(result);

        // Wait 2 seconds between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '=' .repeat(50));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(50));

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status !== 'success').length;

    console.log(`✅ Successful: ${successful}/${advisors.length}`);
    console.log(`❌ Failed: ${failed}/${advisors.length}`);

    console.log('\n📋 Detailed Results:');
    results.forEach(r => {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`${icon} ${r.advisor}: ${r.status}`);
    });

    console.log('\n🔔 Next Steps:');
    console.log('   1. Advisors will receive utility template');
    console.log('   2. When they click "📱 Send Content" button:');
    console.log('      → Meta webhook triggers at /api/webhook');
    console.log('      → 3 free-flow messages sent automatically');
    console.log('      → All content delivered in WhatsApp');
    console.log('\n💰 Cost: ₹' + (successful * 0.22).toFixed(2) + ' (₹0.22 × ' + successful + ' templates)');
    console.log('=' .repeat(50) + '\n');

    return results;
}

// Run
sendToAllAdvisors();
