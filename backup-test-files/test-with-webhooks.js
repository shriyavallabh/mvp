const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send test message and check webhook for actual delivery status
 * This will reveal error codes 131049 (marketing limit) or 131026 (user state issue)
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v23.0'
};

/**
 * Send the approved media template to test delivery
 */
async function sendTestMessage(recipient) {
    console.log(`\n📨 Sending media template to ${recipient.name} (${recipient.phone})...`);
    
    const message = {
        messaging_product: 'whatsapp',
        to: recipient.phone,
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
                            link: 'https://via.placeholder.com/1200x628/0891b2/ffffff?text=Financial+Update+Test'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: recipient.name },
                        { type: 'text', text: '50,00,000' },
                        { type: 'text', text: '+18.5' },
                        { type: 'text', text: 'Portfolio rebalancing recommended' },
                        { type: 'text', text: '22,850 (+3.8%)' },
                        { type: 'text', text: '74,500 (+3.2%)' }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [
                        { type: 'text', text: Date.now().toString() }
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
        
        console.log('✅ API Response: SUCCESS');
        console.log(`   Message ID: ${response.data.messages[0].id}`);
        console.log(`   Contact: ${response.data.contacts[0].wa_id}`);
        
        // Save for webhook tracking
        const testLog = {
            timestamp: new Date().toISOString(),
            recipient: recipient.name,
            phone: recipient.phone,
            messageId: response.data.messages[0].id,
            apiStatus: 'SUCCESS',
            webhookStatus: 'PENDING'
        };
        
        fs.appendFileSync(
            'test-message-log.json',
            JSON.stringify(testLog) + '\n'
        );
        
        return response.data.messages[0].id;
        
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Main test flow
 */
async function main() {
    console.log('🚀 TESTING MESSAGE DELIVERY WITH WEBHOOK MONITORING');
    console.log('=' .repeat(60));
    console.log('Sending messages and monitoring webhook for real status');
    console.log('=' .repeat(60));
    
    // Test recipients
    const recipients = [
        { name: 'Avalok', phone: '919765071249' },
        { name: 'Shruti', phone: '919673758777' },
        { name: 'Vidyadhar', phone: '918975758513' }
    ];
    
    console.log('\n📋 Test Plan:');
    console.log('1. Send approved media template to all recipients');
    console.log('2. Monitor webhook for delivery status');
    console.log('3. Look for error codes:');
    console.log('   - 131049 = Per-user marketing limit reached');
    console.log('   - 131026 = User state issue (blocked/old app)');
    
    const messageIds = [];
    
    for (const recipient of recipients) {
        const messageId = await sendTestMessage(recipient);
        if (messageId) {
            messageIds.push({
                recipient: recipient.name,
                messageId: messageId
            });
        }
        
        // Wait 3 seconds between sends
        if (recipient !== recipients[recipients.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 MESSAGES SENT - NOW CHECK WEBHOOK OUTPUT');
    console.log('=' .repeat(60));
    
    console.log('\n📝 Message IDs to track:');
    messageIds.forEach(m => {
        console.log(`   ${m.recipient}: ${m.messageId}`);
    });
    
    console.log('\n⏳ IMPORTANT: Watch the webhook server output!');
    console.log('Within 5-30 seconds you should see:');
    console.log('1. Delivery status updates');
    console.log('2. Error codes if delivery failed');
    console.log('3. Specific reason why images aren\'t delivering');
    
    console.log('\n🔍 Expected error codes:');
    console.log('- 131049: "Meta chose not to deliver" (marketing limit)');
    console.log('- 131026: "Message undeliverable" (user issue)');
    
    console.log('\n📱 Also check WhatsApp on 9765071249');
    console.log('From: +91 76666 84471');
}

// Execute
main().catch(console.error);