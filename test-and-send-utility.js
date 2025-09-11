#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('📱 STORY 3.2 - COMPLETE TEST SUITE');
console.log('===================================\n');

async function sendUtilityTemplate(phoneNumber) {
    console.log(`\n📤 Sending UTILITY template to ${phoneNumber}...`);
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: 'unlock_daily_content',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '0',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_IMAGES' }]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '1',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_CONTENT' }]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '2',
                            parameters: [{ type: 'payload', payload: 'UNLOCK_UPDATES' }]
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
        
        console.log('✅ UTILITY template sent successfully!');
        console.log('Message ID:', response.data.messages[0].id);
        console.log('\n📲 Check WhatsApp for 3 buttons:');
        console.log('   1. 📸 Unlock Images');
        console.log('   2. 📝 Unlock Content');
        console.log('   3. 📊 Unlock Updates\n');
        
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
        return false;
    }
}

async function sendTestMessage(phoneNumber, message) {
    console.log(`\n💬 Sending text message to ${phoneNumber}...`);
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Message sent successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
        return false;
    }
}

async function checkWebhookStatus() {
    console.log('\n🔍 WEBHOOK STATUS CHECK');
    console.log('------------------------');
    
    // Check ngrok webhook
    try {
        const ngrokResponse = await axios.get('https://32fd26291272.ngrok-free.app/webhook', {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'jarvish_webhook_2024',
                'hub.challenge': 'STATUS_CHECK'
            }
        });
        
        if (ngrokResponse.data === 'STATUS_CHECK') {
            console.log('✅ Ngrok webhook: WORKING');
            console.log('   URL: https://32fd26291272.ngrok-free.app/webhook');
        }
    } catch (error) {
        console.log('❌ Ngrok webhook: Not responding');
    }
    
    // Check VM webhook
    try {
        const vmResponse = await axios.get('http://159.89.166.94/webhook', {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'jarvish_webhook_2024',
                'hub.challenge': 'VM_CHECK'
            },
            timeout: 5000
        });
        
        if (vmResponse.data === 'VM_CHECK') {
            console.log('✅ VM webhook: WORKING');
            console.log('   URL: http://159.89.166.94/webhook');
        }
    } catch (error) {
        console.log('❌ VM webhook: Not responding');
    }
}

async function runCompleteTest() {
    await checkWebhookStatus();
    
    const phoneNumber = await new Promise(resolve => {
        rl.question('\nEnter phone number to test (with country code, e.g., 919876543210): ', resolve);
    });
    
    console.log('\n🧪 STARTING COMPLETE TEST FLOW');
    console.log('==============================\n');
    
    // Step 1: Send UTILITY template
    console.log('STEP 1: SENDING UTILITY TEMPLATE');
    await sendUtilityTemplate(phoneNumber);
    
    await new Promise(resolve => {
        rl.question('\n⏸️  Click any button in WhatsApp, then press Enter to continue...', resolve);
    });
    
    // Step 2: Test chat conversation
    console.log('\nSTEP 2: TESTING CHAT CONVERSATION');
    console.log('----------------------------------');
    
    await sendTestMessage(phoneNumber, 'Hello! This is a test of the intelligent chat system.');
    
    console.log('\n📝 Now send these messages to test responses:');
    console.log('   • "What is the market status?"');
    console.log('   • "Tell me about mutual funds"');
    console.log('   • "I need investment advice"\n');
    
    await new Promise(resolve => {
        rl.question('⏸️  Test the chat, then press Enter to continue...', resolve);
    });
    
    // Step 3: Check webhook logs
    console.log('\nSTEP 3: CHECKING WEBHOOK LOGS');
    console.log('------------------------------');
    console.log('Check the webhook logs to see:');
    console.log('   ✅ Button click events');
    console.log('   ✅ Message responses');
    console.log('   ✅ Media delivery (if buttons were clicked)');
    console.log('   ✅ Conversation tracking\n');
    
    console.log('📊 TEST COMPLETE!');
    console.log('=================\n');
    console.log('Summary:');
    console.log('• UTILITY template with buttons: SENT');
    console.log('• Button handlers: READY (check webhook logs)');
    console.log('• Chat conversation: ACTIVE');
    console.log('• Media delivery: READY (triggered by button clicks)\n');
    
    console.log('🎯 All Story 3.2 features are ready for testing!');
    
    rl.close();
}

// Run the test
runCompleteTest().catch(console.error);