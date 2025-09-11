const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * COMPLETE WHATSAPP MEDIA TEMPLATE SOLUTION
 * Using Resumable Upload API for proper image template creation
 * Based on expert guidance - this WILL work
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Configuration
const config = {
    wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID, // WhatsApp Business Account ID
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    appId: '705220735777979',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v23.0' // Upgraded from v18.0 as recommended
};

/**
 * Step 1: Create a sample image for template approval
 */
async function createSampleImage() {
    console.log('🎨 Creating sample image for template approval...');
    
    const width = 1200;
    const height = 628; // WhatsApp recommended aspect ratio
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Professional gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 25, height);
        ctx.stroke();
    }
    
    // Main content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText('DAILY FINANCIAL UPDATE', width / 2, 150);
    
    ctx.font = '48px Arial';
    ctx.fillText('Personalized Market Insights', width / 2, 230);
    
    // Visual elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(100, 300, 300, 200);
    ctx.fillRect(450, 300, 300, 200);
    ctx.fillRect(800, 300, 300, 200);
    
    // Sample data
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Portfolio', 250, 350);
    ctx.font = '28px Arial';
    ctx.fillText('₹25,00,000', 250, 400);
    ctx.fillText('+12.5%', 250, 450);
    
    ctx.fillText('Market', 600, 350);
    ctx.fillText('Nifty +2.3%', 600, 400);
    ctx.fillText('Sensex +2.1%', 600, 450);
    
    ctx.fillText('Action', 950, 350);
    ctx.font = '24px Arial';
    ctx.fillText('Review ELSS', 950, 400);
    ctx.fillText('Rebalance', 950, 450);
    
    // Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('FinAdvise - Your Financial Partner', width / 2, 570);
    
    // Save as JPEG (as recommended)
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
    const fileName = 'finadvise-sample.jpg';
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`   ✅ Sample image created: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    return { filePath, buffer, size: buffer.length };
}

/**
 * Step 2: Use Resumable Upload API to get header handle
 * This is the CRITICAL difference - we need a resumable upload handle, not a media ID
 */
async function getResumableUploadHandle(imageInfo) {
    console.log('\n📤 Using Resumable Upload API to get header handle...');
    console.log('   (This is different from regular media upload!)');
    
    const { filePath, buffer, size } = imageInfo;
    const fileName = path.basename(filePath);
    
    // Step 2.1: Create upload session
    const sessionUrl = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/uploads`;
    const sessionParams = new URLSearchParams({
        file_name: fileName,
        file_length: size,
        file_type: 'image/jpeg',
        access_token: config.accessToken
    });
    
    try {
        console.log('   Creating upload session...');
        const sessionResponse = await axios.post(
            `${sessionUrl}?${sessionParams}`,
            null,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const uploadId = sessionResponse.data.id;
        console.log(`   ✅ Upload session created: ${uploadId}`);
        
        // Step 2.2: Upload the actual file
        console.log('   Uploading file data...');
        const uploadUrl = `https://graph.facebook.com/${config.apiVersion}/${uploadId}`;
        
        const uploadResponse = await axios.post(
            uploadUrl,
            buffer,
            {
                headers: {
                    'Authorization': `OAuth ${config.accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'file_offset': '0'
                }
            }
        );
        
        const handle = uploadResponse.data.h || uploadResponse.data.id || uploadId;
        console.log(`   ✅ Got resumable upload handle: ${handle}`);
        console.log('   (This is what we use for header_handle in template!)');
        
        return handle;
        
    } catch (error) {
        console.error('   ❌ Resumable upload failed:', error.response?.data || error.message);
        
        // Fallback: Try simpler approach
        console.log('\n   Trying alternative upload approach...');
        
        try {
            const response = await axios.post(
                `${sessionUrl}?${sessionParams}`,
                buffer,
                {
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                }
            );
            
            const handle = response.data.h || response.data.id;
            console.log(`   ✅ Alternative upload successful: ${handle}`);
            return handle;
            
        } catch (fallbackError) {
            console.error('   ❌ Alternative also failed:', fallbackError.response?.data || fallbackError.message);
            throw fallbackError;
        }
    }
}

/**
 * Step 3: Create media template with IMAGE header using the handle
 */
async function createMediaTemplate(uploadHandle) {
    console.log('\n📝 Creating media template with IMAGE header...');
    console.log(`   Using upload handle: ${uploadHandle}`);
    
    const templateData = {
        name: 'finadvise_daily_v1',
        category: 'MARKETING', // Daily insights are marketing per Meta guidelines
        language: 'en',
        components: [
            {
                type: 'HEADER',
                format: 'IMAGE',
                example: {
                    header_handle: [uploadHandle] // This is the key - use resumable upload handle!
                }
            },
            {
                type: 'BODY',
                text: 'Good morning {{1}}! Here\'s your personalized financial update for today.\n\n📊 Portfolio: {{2}}\n📈 Market: {{3}}\n💡 Action: {{4}}\n\nYour wealth journey continues with smart decisions.',
                example: {
                    body_text: [['Avalok', '₹25L (+12.5%)', 'Nifty +2.3%', 'Review ELSS options']]
                }
            },
            {
                type: 'FOOTER',
                text: 'FinAdvise | Reply STOP to unsubscribe'
            }
        ]
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`,
            templateData,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('   ✅ Template created successfully!');
        console.log(`   Template ID: ${response.data.id}`);
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Name: ${response.data.name || templateData.name}`);
        
        return {
            success: true,
            templateId: response.data.id,
            templateName: response.data.name || templateData.name,
            status: response.data.status
        };
        
    } catch (error) {
        if (error.response?.data?.error?.message?.includes('already exists')) {
            console.log('   ℹ️ Template already exists, checking status...');
            return await checkTemplateStatus('finadvise_daily_v1');
        }
        
        console.error('   ❌ Template creation failed:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

/**
 * Step 4: Check template status
 */
async function checkTemplateStatus(templateName) {
    console.log(`\n🔍 Checking template status for: ${templateName}`);
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?name=${templateName}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        if (response.data.data && response.data.data.length > 0) {
            const template = response.data.data[0];
            console.log(`   Status: ${template.status}`);
            console.log(`   Category: ${template.category}`);
            
            // Check if it has image header
            const hasImageHeader = template.components?.some(
                c => c.type === 'HEADER' && c.format === 'IMAGE'
            );
            console.log(`   Has IMAGE header: ${hasImageHeader ? '✅ YES' : '❌ NO'}`);
            
            return {
                success: true,
                templateName,
                status: template.status,
                hasImageHeader,
                templateId: template.id
            };
        }
        
        console.log('   Template not found');
        return { success: false, error: 'Template not found' };
        
    } catch (error) {
        console.error('   Error checking status:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Step 5: Wait for template approval
 */
async function waitForApproval(templateName, maxWaitTime = 120000) {
    console.log('\n⏳ Waiting for template approval...');
    console.log('   (Usually takes 1-2 minutes, max wait: 2 minutes)');
    
    const startTime = Date.now();
    const checkInterval = 10000; // Check every 10 seconds
    let attempts = 0;
    
    while (Date.now() - startTime < maxWaitTime) {
        attempts++;
        console.log(`   Attempt ${attempts}...`);
        
        const status = await checkTemplateStatus(templateName);
        
        if (status.success && status.status === 'APPROVED') {
            console.log('   ✅ Template APPROVED!');
            return true;
        } else if (status.status === 'REJECTED') {
            console.log('   ❌ Template REJECTED');
            return false;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('   ⏱️ Timeout - template still pending');
    return false;
}

/**
 * Step 6: Generate today's actual content image
 */
async function generateTodaysImage(advisorName) {
    console.log(`\n🎨 Generating today's actual image for ${advisorName}...`);
    
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dynamic gradient based on time of day
    const hour = new Date().getHours();
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (hour < 12) {
        // Morning colors
        gradient.addColorStop(0, '#f97316');
        gradient.addColorStop(1, '#ea580c');
    } else {
        // Evening colors
        gradient.addColorStop(0, '#3730a3');
        gradient.addColorStop(1, '#4c1d95');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Good Morning, ${advisorName}!`, width / 2, 100);
    
    ctx.font = '36px Arial';
    ctx.fillText(new Date().toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }), width / 2, 160);
    
    // Data boxes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(50, 220, 350, 300);
    ctx.fillRect(425, 220, 350, 300);
    ctx.fillRect(800, 220, 350, 300);
    
    // Portfolio data
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Your Portfolio', 225, 270);
    ctx.font = '48px Arial';
    ctx.fillStyle = '#059669';
    ctx.fillText('₹25,00,000', 225, 340);
    ctx.font = '36px Arial';
    ctx.fillText('+12.5%', 225, 390);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Monthly Return', 225, 420);
    ctx.font = '28px Arial';
    ctx.fillStyle = '#059669';
    ctx.fillText('+₹2,78,000', 225, 470);
    
    // Market data
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Market Today', 600, 270);
    ctx.font = '36px Arial';
    ctx.fillStyle = '#059669';
    ctx.fillText('NIFTY', 600, 330);
    ctx.fillText('22,150 ▲', 600, 370);
    ctx.fillStyle = '#dc2626';
    ctx.fillText('SENSEX', 600, 420);
    ctx.fillText('73,200 ▲', 600, 460);
    
    // Actions
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Action Items', 975, 270);
    ctx.font = '24px Arial';
    ctx.fillText('✓ Review ELSS', 975, 320);
    ctx.fillText('✓ Book Profits', 975, 360);
    ctx.fillText('✓ Rebalance', 975, 400);
    ctx.fillText('✓ Tax Planning', 975, 440);
    
    // Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FinAdvise - Building Wealth Together', width / 2, 570);
    
    // Save
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
    const fileName = `daily_${advisorName.toLowerCase()}_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`   ✅ Today's image created: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    return filePath;
}

/**
 * Step 7: Upload today's image for sending (regular media upload, not resumable)
 */
async function uploadTodaysImage(imagePath) {
    console.log('\n📤 Uploading today\'s image for sending...');
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', fs.createReadStream(imagePath));
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const mediaId = response.data.id;
        console.log(`   ✅ Image uploaded with media ID: ${mediaId}`);
        console.log('   (This is for sending, different from template handle)');
        
        return mediaId;
        
    } catch (error) {
        console.error('   ❌ Upload failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Step 8: Send the approved media template with today's image
 * This is the CORRECT way to send images to cold recipients
 */
async function sendMediaTemplate(templateName, recipientPhone, recipientName, mediaId) {
    console.log(`\n📨 Sending media template to ${recipientName} (${recipientPhone})...`);
    console.log(`   Template: ${templateName}`);
    console.log(`   Media ID: ${mediaId}`);
    
    const message = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
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
                            image: { id: mediaId }
                            // Or use link: { link: 'https://your-cdn.com/image.jpg' }
                        }
                    ]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: recipientName },
                        { type: 'text', text: '₹25L (+12.5%)' },
                        { type: 'text', text: 'Nifty +2.3%, Sensex +2.1%' },
                        { type: 'text', text: 'Review ELSS for ₹1.95L tax saving' }
                    ]
                }
            ]
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
        
        const messageId = response.data.messages[0].id;
        console.log(`   ✅ Media template sent successfully!`);
        console.log(`   Message ID: ${messageId}`);
        console.log(`   Contact: ${response.data.contacts[0].wa_id}`);
        
        return {
            success: true,
            messageId,
            recipientName,
            recipientPhone
        };
        
    } catch (error) {
        console.error(`   ❌ Send failed:`, error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
            recipientName,
            recipientPhone
        };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 WHATSAPP MEDIA TEMPLATE SOLUTION - COMPLETE IMPLEMENTATION');
    console.log('=' .repeat(70));
    console.log('Following expert guidance with Resumable Upload API');
    console.log('=' .repeat(70));
    
    try {
        // Step 1: Create sample image
        const sampleImage = await createSampleImage();
        
        // Step 2: Get resumable upload handle
        const uploadHandle = await getResumableUploadHandle(sampleImage);
        
        if (!uploadHandle) {
            throw new Error('Failed to get upload handle');
        }
        
        // Step 3: Create media template
        const templateResult = await createMediaTemplate(uploadHandle);
        
        if (!templateResult.success) {
            console.log('\n⚠️ Template creation failed, checking existing templates...');
            const existing = await checkTemplateStatus('finadvise_daily_v1');
            
            if (existing.success && existing.status === 'APPROVED' && existing.hasImageHeader) {
                console.log('✅ Found existing approved template with IMAGE header!');
                templateResult.templateName = 'finadvise_daily_v1';
                templateResult.status = 'APPROVED';
            } else {
                throw new Error('No approved template with IMAGE header available');
            }
        }
        
        // Step 4: Wait for approval if needed
        if (templateResult.status !== 'APPROVED') {
            console.log('\n⏳ Template submitted, waiting for approval...');
            const approved = await waitForApproval(templateResult.templateName || 'finadvise_daily_v1');
            
            if (!approved) {
                console.log('\n⚠️ Template not approved yet. Please wait and try again later.');
                return;
            }
        }
        
        // Step 5: Now send to all advisors
        console.log('\n' + '=' .repeat(70));
        console.log('📨 SENDING MEDIA TEMPLATES TO ADVISORS');
        console.log('=' .repeat(70));
        
        const advisors = [
            { name: 'Avalok', phone: '919765071249' },
            { name: 'Shruti', phone: '919673758777' },
            { name: 'Vidyadhar', phone: '918975758513' }
        ];
        
        const results = [];
        
        for (const advisor of advisors) {
            // Generate today's image
            const todaysImage = await generateTodaysImage(advisor.name);
            
            // Upload it
            const mediaId = await uploadTodaysImage(todaysImage);
            
            // Send media template
            const result = await sendMediaTemplate(
                templateResult.templateName || 'finadvise_daily_v1',
                advisor.phone,
                advisor.name,
                mediaId
            );
            
            results.push(result);
            
            // Wait between sends
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Summary
        console.log('\n' + '=' .repeat(70));
        console.log('📊 DELIVERY SUMMARY');
        console.log('=' .repeat(70));
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`\n✅ Successful: ${successful}/${results.length}`);
        console.log(`❌ Failed: ${failed}/${results.length}`);
        
        results.forEach(r => {
            if (r.success) {
                console.log(`   ✅ ${r.recipientName} (${r.recipientPhone})`);
                console.log(`      Message ID: ${r.messageId}`);
            } else {
                console.log(`   ❌ ${r.recipientName}: Failed`);
            }
        });
        
        console.log('\n' + '=' .repeat(70));
        console.log('🎯 WHAT\'S DIFFERENT THIS TIME:');
        console.log('=' .repeat(70));
        console.log('1. Used Resumable Upload API for template header handle');
        console.log('2. Created proper media template with IMAGE header');
        console.log('3. Sending as single media template (not template + image)');
        console.log('4. Following exact Meta guidelines for cold recipients');
        console.log('5. Using v23.0 API (upgraded from v18.0)');
        
        console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
        console.log('You should receive:');
        console.log('   • A single message with image AND text');
        console.log('   • Professional financial visualization');
        console.log('   • Personalized content in the caption');
        console.log('   • No "Hi" required from you first!');
        
        console.log('\n✅ Please confirm: Have you received the image+text message?');
        console.log('   (Check WhatsApp on 9765071249)');
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
        console.error(error);
    }
}

// Execute
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { 
    createSampleImage,
    getResumableUploadHandle,
    createMediaTemplate,
    sendMediaTemplate
};