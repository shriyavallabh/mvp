const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send Clear Test Message with Image
 * Making sure you receive this!
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const FormData = require('form-data');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function createTestImage() {
    console.log('🎨 Creating test image...');
    
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    
    ctx.fillText('TEST MESSAGE', width / 2, 200);
    ctx.font = '48px Arial';
    ctx.fillText('From: +91 76666 84471', width / 2, 300);
    ctx.fillText('To: 9765071249', width / 2, 380);
    
    ctx.font = '36px Arial';
    ctx.fillText(`Time: ${new Date().toLocaleTimeString()}`, width / 2, 480);
    
    // Save image
    const buffer = canvas.toBuffer('image/png');
    const fileName = 'test_message.png';
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`   ✅ Image created: ${fileName}`);
    return filePath;
}

async function sendTestMessages() {
    console.log('📱 SENDING TEST MESSAGES TO 9765071249');
    console.log('=' .repeat(60));
    console.log('From Business Number: +91 76666 84471');
    console.log('Business Name: Your Jarvis Daily Assistant');
    console.log('=' .repeat(60));
    
    const yourNumber = '919765071249';
    
    try {
        // Step 1: Send text message first
        console.log('\n1️⃣ Sending direct text message...');
        
        const textMessage = {
            messaging_product: 'whatsapp',
            to: yourNumber,
            type: 'text',
            text: {
                body: `🔔 TEST MESSAGE - ${new Date().toLocaleTimeString()}\n\nThis is a test from your FinAdvise system.\n\nIf you receive this, the WhatsApp integration is working!\n\nCheck for:\n1. This text message\n2. An image that follows\n3. A template message\n\nFrom: Your Jarvis Daily Assistant\n(+91 76666 84471)`
            }
        };
        
        const textResponse = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            textMessage,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Text sent: ${textResponse.data.messages[0].id}`);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Create and upload image
        console.log('\n2️⃣ Creating and sending image...');
        
        const imagePath = await createTestImage();
        
        // Upload image
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', fs.createReadStream(imagePath));
        
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
        console.log(`   ✅ Image uploaded: ${mediaId}`);
        
        // Send image message
        const imageMessage = {
            messaging_product: 'whatsapp',
            to: yourNumber,
            type: 'image',
            image: {
                id: mediaId,
                caption: '🖼️ This is the test image with financial visualization.\n\nIf you see this image, the complete integration is working!'
            }
        };
        
        const imageResponse = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            imageMessage,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Image sent: ${imageResponse.data.messages[0].id}`);
        
        // Step 3: Send template
        console.log('\n3️⃣ Sending template message...');
        
        const templateMessage = {
            messaging_product: 'whatsapp',
            to: yourNumber,
            type: 'template',
            template: {
                name: 'hello_world',
                language: { code: 'en_US' }
            }
        };
        
        const templateResponse = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            templateMessage,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Template sent: ${templateResponse.data.messages[0].id}`);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        // If we get 24-hour window error, it confirms messages are trying to send
        if (error.response?.data?.error?.message?.includes('24 hours')) {
            console.log('\n⚠️ 24-hour window restriction detected');
            console.log('This means:');
            console.log('1. The API is working correctly');
            console.log('2. You need to message the business first');
            console.log('3. Or wait for template approval');
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📱 CHECK YOUR WHATSAPP NOW!');
    console.log('=' .repeat(60));
    console.log('\nOn phone number: 9765071249');
    console.log('\n1. Look for messages from: +91 76666 84471');
    console.log('2. Check the name: Your Jarvis Daily Assistant');
    console.log('3. Check these folders:');
    console.log('   - Main chat list');
    console.log('   - Business messages tab');
    console.log('   - Message requests');
    console.log('   - Spam folder');
    console.log('\n4. If nothing appears:');
    console.log('   - Send "Hi" to +91 76666 84471 first');
    console.log('   - Then run this script again');
    
    console.log('\n💡 IMPORTANT DISCOVERY:');
    console.log('The business WhatsApp number is: +91 76666 84471');
    console.log('NOT the number in your profile (9765071249)');
    console.log('Messages are sent FROM the business TO you');
}

// Run test
sendTestMessages().catch(console.error);