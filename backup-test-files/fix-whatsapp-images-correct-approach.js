const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CORRECT WhatsApp Media Template Implementation
 * Using APP_ID (not WABA_ID) for Resumable Upload
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const FormData = require('form-data');

const config = {
    // CRITICAL: Need to use APP_ID, not WABA_ID for uploads
    appId: 'YOUR_META_APP_ID', // TODO: Get this from Meta App Dashboard
    wabaId: '1861646317956355',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v23.0' // Updated to latest version
};

/**
 * Step 0: Find the App ID from the access token
 */
async function findAppId() {
    console.log('🔍 Finding Meta App ID from access token...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/debug_token?input_token=${config.accessToken}&access_token=${config.accessToken}`
        );
        
        const appId = response.data.data.app_id;
        console.log(`✅ Found App ID: ${appId}`);
        console.log(`   App Name: ${response.data.data.application || 'N/A'}`);
        console.log(`   Token Type: ${response.data.data.type}`);
        console.log(`   Expires: ${response.data.data.expires_at ? new Date(response.data.data.expires_at * 1000).toLocaleString() : 'Never'}\n`);
        
        config.appId = appId;
        return appId;
        
    } catch (error) {
        console.error('❌ Failed to get App ID:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Step 1: Create a sample image for template
 */
async function createSampleImage() {
    console.log('🎨 Creating sample image for template...\n');
    
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3730a3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY FINANCIAL UPDATE', width / 2, 150);
    
    // Subtitle
    ctx.font = '36px Arial';
    ctx.fillText('Personalized Market Insights', width / 2, 220);
    
    // Sample data boxes
    const boxes = [
        { label: 'Portfolio', value: '₹25,00,000', subtext: '+12.5%' },
        { label: 'Market', value: 'Nifty +2.3%', subtext: 'Sensex +2.1%' },
        { label: 'Action', value: 'Review ELSS', subtext: 'Rebalance' }
    ];
    
    boxes.forEach((box, i) => {
        const x = 150 + i * 350;
        const y = 300;
        
        // Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(x, y, 300, 150);
        
        // Text
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(box.label, x + 150, y + 40);
        
        ctx.fillStyle = '#000000';
        ctx.font = '28px Arial';
        ctx.fillText(box.value, x + 150, y + 80);
        
        ctx.fillStyle = '#059669';
        ctx.font = '20px Arial';
        ctx.fillText(box.subtext, x + 150, y + 120);
    });
    
    // Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('FinAdvise - Your Financial Partner', width / 2, 550);
    
    // Save
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
    const fileName = 'sample_template_image.jpg';
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ Sample image created: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Path: ${filePath}\n`);
    
    return {
        filePath,
        fileName,
        fileSize: buffer.length,
        mimeType: 'image/jpeg'
    };
}

/**
 * Step 2: Create Resumable Upload Session (CORRECT METHOD)
 */
async function createUploadSession(imageInfo) {
    console.log('📤 Creating resumable upload session using APP_ID...\n');
    
    // CRITICAL: Use APP_ID, not WABA_ID
    const sessionUrl = `https://graph.facebook.com/${config.apiVersion}/${config.appId}/uploads`;
    
    console.log(`   Endpoint: ${sessionUrl}`);
    console.log(`   File: ${imageInfo.fileName} (${(imageInfo.fileSize / 1024).toFixed(2)} KB)\n`);
    
    try {
        const response = await axios.post(
            sessionUrl,
            {
                file_name: imageInfo.fileName,
                file_length: imageInfo.fileSize,
                file_type: imageInfo.mimeType
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const sessionId = response.data.id;
        console.log(`✅ Upload session created: ${sessionId}\n`);
        return sessionId;
        
    } catch (error) {
        console.error('❌ Failed to create upload session:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Step 3: Upload file to session
 */
async function uploadFileToSession(sessionId, imageInfo) {
    console.log('📤 Uploading file to session...\n');
    
    const uploadUrl = `https://graph.facebook.com/${config.apiVersion}/${sessionId}`;
    const fileBuffer = fs.readFileSync(imageInfo.filePath);
    
    try {
        const response = await axios.post(
            uploadUrl,
            fileBuffer,
            {
                headers: {
                    'Authorization': `OAuth ${config.accessToken}`, // Note: OAuth prefix
                    'file_offset': '0',
                    'Content-Type': imageInfo.mimeType
                }
            }
        );
        
        const handle = response.data.h;
        console.log(`✅ File uploaded successfully!`);
        console.log(`   Header Handle: ${handle}`);
        console.log(`   This handle starts with: ${handle.substring(0, 10)}...`);
        console.log(`   Use this for template creation\n`);
        
        return handle;
        
    } catch (error) {
        console.error('❌ Failed to upload file:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Step 4: Create Media Template with IMAGE header
 */
async function createMediaTemplate(headerHandle) {
    console.log('📝 Creating media template with IMAGE header...\n');
    
    const templateName = `finadvise_daily_v${Date.now()}`;
    
    const templatePayload = {
        name: templateName,
        category: 'MARKETING', // Can be MARKETING or UTILITY
        language: 'en',
        components: [
            {
                type: 'HEADER',
                format: 'IMAGE',
                example: {
                    header_handle: [headerHandle] // CRITICAL: Use the handle from upload
                }
            },
            {
                type: 'BODY',
                text: 'Good morning {{1}}! 📊\n\nYour personalized financial update for today:\n\n💰 Portfolio Value: ₹{{2}}\n📈 Returns: {{3}}%\n🎯 Today\'s Focus: {{4}}\n\nMarket Overview:\n• Nifty: {{5}}\n• Sensex: {{6}}\n\nTap below to view detailed analysis.',
                example: {
                    body_text: [
                        ['Avalok', '25,00,000', '+12.5', 'Review tax-saving investments', '22,150 (+2.3%)', '73,200 (+2.1%)']
                    ]
                }
            },
            {
                type: 'FOOTER',
                text: 'FinAdvise - Building Wealth Together | Reply STOP to opt out'
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'URL',
                        text: 'View Full Report',
                        url: 'https://finadvise.com/report/{{1}}',
                        example: ['123456']
                    },
                    {
                        type: 'PHONE_NUMBER',
                        text: 'Call Advisor',
                        phone_number: '+917666684471'
                    }
                ]
            }
        ]
    };
    
    const createUrl = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`;
    
    console.log(`   Template Name: ${templateName}`);
    console.log(`   Category: ${templatePayload.category}`);
    console.log(`   Header: IMAGE with handle ${headerHandle.substring(0, 20)}...`);
    console.log(`   Body: Contains {{1}} to {{6}} variables`);
    console.log(`   Buttons: URL + Phone\n`);
    
    try {
        const response = await axios.post(
            createUrl,
            templatePayload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template created successfully!');
        console.log(`   Template ID: ${response.data.id}`);
        console.log(`   Name: ${response.data.name}`);
        console.log(`   Status: ${response.data.status}`);
        console.log('\n⏳ Template is now PENDING approval from Meta');
        console.log('   This usually takes 1-24 hours');
        console.log('   Check WhatsApp Manager for approval status\n');
        
        return {
            id: response.data.id,
            name: templateName,
            status: response.data.status
        };
        
    } catch (error) {
        console.error('❌ Failed to create template:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.error_user_msg) {
            console.error('\n📋 User Message:', error.response.data.error.error_user_msg);
        }
        
        throw error;
    }
}

/**
 * Step 5: Send message using approved template (with dynamic image)
 */
async function sendMediaTemplate(templateName, advisor) {
    console.log(`\n📨 Sending media template to ${advisor.name}...`);
    
    // Create today's dynamic image
    const dynamicImageUrl = 'https://finadvise-cdn.com/daily/2025-09-11.jpg'; // Your CDN URL
    
    const message = {
        messaging_product: 'whatsapp',
        to: advisor.phone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [
                        {
                            type: 'image',
                            image: {
                                link: dynamicImageUrl // Today's specific image
                            }
                        }
                    ]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: advisor.name },
                        { type: 'text', text: '25,00,000' },
                        { type: 'text', text: '+12.5' },
                        { type: 'text', text: 'Review ELSS for tax benefits' },
                        { type: 'text', text: '22,150 (+2.3%)' },
                        { type: 'text', text: '73,200 (+2.1%)' }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [
                        { type: 'text', text: advisor.id || '123456' }
                    ]
                }
            ]
        }
    };
    
    const sendUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    try {
        const response = await axios.post(
            sendUrl,
            message,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Template message sent successfully!`);
        console.log(`   Message ID: ${response.data.messages[0].id}`);
        console.log(`   Contact: ${response.data.contacts[0].wa_id}`);
        console.log(`   THIS SHOULD INCLUDE THE IMAGE!\n`);
        
        return response.data.messages[0].id;
        
    } catch (error) {
        console.error(`❌ Failed to send template:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Main execution flow
 */
async function main() {
    console.log('🚀 CORRECT WHATSAPP MEDIA TEMPLATE IMPLEMENTATION');
    console.log('=' .repeat(60));
    console.log('Using APP_ID for Resumable Upload (not WABA_ID)');
    console.log('=' .repeat(60) + '\n');
    
    try {
        // Step 0: Get App ID from token
        await findAppId();
        
        if (!config.appId) {
            throw new Error('App ID is required. Check your access token.');
        }
        
        // Step 1: Create sample image
        const imageInfo = await createSampleImage();
        
        // Step 2: Create upload session with APP_ID
        const sessionId = await createUploadSession(imageInfo);
        
        // Step 3: Upload file to get handle
        const headerHandle = await uploadFileToSession(sessionId, imageInfo);
        
        // Step 4: Create media template
        const template = await createMediaTemplate(headerHandle);
        
        console.log('=' .repeat(60));
        console.log('✅ TEMPLATE CREATION COMPLETE!');
        console.log('=' .repeat(60));
        console.log('\n📋 Next Steps:');
        console.log('1. Wait for template approval (1-24 hours)');
        console.log('2. Check WhatsApp Manager for approval status');
        console.log('3. Once approved, run: node send-approved-media-template.js');
        console.log(`4. Template name to use: ${template.name}`);
        
        // Save template info for later use
        const templateInfo = {
            templateName: template.name,
            templateId: template.id,
            createdAt: new Date().toISOString(),
            headerHandle: headerHandle,
            status: template.status
        };
        
        fs.writeFileSync(
            'media-template-info.json',
            JSON.stringify(templateInfo, null, 2)
        );
        
        console.log('\n📁 Template info saved to: media-template-info.json');
        
    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
        
        if (error.response?.status === 400) {
            console.log('\n🔍 Debugging Info:');
            console.log('1. Make sure you have the correct App ID');
            console.log('2. Check that your token has the required permissions');
            console.log('3. Verify your app is connected to the WhatsApp Business Account');
            console.log('\nTo find your App ID:');
            console.log('1. Go to developers.facebook.com');
            console.log('2. Select your app');
            console.log('3. App ID is shown in the dashboard');
        }
    }
}

// Execute
main().catch(console.error);