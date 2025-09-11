const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CORRECT WAY to send finadvise_daily_v1757531949615
 * The template has URL button that REQUIRES a parameter
 */

const axios = require('axios');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function sendMediaTemplateCorrectly() {
    console.log('\n✨ SENDING MEDIA TEMPLATE THE CORRECT WAY');
    console.log('=' .repeat(60));
    console.log('Template: finadvise_daily_v1757531949615');
    console.log('Recipient: 9022810769');
    console.log('Key Fix: Including required button parameter\n');

    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
        type: 'template',
        template: {
            name: 'finadvise_daily_v1757531949615',
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
                        { type: 'text', text: 'Dear Subscriber' },         // {{1}} - Name
                        { type: 'text', text: '52,75,000' },              // {{2}} - Portfolio Value
                        { type: 'text', text: '+18.7' },                  // {{3}} - Returns %
                        { type: 'text', text: 'Review your tech portfolio for Q4 gains' }, // {{4}} - Focus
                        { type: 'text', text: '22,250 (+2.8%)' },         // {{5}} - Nifty
                        { type: 'text', text: '73,500 (+2.6%)' }          // {{6}} - Sensex
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',  // First button (View Full Report)
                    parameters: [{
                        type: 'text',
                        text: 'subscriber-report-9022810769'  // REQUIRED: URL suffix
                    }]
                }
                // Note: Phone button (Call Advisor) doesn't need parameters
            ]
        }
    };

    try {
        console.log('📤 Sending with complete parameters...\n');
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log('✅ SUCCESS! Media template sent with image!');
            console.log('=' .repeat(60));
            console.log('\n📱 Delivery Details:');
            console.log('  Message ID:', response.data.messages[0].id);
            console.log('  Recipient: 9022810769');
            console.log('  Template: finadvise_daily_v1757531949615');
            
            console.log('\n📸 What the subscriber will see:');
            console.log('  1. Financial chart image at the top');
            console.log('  2. Personalized message:');
            console.log('     "Good morning Dear Subscriber! 📊"');
            console.log('     "Portfolio Value: ₹52,75,000"');
            console.log('     "Returns: +18.7%"');
            console.log('     "Today\'s Focus: Review your tech portfolio"');
            console.log('     "Nifty: 22,250 (+2.8%)"');
            console.log('     "Sensex: 73,500 (+2.6%)"');
            console.log('  3. Two buttons:');
            console.log('     • "View Full Report" (opens link)');
            console.log('     • "Call Advisor" (initiates call)');
            
            console.log('\n✨ THE ISSUE WAS:');
            console.log('  The URL button requires a parameter for the dynamic');
            console.log('  part of the URL. Without it, the template fails.');
            
            console.log('\n✅ THIS TIME IT SHOULD WORK!');
            console.log('  Please check WhatsApp on 9022810769 now.');
            
            return true;
        }
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        return false;
    }
}

// Also send UTILITY template as backup
async function sendUtilityTemplateAsWell() {
    console.log('\n\n📤 Also sending UTILITY template for comparison...\n');
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
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
                            link: 'https://storage.googleapis.com/msgsndr/0iO3mS8O2ALqgGWCZXm0/media/676be3f81444e55f9d0e8b84.png'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Valued Subscriber' },       // {{1}}
                        { type: 'text', text: 'January 11, 2025' },        // {{2}}
                        { type: 'text', text: '52,75,000' },               // {{3}}
                        { type: 'text', text: '+2.8%' }                    // {{4}}
                    ]
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log('✅ UTILITY template also sent!');
            console.log('  Message ID:', response.data.messages[0].id);
            console.log('  This is a UTILITY category template (better delivery)');
        }
    } catch (error) {
        console.error('❌ UTILITY template failed:', error.response?.data?.error?.message);
    }
}

async function main() {
    // Send the media template correctly
    const success = await sendMediaTemplateCorrectly();
    
    if (success) {
        // Also send UTILITY template for comparison
        await sendUtilityTemplateAsWell();
        
        console.log('\n' + '=' .repeat(60));
        console.log('📱 PLEASE CHECK WHATSAPP NOW');
        console.log('=' .repeat(60));
        console.log('\nYou should receive:');
        console.log('1. Media template with image, text, and buttons');
        console.log('2. UTILITY template with image and text');
        console.log('\nBoth should show images + personalized financial data');
    }
}

main().catch(console.error);