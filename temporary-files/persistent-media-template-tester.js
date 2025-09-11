const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * PERSISTENT MEDIA TEMPLATE TESTER
 * Continuously tests different approaches until media templates deliver
 * The contact "Shruti Petkar" should receive messages from 574744175733556
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID, 
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

const recipient = '919022810769';
let attemptCount = 0;
const successfulMessages = [];

console.log('\n🔄 PERSISTENT MEDIA TEMPLATE TESTING');
console.log('=' .repeat(70));
console.log('Target: 9022810769 (Shruti Petkar on your WhatsApp)');
console.log('Sender: 574744175733556');
console.log('Goal: Deliver media templates with images\n');

// Strategy 1: Try UTILITY templates (higher delivery rate)
async function tryUtilityTemplates() {
    console.log('\n📍 STRATEGY 1: Testing UTILITY Category Templates');
    console.log('-'.repeat(50));
    
    const templates = [
        {
            name: 'finadvise_account_update_v1757563699228',
            params: 5,
            sendPayload: () => ({
                messaging_product: 'whatsapp',
                to: recipient,
                type: 'template',
                template: {
                    name: 'finadvise_account_update_v1757563699228',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'header',
                            parameters: [{
                                type: 'image',
                                image: { 
                                    link: 'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg'
                                }
                            }]
                        },
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Subscriber' },
                                { type: 'text', text: 'January 11, 2025' },
                                { type: 'text', text: '52,75,000' },
                                { type: 'text', text: '+2.8%' },
                                { type: 'text', text: 'Review portfolio' }
                            ]
                        }
                    ]
                }
            })
        },
        {
            name: 'finadvise_utility_v1757563556085',
            params: 4,
            sendPayload: () => ({
                messaging_product: 'whatsapp',
                to: recipient,
                type: 'template',
                template: {
                    name: 'finadvise_utility_v1757563556085',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'header',
                            parameters: [{
                                type: 'image',
                                image: { 
                                    link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600'
                                }
                            }]
                        },
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Test User' },
                                { type: 'text', text: 'January 11' },
                                { type: 'text', text: '50,00,000' },
                                { type: 'text', text: '+3.5%' }
                            ]
                        }
                    ]
                }
            })
        }
    ];
    
    for (const template of templates) {
        attemptCount++;
        console.log(`\nAttempt ${attemptCount}: ${template.name}`);
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                template.sendPayload(),
                {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.messages?.[0]?.id) {
                console.log(`✅ SUCCESS! Message ID: ${response.data.messages[0].id}`);
                successfulMessages.push({
                    template: template.name,
                    messageId: response.data.messages[0].id,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
        } catch (error) {
            console.log(`❌ Failed: ${error.response?.data?.error?.message || error.message}`);
        }
        
        await delay(3000); // Wait 3 seconds between attempts
    }
    
    return false;
}

// Strategy 2: Try with media_id instead of URL
async function tryWithMediaId() {
    console.log('\n📍 STRATEGY 2: Upload Image and Use Media ID');
    console.log('-'.repeat(50));
    
    // First, we need to upload an image to get media_id
    console.log('Uploading image to WhatsApp...');
    
    try {
        // Upload image
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Download and use a test image
        const imageResponse = await axios.get(
            'https://via.placeholder.com/600x400.jpg',
            { responseType: 'arraybuffer' }
        );
        
        formData.append('file', Buffer.from(imageResponse.data), {
            filename: 'test.jpg',
            contentType: 'image/jpeg'
        });
        formData.append('messaging_product', 'whatsapp');
        
        const uploadResponse = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const mediaId = uploadResponse.data.id;
        console.log(`✅ Image uploaded! Media ID: ${mediaId}`);
        
        // Now send template with media_id
        attemptCount++;
        console.log(`\nAttempt ${attemptCount}: Using media_id instead of URL`);
        
        const payload = {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: {
                name: 'finadvise_utility_v1757563556085',
                language: { code: 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [{
                            type: 'image',
                            image: { 
                                id: mediaId  // Using media_id instead of link
                            }
                        }]
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: 'Test' },
                            { type: 'text', text: 'Today' },
                            { type: 'text', text: '1000000' },
                            { type: 'text', text: '5' }
                        ]
                    }
                ]
            }
        };
        
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
            console.log(`✅ SUCCESS with media_id! Message ID: ${response.data.messages[0].id}`);
            successfulMessages.push({
                template: 'finadvise_utility_v1757563556085',
                method: 'media_id',
                messageId: response.data.messages[0].id,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        
    } catch (error) {
        console.log(`❌ Media ID approach failed: ${error.response?.data?.error?.message || error.message}`);
    }
    
    return false;
}

// Strategy 3: Try simpler approach - text templates with parameters
async function tryTextTemplates() {
    console.log('\n📍 STRATEGY 3: Text Templates (Fallback)');
    console.log('-'.repeat(50));
    
    attemptCount++;
    console.log(`\nAttempt ${attemptCount}: Text template with parameters`);
    
    const payload = {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
            name: 'finadvise_daily_notification_v1757563710819',
            language: { code: 'en' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'User' },
                        { type: 'text', text: 'January 11' },
                        { type: 'text', text: '50,00,000' },
                        { type: 'text', text: '2.5' },
                        { type: 'text', text: 'Check portfolio' }
                    ]
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
            console.log(`✅ Text template sent! Message ID: ${response.data.messages[0].id}`);
            successfulMessages.push({
                template: 'finadvise_daily_notification_v1757563710819',
                type: 'text',
                messageId: response.data.messages[0].id,
                timestamp: new Date().toISOString()
            });
            return true;
        }
    } catch (error) {
        console.log(`❌ Text template failed: ${error.response?.data?.error?.message || error.message}`);
    }
    
    return false;
}

// Strategy 4: Check quality rating and send accordingly
async function checkQualityAndSend() {
    console.log('\n📍 STRATEGY 4: Check Account Quality & Send Accordingly');
    console.log('-'.repeat(50));
    
    try {
        // Check phone number quality
        const qualityResponse = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}?fields=quality_rating,status`,
            {
                headers: { 'Authorization': `Bearer ${config.accessToken}` }
            }
        );
        
        console.log('Account Quality:', qualityResponse.data.quality_rating || 'Unknown');
        console.log('Status:', qualityResponse.data.status || 'Unknown');
        
    } catch (error) {
        console.log('Could not check quality rating');
    }
    
    // Try sending based on quality
    return await tryUtilityTemplates();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPersistentTest() {
    console.log('Starting persistent testing...\n');
    console.log('📌 I will try multiple strategies until media templates deliver.');
    console.log('📌 Check "Shruti Petkar" chat on WhatsApp Web.\n');
    
    let success = false;
    
    // Try all strategies
    if (!success) success = await tryUtilityTemplates();
    if (!success) success = await tryWithMediaId();
    if (!success) success = await tryTextTemplates();
    if (!success) success = await checkQualityAndSend();
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TESTING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Attempts: ${attemptCount}`);
    console.log(`Successful Messages: ${successfulMessages.length}`);
    
    if (successfulMessages.length > 0) {
        console.log('\n✅ Messages Sent:');
        successfulMessages.forEach(msg => {
            console.log(`  - ${msg.template || msg.type}`);
            console.log(`    ID: ${msg.messageId}`);
            console.log(`    Time: ${msg.timestamp}`);
        });
        
        console.log('\n📱 CHECK WHATSAPP WEB NOW:');
        console.log('  1. Open chat with "Shruti Petkar" (574744175733556)');
        console.log('  2. You should see new messages beyond hello_world');
        console.log('  3. Look for messages with financial data');
        
        // Save results
        fs.writeFileSync(
            `test-results-${Date.now()}.json`,
            JSON.stringify(successfulMessages, null, 2)
        );
    } else {
        console.log('\n❌ No messages could be sent successfully.');
        console.log('\nPOSSIBLE ISSUES:');
        console.log('  1. The recipient may have blocked marketing messages');
        console.log('  2. WhatsApp may have rate limits in place');
        console.log('  3. The templates may need re-approval');
        console.log('  4. The phone number quality rating may be low');
    }
}

// Run the persistent test
runPersistentTest().catch(console.error);