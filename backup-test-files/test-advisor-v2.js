const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Test V2 WhatsApp Delivery to Advisors
 * Tests the complete flow: media template → webhook → fallback
 */

// First, set up the environment with the known credentials
process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = '1861646317956355';
process.env.WHATSAPP_ACCESS_TOKEN = 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';
process.env.WHATSAPP_APP_ID = '1343856510333499'; // Meta App ID
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'finadvise_webhook_verify_token_2025';

// Configure other required env vars
process.env.CDN_BASE_URL = 'https://finadvise.app/images';
process.env.OG_PAGE_BASE_URL = 'https://finadvise.app/daily';
process.env.JSON_STORAGE_PATH = './data';
process.env.USE_JSON_STORAGE = 'true';
process.env.USE_PUBLIC_LINK = 'true';
process.env.ENABLE_FALLBACK = 'true';
process.env.DEBUG_MODE = 'true';
process.env.LOG_LEVEL = 'debug';

const fs = require('fs');
const path = require('path');

// Load services
const db = require('./services/database');
const sendService = require('./services/whatsapp/send.service');
const templateService = require('./services/whatsapp/templates.service');
const logger = require('./services/logger');

// Load subscriber data
const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));

async function testAdvisorDelivery() {
    console.log('\n🚀 FinAdvise V2 WhatsApp Delivery Test');
    console.log('=====================================\n');

    try {
        // Initialize database
        await db.initialize();
        console.log('✅ Database initialized\n');

        // Import contacts from subscriber records
        console.log('📥 Importing advisor contacts...');
        const contacts = subscriberData.subscribers.map(sub => ({
            wa_id: sub.phone.replace('+', ''),
            first_name: sub.name,
            segment: sub.segment,
            opt_in: sub.optedIn,
            preferences: sub.preferences
        }));

        for (const contact of contacts) {
            await db.upsertContact(contact.wa_id, contact);
            console.log(`   ✅ ${contact.first_name} (${contact.wa_id})`);
        }
        console.log('');

        // Check available templates
        console.log('📋 Checking available templates...');
        const templates = await templateService.fetchTemplates();
        
        // Find approved media templates
        const mediaTemplates = templates.filter(t => 
            t.status === 'APPROVED' && 
            t.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
        );

        const textTemplates = templates.filter(t => 
            t.status === 'APPROVED' && 
            !t.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
        );

        console.log(`   Found ${mediaTemplates.length} approved media templates`);
        console.log(`   Found ${textTemplates.length} approved text templates`);

        if (mediaTemplates.length > 0) {
            console.log('\n   📸 Available Media Templates:');
            mediaTemplates.forEach(t => {
                console.log(`      - ${t.name} (${t.language})`);
            });
        }

        if (textTemplates.length > 0) {
            console.log('\n   📝 Available Text Templates (for fallback):');
            textTemplates.slice(0, 3).forEach(t => {
                console.log(`      - ${t.name} (${t.language})`);
            });
        }

        // Select templates to use
        const mediaTemplate = mediaTemplates[0] || null;
        const textTemplate = textTemplates[0] || null;

        if (!mediaTemplate && !textTemplate) {
            console.error('\n❌ No approved templates found!');
            console.log('Please create and approve templates first.');
            return;
        }

        // Test sending to each advisor
        console.log('\n📤 Testing delivery to advisors...\n');

        const testImageUrl = 'https://storage.googleapis.com/msgsndr/0iO3mS8O2ALqgGWCZXm0/media/676be3f81444e55f9d0e8b84.png';
        const testOgPageUrl = 'https://finadvise.app/daily/test';
        
        const results = [];

        for (const subscriber of subscriberData.subscribers) {
            console.log(`\n👤 Testing: ${subscriber.name} (${subscriber.phone})`);
            console.log('-'.repeat(40));

            try {
                let result;

                if (mediaTemplate) {
                    // Try media template with automatic fallback
                    console.log(`   Using media template: ${mediaTemplate.name}`);
                    
                    // Override template names in config
                    process.env.TEMPLATE_MEDIA_DAILY = mediaTemplate.name;
                    process.env.TEMPLATE_TEXT_FALLBACK = textTemplate?.name || 'hello_world';

                    result = await sendService.sendWithFallback({
                        to: subscriber.phone,
                        imageUrl: testImageUrl,
                        bodyParams: [subscriber.name, 'Your daily financial insights are ready'],
                        ogPageUrl: testOgPageUrl
                    });
                } else if (textTemplate) {
                    // Use text template only
                    console.log(`   Using text template: ${textTemplate.name}`);
                    
                    result = await sendService.sendTextTemplateWithLink({
                        to: subscriber.phone,
                        templateName: textTemplate.name,
                        linkUrl: testOgPageUrl,
                        bodyParams: []
                    });
                } else {
                    console.log('   ❌ No templates available');
                    continue;
                }

                if (result.success) {
                    console.log(`   ✅ Message sent successfully!`);
                    console.log(`   📱 Channel: ${result.channel}`);
                    console.log(`   🆔 WAMID: ${result.wamid}`);
                } else {
                    console.log(`   ❌ Failed to send`);
                    console.log(`   Error: ${result.error || result.reason}`);
                }

                results.push({
                    name: subscriber.name,
                    phone: subscriber.phone,
                    ...result
                });

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                results.push({
                    name: subscriber.name,
                    phone: subscriber.phone,
                    success: false,
                    error: error.message
                });
            }
        }

        // Summary
        console.log('\n\n📊 DELIVERY SUMMARY');
        console.log('='.repeat(50));
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`Total Advisors: ${results.length}`);
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (successful > 0) {
            console.log('\n✅ Successfully Delivered to:');
            results.filter(r => r.success).forEach(r => {
                console.log(`   - ${r.name} (${r.phone}) via ${r.channel}`);
            });
        }
        
        if (failed > 0) {
            console.log('\n❌ Failed Deliveries:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`   - ${r.name}: ${r.error || r.reason}`);
            });
        }

        // Save results
        const resultsFile = `test-results-${Date.now()}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📁 Results saved to: ${resultsFile}`);

        // Check delivery status after a delay
        console.log('\n⏳ Waiting 5 seconds to check delivery status...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n📊 Checking delivery status from database...');
        for (const result of results.filter(r => r.success)) {
            const send = await db.getSendByWamid(result.wamid);
            if (send) {
                console.log(`   ${result.name}: ${send.status || 'pending'}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the test
testAdvisorDelivery().then(() => {
    console.log('\n✅ Test completed!');
    console.log('\nNext steps:');
    console.log('1. Check WhatsApp on advisor phones to verify delivery');
    console.log('2. Monitor webhook events: pm2 logs whatsapp-webhook-v2');
    console.log('3. Check delivery stats: node app-v2.js stats');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});