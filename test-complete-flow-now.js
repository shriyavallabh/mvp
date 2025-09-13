#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function testCompleteFlow() {
    console.log('🚀 TESTING COMPLETE STORY 3.2 FLOW\n');
    
    let testResults = {
        webhookLocal: false,
        templateSend: false,
        textMessage: false,
        contentDelivery: false
    };
    
    // Step 1: Check local webhook health
    console.log('1️⃣ Checking local webhook...');
    try {
        const health = await axios.get('http://localhost:3000/health');
        console.log('✅ Webhook running locally');
        console.log('   Content types:', health.data.contentTypes.join(', '));
        testResults.webhookLocal = true;
    } catch (error) {
        console.log('❌ Webhook not running locally');
        console.log('   Run: node webhook-button-handler.js');
        return;
    }
    
    // Step 2: Send utility template with button
    console.log('\n2️⃣ Sending UTILITY template with button...');
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Markets' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Daily Analysis Ready' }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template sent successfully!');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('   📱 CHECK WHATSAPP - Click "Retrieve Content" button');
        testResults.templateSend = true;
    } catch (error) {
        console.log('❌ Template send failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 3: Send a text message to test content delivery
    console.log('\n3️⃣ Sending text message...');
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'text',
                text: { body: '📊 Today\'s Market Analysis is ready! Click the button above to retrieve.' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Text message sent!');
        testResults.textMessage = true;
    } catch (error) {
        console.log('❌ Text message failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Step 4: Monitor webhook logs
    console.log('\n4️⃣ Monitoring webhook for button clicks...');
    console.log('   Waiting for button click events...');
    console.log('   (Check webhook console for incoming events)');
    
    // Wait and check if content delivery works
    setTimeout(async () => {
        console.log('\n5️⃣ Testing direct content delivery...');
        try {
            const response = await axios.post(
                `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: CONFIG.recipientNumber,
                    type: 'text',
                    text: { 
                        body: `📊 MARKET OVERVIEW - ${new Date().toLocaleDateString()}

📈 EQUITY MARKETS:
• Nifty 50: 19,875 (+1.2%)
• Sensex: 65,432 (+0.9%)

💡 TOP OPPORTUNITIES:
1. Large-cap IT stocks showing strength
2. Banking sector poised for rally

📱 Share this with your clients!`
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Content delivered successfully!');
            testResults.contentDelivery = true;
        } catch (error) {
            console.log('❌ Content delivery failed:', error.response?.data?.error?.message || error.message);
        }
        
        // Final summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        
        console.log('\nSTATUS:');
        console.log(`• Local Webhook: ${testResults.webhookLocal ? '✅' : '❌'}`);
        console.log(`• Template Send: ${testResults.templateSend ? '✅' : '❌'}`);
        console.log(`• Text Message: ${testResults.textMessage ? '✅' : '❌'}`);
        console.log(`• Content Delivery: ${testResults.contentDelivery ? '✅' : '❌'}`);
        
        console.log('\n📱 ACTION REQUIRED:');
        console.log('1. Check WhatsApp for messages');
        console.log('2. Click "Retrieve Content" button');
        console.log('3. Check if content is delivered');
        console.log('4. Monitor webhook console for events');
        
        console.log('\n🔍 WHAT\'S WORKING:');
        if (testResults.templateSend) {
            console.log('• Template messaging system ✅');
            console.log('• WhatsApp API authentication ✅');
            console.log('• Button templates approved ✅');
        }
        
        console.log('\n⚠️  KNOWN ISSUES:');
        console.log('• VM not reachable (159.89.166.94)');
        console.log('• ngrok tunnel pointing to wrong location');
        console.log('• AI chat not implemented (needs 4GB+ RAM)');
        console.log('• CRM tracking not implemented');
        
    }, 5000);
}

// Run the test
testCompleteFlow().catch(console.error);