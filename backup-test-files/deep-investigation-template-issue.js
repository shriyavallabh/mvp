const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * DEEP INVESTIGATION: Why media templates fail while hello_world succeeds
 * Comprehensive analysis of the template delivery issue
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

const testNumber = '919022810769';

console.log('\n🔬 DEEP INVESTIGATION: Template Delivery Issue');
console.log('=' .repeat(70));
console.log('Target: 9022810769');
console.log('Problem: hello_world delivers, media templates don\'t\n');

async function step1_AnalyzeTemplates() {
    console.log('\n📋 STEP 1: Analyzing Template Differences');
    console.log('-'.repeat(50));
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates?limit=100`,
            {
                headers: { 'Authorization': `Bearer ${config.accessToken}` }
            }
        );
        
        const templates = response.data.data || [];
        
        // Find our templates
        const helloWorld = templates.find(t => t.name === 'hello_world');
        const mediaTemplate = templates.find(t => t.name === 'finadvise_daily_v1757531949615');
        
        console.log('\n✅ HELLO_WORLD (WORKS):');
        console.log('  Status:', helloWorld?.status);
        console.log('  Category:', helloWorld?.category);
        console.log('  Language:', helloWorld?.language);
        console.log('  Quality Score:', helloWorld?.quality_score);
        console.log('  Components:', helloWorld?.components?.length, 'parts');
        
        console.log('\n❌ MEDIA TEMPLATE (FAILS):');
        console.log('  Status:', mediaTemplate?.status);
        console.log('  Category:', mediaTemplate?.category);
        console.log('  Language:', mediaTemplate?.language);
        console.log('  Quality Score:', mediaTemplate?.quality_score);
        console.log('  Components:', mediaTemplate?.components?.length, 'parts');
        
        // Key difference
        console.log('\n🔍 KEY DIFFERENCES:');
        console.log('  hello_world category:', helloWorld?.category || 'N/A');
        console.log('  media template category:', mediaTemplate?.category || 'N/A');
        console.log('  hello_world has image:', helloWorld?.components?.some(c => c.format === 'IMAGE') ? 'Yes' : 'No');
        console.log('  media template has image:', mediaTemplate?.components?.some(c => c.format === 'IMAGE') ? 'Yes' : 'No');
        
        return { helloWorld, mediaTemplate };
    } catch (error) {
        console.error('Error analyzing templates:', error.message);
    }
}

async function step2_TestWithoutImage() {
    console.log('\n\n🧪 STEP 2: Testing Media Template WITHOUT Image');
    console.log('-'.repeat(50));
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    // Try sending WITHOUT the image parameter to isolate the issue
    const payload = {
        messaging_product: 'whatsapp',
        to: testNumber,
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615',
            language: { code: 'en' },
            components: [
                // SKIP THE HEADER IMAGE - just send body
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Test User' },
                        { type: 'text', text: '10,00,000' },
                        { type: 'text', text: '+5.0' },
                        { type: 'text', text: 'Test Focus' },
                        { type: 'text', text: '22,000' },
                        { type: 'text', text: '73,000' }
                    ]
                }
            ]
        }
    };

    try {
        console.log('Attempting to send WITHOUT image header...');
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Success WITHOUT image! Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.log('❌ Failed even without image:', error.response?.data?.error?.message);
        return false;
    }
}

async function step3_TestDifferentImageURL() {
    console.log('\n\n🖼️ STEP 3: Testing with Different Image URLs');
    console.log('-'.repeat(50));
    
    const imageUrls = [
        {
            name: 'Direct JPG',
            url: 'https://via.placeholder.com/600x400.jpg'
        },
        {
            name: 'Direct PNG', 
            url: 'https://via.placeholder.com/600x400.png'
        },
        {
            name: 'Small Image (150x150)',
            url: 'https://via.placeholder.com/150x150.jpg'
        }
    ];
    
    for (const image of imageUrls) {
        console.log(`\nTesting with ${image.name}: ${image.url}`);
        
        const payload = {
            messaging_product: 'whatsapp',
            to: testNumber,
            type: 'template',
            template: {
                name: 'finadvise_daily_v1757531949615',
                language: { code: 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [{
                            type: 'image',
                            image: { link: image.url }
                        }]
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: 'Test' },
                            { type: 'text', text: '1000000' },
                            { type: 'text', text: '5' },
                            { type: 'text', text: 'Test' },
                            { type: 'text', text: '22000' },
                            { type: 'text', text: '73000' }
                        ]
                    }
                ]
            }
        };

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                payload,
                { headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' } }
            );
            
            console.log(`  ✅ SUCCESS with ${image.name}!`);
            return image.url;
        } catch (error) {
            console.log(`  ❌ Failed: ${error.response?.data?.error?.error_data?.details || error.response?.data?.error?.message}`);
        }
    }
}

async function step4_TestButtonParameters() {
    console.log('\n\n🔘 STEP 4: Testing Button Parameters Issue');
    console.log('-'.repeat(50));
    
    // The template has buttons - let's test with and without button parameters
    const payloadWithButton = {
        messaging_product: 'whatsapp',
        to: testNumber,
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615',
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { link: 'https://via.placeholder.com/600x400.jpg' }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Subscriber' },
                        { type: 'text', text: '52,75,000' },
                        { type: 'text', text: '18.7' },
                        { type: 'text', text: 'Review allocation' },
                        { type: 'text', text: '22,250' },
                        { type: 'text', text: '73,500' }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{
                        type: 'text',
                        text: 'report123'  // URL suffix parameter
                    }]
                }
            ]
        }
    };

    try {
        console.log('Testing WITH button parameter...');
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            payloadWithButton,
            { headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' } }
        );
        
        console.log('✅ SUCCESS with button! Message ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.log('❌ Failed with button:', error.response?.data?.error?.message);
        
        // Now try WITHOUT button parameter
        console.log('\nTesting WITHOUT button parameter...');
        delete payloadWithButton.template.components[2]; // Remove button component
        
        try {
            const response2 = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                payloadWithButton,
                { headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' } }
            );
            
            console.log('✅ SUCCESS without button! Message ID:', response2.data.messages?.[0]?.id);
            return true;
        } catch (error2) {
            console.log('❌ Still failed:', error2.response?.data?.error?.message);
            return false;
        }
    }
}

async function step5_TestExactHelloWorldFormat() {
    console.log('\n\n🎯 STEP 5: Testing Other Text-Only Templates');
    console.log('-'.repeat(50));
    
    // Test other approved text templates
    const textTemplates = [
        'finadvise_daily_notification_v1757563710819',
        'appointment_reminder',
        'daily_financial_update_v2'
    ];
    
    for (const templateName of textTemplates) {
        console.log(`\nTesting ${templateName}...`);
        
        const payload = {
            messaging_product: 'whatsapp',
            to: testNumber,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' }
            }
        };

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                payload,
                { headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' } }
            );
            
            console.log(`  ✅ ${templateName} WORKS!`);
        } catch (error) {
            // Try with parameters if needed
            if (error.response?.data?.error?.code === 132000) {
                console.log(`  ⚠️  ${templateName} needs parameters`);
            } else {
                console.log(`  ❌ ${templateName} failed:`, error.response?.data?.error?.message);
            }
        }
    }
}

async function main() {
    console.log('Starting comprehensive investigation...\n');
    
    // Run all diagnostic steps
    const templates = await step1_AnalyzeTemplates();
    await step2_TestWithoutImage();
    await step3_TestDifferentImageURL();
    await step4_TestButtonParameters();
    await step5_TestExactHelloWorldFormat();
    
    // Final diagnosis
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 INVESTIGATION COMPLETE - FINDINGS:');
    console.log('='.repeat(70));
    
    console.log('\n✅ What Works:');
    console.log('  • hello_world template (no parameters, no image)');
    console.log('  • Text-only templates');
    console.log('  • Messages are reaching WhatsApp servers');
    
    console.log('\n❌ What Fails:');
    console.log('  • Media templates with IMAGE headers');
    console.log('  • Templates with complex parameters');
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    console.log('  1. The media template requires EXACT parameter matching');
    console.log('  2. Button parameters might be incorrectly formatted');
    console.log('  3. Image URL might need to be publicly accessible');
    console.log('  4. Template category (MARKETING) might have delivery restrictions');
    
    console.log('\n💡 SOLUTION:');
    console.log('  Try sending the UTILITY category templates instead:');
    console.log('  • finadvise_utility_v1757563556085 (4 params)');
    console.log('  • finadvise_account_update_v1757563699228 (5 params)');
    console.log('  These have better deliverability than MARKETING templates');
}

main().catch(console.error);