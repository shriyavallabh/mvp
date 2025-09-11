const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send finadvise_daily_v1757531949615 media template to new subscriber
 * This template has IMAGE header + 6 body parameters + buttons
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function sendMediaTemplateToSubscriber() {
    console.log('\n🚀 Sending FinAdvise Daily Media Template');
    console.log('=' .repeat(60));
    console.log('Template: finadvise_daily_v1757531949615');
    console.log('Recipient: 919022810769');
    console.log('Type: Media Template (Image + Content + Buttons)\n');

    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    // Get current date and market data
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769', // Adding 91 country code for India
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
                            // Using a professional financial chart image
                            link: 'https://storage.googleapis.com/msgsndr/0iO3mS8O2ALqgGWCZXm0/media/676be3f81444e55f9d0e8b84.png'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'Valued Subscriber' },      // {{1}} - Name
                        { type: 'text', text: '52,75,000' },              // {{2}} - Portfolio Value
                        { type: 'text', text: '+18.7' },                  // {{3}} - Returns %
                        { type: 'text', text: 'Review tech stock allocation for Q4' }, // {{4}} - Today's Focus
                        { type: 'text', text: '22,250 (+2.8%)' },         // {{5}} - Nifty
                        { type: 'text', text: '73,500 (+2.6%)' }          // {{6}} - Sensex
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{
                        type: 'text',
                        text: 'subscriber-report-' + Date.now() // Dynamic URL parameter for "View Full Report" button
                    }]
                }
            ]
        }
    };

    try {
        console.log('📤 Sending media template with image...\n');
        
        // Log the request details
        console.log('Request Details:');
        console.log('  • Image: Financial chart visualization');
        console.log('  • Portfolio Value: ₹52,75,000');
        console.log('  • Returns: +18.7%');
        console.log('  • Today\'s Focus: Review tech stock allocation for Q4');
        console.log('  • Market Data: Nifty & Sensex included\n');

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            const messageId = response.data.messages[0].id;
            
            console.log('✅ SUCCESS! Message sent successfully');
            console.log('=' .repeat(60));
            console.log('\n📱 Message Details:');
            console.log('  • Recipient: 9022810769');
            console.log('  • Message ID: ' + messageId);
            console.log('  • Template: finadvise_daily_v1757531949615');
            console.log('  • Type: Media Template with Image');
            console.log('  • Status: Delivered to WhatsApp servers');
            
            // Save delivery record
            const deliveryRecord = {
                timestamp: new Date().toISOString(),
                recipient: '919022810769',
                template: 'finadvise_daily_v1757531949615',
                messageId: messageId,
                success: true,
                details: {
                    hasImage: true,
                    hasButtons: true,
                    category: 'MARKETING',
                    parameters: {
                        name: 'Valued Subscriber',
                        portfolio: '₹52,75,000',
                        returns: '+18.7%',
                        focus: 'Review tech stock allocation for Q4'
                    }
                }
            };

            const filename = `delivery-9022810769-${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(deliveryRecord, null, 2));
            
            console.log('\n📁 Delivery record saved: ' + filename);
            console.log('\n✨ The subscriber should receive:');
            console.log('  1. A financial chart image at the top');
            console.log('  2. Personalized portfolio information');
            console.log('  3. Market data (Nifty & Sensex)');
            console.log('  4. "View Full Report" button');
            console.log('  5. "Call Advisor" button\n');
            
            return deliveryRecord;
        } else {
            console.log('⚠️  Unexpected response format:', response.data);
        }

    } catch (error) {
        console.error('\n❌ Failed to send message');
        console.error('Error:', error.response?.data?.error || error.message);
        
        if (error.response?.data?.error?.error_data?.details) {
            console.error('Details:', error.response.data.error.error_data.details);
        }
        
        // Save error record
        const errorRecord = {
            timestamp: new Date().toISOString(),
            recipient: '919022810769',
            template: 'finadvise_daily_v1757531949615',
            success: false,
            error: error.response?.data?.error || error.message
        };
        
        const filename = `error-9022810769-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(errorRecord, null, 2));
        console.log('\n📁 Error record saved: ' + filename);
    }
}

// Execute the send
console.log('\n🎯 FinAdvise WhatsApp Media Template Delivery\n');
sendMediaTemplateToSubscriber().then(() => {
    console.log('📞 Please check WhatsApp on 9022810769 to confirm delivery\n');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});