const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CONTINUOUS TEMPLATE SENDER
 * Sends different media templates every 30 seconds until you see them
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

const recipient = '919022810769';
let messageCount = 0;

// Different image URLs to test
const imageUrls = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
    'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg',
    'https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_960_720.jpg'
];

console.log('\n🚀 CONTINUOUS MEDIA TEMPLATE SENDER');
console.log('=' .repeat(70));
console.log('Target: 9022810769 (Check "Shruti Petkar" on WhatsApp Web)');
console.log('Frequency: Every 30 seconds');
console.log('Press Ctrl+C to stop\n');

async function sendAccountUpdateTemplate() {
    messageCount++;
    const imageUrl = imageUrls[messageCount % imageUrls.length];
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n[${timestamp}] Attempt #${messageCount}`);
    console.log('Template: finadvise_account_update_v1757563699228');
    console.log(`Image: ${imageUrl.substring(0, 50)}...`);
    
    const payload = {
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
                        image: { link: imageUrl }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: `Test ${messageCount}` },
                        { type: 'text', text: new Date().toLocaleDateString() },
                        { type: 'text', text: `${50 + messageCount},00,000` },
                        { type: 'text', text: `+${(Math.random() * 5).toFixed(1)}%` },
                        { type: 'text', text: `Action item #${messageCount}` }
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
            console.log(`✅ Sent! ID: ${response.data.messages[0].id}`);
            console.log('📱 CHECK WHATSAPP WEB - "Shruti Petkar" chat');
            return true;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error?.message || 'Unknown'}`);
    }
    
    return false;
}

async function sendUtilityTemplate() {
    messageCount++;
    const imageUrl = imageUrls[messageCount % imageUrls.length];
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n[${timestamp}] Attempt #${messageCount}`);
    console.log('Template: finadvise_utility_v1757563556085');
    console.log(`Image: ${imageUrl.substring(0, 50)}...`);
    
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
                        image: { link: imageUrl }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: `User ${messageCount}` },
                        { type: 'text', text: new Date().toLocaleDateString() },
                        { type: 'text', text: `${45 + messageCount},00,000` },
                        { type: 'text', text: `+${(Math.random() * 3).toFixed(1)}%` }
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
            console.log(`✅ Sent! ID: ${response.data.messages[0].id}`);
            console.log('📱 CHECK WHATSAPP WEB - "Shruti Petkar" chat');
            return true;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error?.message || 'Unknown'}`);
    }
    
    return false;
}

async function sendMarketingTemplate() {
    messageCount++;
    const imageUrl = imageUrls[messageCount % imageUrls.length];
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n[${timestamp}] Attempt #${messageCount}`);
    console.log('Template: finadvise_daily_v1757531949615 (with button)');
    console.log(`Image: ${imageUrl.substring(0, 50)}...`);
    
    const payload = {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615',
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { link: imageUrl }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: `Tester ${messageCount}` },
                        { type: 'text', text: `${60 + messageCount},00,000` },
                        { type: 'text', text: `+${(10 + Math.random() * 10).toFixed(1)}` },
                        { type: 'text', text: `Focus area #${messageCount}` },
                        { type: 'text', text: `22,${100 + messageCount} (+2.${messageCount}%)` },
                        { type: 'text', text: `73,${500 + messageCount} (+2.${messageCount}%)` }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{
                        type: 'text',
                        text: `report-${messageCount}-${Date.now()}`
                    }]
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
            console.log(`✅ Sent! ID: ${response.data.messages[0].id}`);
            console.log('📱 CHECK WHATSAPP WEB - "Shruti Petkar" chat');
            return true;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error?.message || 'Unknown'}`);
    }
    
    return false;
}

async function continuousSend() {
    console.log('Starting continuous sending...\n');
    console.log('🔍 Open WhatsApp Web and look for "Shruti Petkar" chat');
    console.log('🔍 Messages should appear from 574744175733556\n');
    
    // Rotate between different templates
    const templates = [
        sendAccountUpdateTemplate,
        sendUtilityTemplate,
        sendMarketingTemplate
    ];
    
    let index = 0;
    
    const interval = setInterval(async () => {
        const sendFunction = templates[index % templates.length];
        await sendFunction();
        index++;
        
        console.log(`\n⏱️  Next attempt in 30 seconds...`);
        console.log(`📊 Total messages sent: ${messageCount}`);
        
    }, 30000); // Every 30 seconds
    
    // Send first message immediately
    await templates[0]();
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n\n🛑 Stopped continuous sending');
        console.log(`📊 Total messages attempted: ${messageCount}`);
        process.exit(0);
    });
}

// Start continuous sending
continuousSend().catch(console.error);