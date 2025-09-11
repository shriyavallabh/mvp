const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Test V2 WhatsApp Delivery to Advisors with Correct Templates
 * Uses the actual approved templates from the account
 */

// Set up environment with correct credentials
process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = '1861646317956355';
process.env.WHATSAPP_ACCESS_TOKEN = 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';
process.env.WHATSAPP_APP_ID = '1343856510333499';
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'finadvise_webhook_verify_token_2025';

// Use the ACTUAL approved templates we found
process.env.TEMPLATE_MEDIA_DAILY = 'finadvise_daily_v1757531949615'; // This is an approved media template
process.env.TEMPLATE_TEXT_FALLBACK = 'finadvise_daily_notification_v1757563710819'; // This is an approved text template

// Other configs
process.env.CDN_BASE_URL = 'https://finadvise.app/images';
process.env.OG_PAGE_BASE_URL = 'https://finadvise.app/daily';
process.env.JSON_STORAGE_PATH = './data';
process.env.USE_JSON_STORAGE = 'true';
process.env.USE_PUBLIC_LINK = 'true';
process.env.ENABLE_FALLBACK = 'true';
process.env.DEBUG_MODE = 'true';
process.env.LOG_LEVEL = 'debug';

const axios = require('axios');
const fs = require('fs');

// Load services
const db = require('./services/database');
const logger = require('./services/logger');

// Load subscriber data
const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));

async function sendMediaTemplateDirectly(to, name) {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615', // Using the approved media template
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { 
                            link: 'https://storage.googleapis.com/msgsndr/0iO3mS8O2ALqgGWCZXm0/media/676be3f81444e55f9d0e8b84.png'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: name },
                        { type: 'text', text: 'Your personalized financial insights for today' }
                    ]
                }
            ]
        }
    };

    try {
        console.log(`   📤 Sending media template to ${name}...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log(`   ✅ SUCCESS! WAMID: ${response.data.messages[0].id}`);
            return {
                success: true,
                wamid: response.data.messages[0].id,
                channel: 'media_template'
            };
        }
    } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.data?.error?.message || error.message}`);
        
        // Try fallback with text template
        return sendTextTemplateFallback(to, name);
    }
}

async function sendTextTemplateFallback(to, name) {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
            name: 'finadvise_daily_notification_v1757563710819', // Using approved text template
            language: { code: 'en' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: name },
                        { type: 'text', text: 'Visit https://finadvise.app for your daily update' }
                    ]
                }
            ]
        }
    };

    try {
        console.log(`   🔄 Trying text template fallback...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log(`   ✅ Fallback SUCCESS! WAMID: ${response.data.messages[0].id}`);
            return {
                success: true,
                wamid: response.data.messages[0].id,
                channel: 'text_template'
            };
        }
    } catch (error) {
        console.log(`   ❌ Fallback also failed: ${error.response?.data?.error?.message || error.message}`);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

async function testWithCorrectTemplates() {
    console.log('\n🚀 FinAdvise WhatsApp Delivery Test - With Correct Templates');
    console.log('='.repeat(60));
    console.log('\nUsing approved templates:');
    console.log('  📸 Media: finadvise_daily_v1757531949615');
    console.log('  📝 Text Fallback: finadvise_daily_notification_v1757563710819\n');

    // Initialize database
    await db.initialize();

    const results = [];

    for (const subscriber of subscriberData.subscribers) {
        console.log(`\n👤 Testing: ${subscriber.name} (${subscriber.phone})`);
        console.log('-'.repeat(40));

        const result = await sendMediaTemplateDirectly(subscriber.phone, subscriber.name);
        
        results.push({
            name: subscriber.name,
            phone: subscriber.phone,
            ...result
        });

        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n\n📊 FINAL RESULTS');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\nTotal Sent: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
        console.log('\n✅ Successfully Delivered:');
        successful.forEach(r => {
            console.log(`   ${r.name} (${r.phone})`);
            console.log(`      Channel: ${r.channel}`);
            console.log(`      WAMID: ${r.wamid}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed:');
        failed.forEach(r => {
            console.log(`   ${r.name}: ${r.error}`);
        });
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `delivery-results-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        templates: {
            media: 'finadvise_daily_v1757531949615',
            text: 'finadvise_daily_notification_v1757563710819'
        },
        results,
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            success_rate: `${((successful.length / results.length) * 100).toFixed(1)}%`
        }
    }, null, 2));
    
    console.log(`\n📁 Results saved to: ${resultsFile}`);
    
    console.log('\n✨ NEXT STEPS:');
    console.log('1. Check WhatsApp on advisor phones');
    console.log('2. Verify images are displayed correctly');
    console.log('3. If using webhooks, check delivery confirmations');
    console.log('4. Review the results file for detailed information');
}

// Run the test
testWithCorrectTemplates().then(() => {
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});