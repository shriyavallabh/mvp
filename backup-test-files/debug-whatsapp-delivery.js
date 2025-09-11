const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Debug WhatsApp Delivery Issues
 * Let's figure out why messages aren't being received
 */

const axios = require('axios');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: 'v18.0'
};

async function checkPhoneNumberStatus() {
    console.log('🔍 CHECKING WHATSAPP PHONE NUMBER STATUS');
    console.log('=' .repeat(60));
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const data = response.data;
        console.log('\n📱 Phone Number Details:');
        console.log(`   Display Number: ${data.display_phone_number}`);
        console.log(`   Verified Name: ${data.verified_name}`);
        console.log(`   Quality Rating: ${data.quality_rating || 'UNKNOWN'}`);
        console.log(`   Status: ${data.account_mode || 'UNKNOWN'}`);
        console.log(`   ID: ${data.id}`);
        
        // Check if number is verified
        if (data.code_verification_status) {
            console.log(`   Verification: ${data.code_verification_status}`);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error checking phone status:', error.response?.data || error.message);
        return null;
    }
}

async function getMessageStatus(messageId) {
    console.log(`\n📊 Checking message status: ${messageId}`);
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${messageId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        console.log('   Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('   ❌ Error:', error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function sendSimpleTextMessage() {
    console.log('\n📨 SENDING SIMPLE TEST MESSAGE');
    console.log('=' .repeat(60));
    
    const testNumber = '919765071249'; // Your number
    
    // Try 1: Send using hello_world template (we know this exists and is approved)
    console.log('\nTest 1: Using hello_world template...');
    
    const helloMessage = {
        messaging_product: 'whatsapp',
        to: testNumber,
        type: 'template',
        template: {
            name: 'hello_world',
            language: { code: 'en_US' }
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            helloMessage,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const messageId = response.data.messages[0].id;
        console.log(`   ✅ Sent successfully!`);
        console.log(`   Message ID: ${messageId}`);
        console.log(`   Recipient: ${response.data.contacts[0].wa_id}`);
        
        // Wait and check status
        await new Promise(resolve => setTimeout(resolve, 3000));
        await getMessageStatus(messageId);
        
        return messageId;
    } catch (error) {
        console.error(`   ❌ Failed:`, error.response?.data || error.message);
        return null;
    }
}

async function checkBusinessAccount() {
    console.log('\n🏢 CHECKING BUSINESS ACCOUNT');
    console.log('=' .repeat(60));
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        console.log('Business Account Info:');
        console.log(`   Name: ${response.data.name}`);
        console.log(`   ID: ${response.data.id}`);
        console.log(`   Timezone: ${response.data.timezone_id}`);
        
        // Check message template limit
        if (response.data.message_template_namespace) {
            console.log(`   Template Namespace: ${response.data.message_template_namespace}`);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testDirectAPI() {
    console.log('\n🔧 TESTING DIRECT API CALL');
    console.log('=' .repeat(60));
    
    // Test with the exact format from WhatsApp docs
    const testPayload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": "919765071249",
        "type": "text",
        "text": {
            "preview_url": false,
            "body": "TEST: This is a direct API test message. If you receive this, the API is working."
        }
    };
    
    console.log('Sending direct text (no template)...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            testPayload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.error_data?.details) {
            console.log('\n⚠️ Error Details:', error.response.data.error.error_data.details);
        }
        
        // Check if it's a 24-hour window issue
        if (error.response?.data?.error?.message?.includes('24 hours')) {
            console.log('\n💡 This confirms the API works but needs template or user message first');
            return 'NEEDS_TEMPLATE';
        }
        
        return null;
    }
}

async function listRecentMessages() {
    console.log('\n📜 CHECKING RECENT MESSAGE HISTORY');
    console.log('=' .repeat(60));
    
    // Get conversation ID for the test number
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/conversations?platform=whatsapp`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        if (response.data.data && response.data.data.length > 0) {
            console.log(`Found ${response.data.data.length} conversations`);
            response.data.data.forEach(conv => {
                console.log(`   Contact: ${conv.contact?.wa_id || 'Unknown'}`);
                console.log(`   Last update: ${conv.updated_time}`);
            });
        } else {
            console.log('No conversations found');
        }
    } catch (error) {
        console.log('Could not fetch conversations:', error.response?.data?.error?.message || error.message);
    }
}

async function runFullDiagnostics() {
    console.log('🏥 RUNNING FULL WHATSAPP DIAGNOSTICS');
    console.log('=' .repeat(60));
    console.log(`Target Number: 919765071249`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('=' .repeat(60));
    
    // 1. Check phone number status
    const phoneStatus = await checkPhoneNumberStatus();
    
    // 2. Check business account
    const businessAccount = await checkBusinessAccount();
    
    // 3. List recent messages
    await listRecentMessages();
    
    // 4. Send simple test message
    const messageId = await sendSimpleTextMessage();
    
    // 5. Try direct API
    const directResult = await testDirectAPI();
    
    // Diagnosis
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 DIAGNOSIS RESULTS');
    console.log('=' .repeat(60));
    
    if (phoneStatus) {
        console.log('✅ Phone number is configured');
        
        if (phoneStatus.quality_rating === 'RED' || phoneStatus.quality_rating === 'YELLOW') {
            console.log('⚠️ ISSUE: Quality rating is not GREEN');
            console.log('   This might limit message delivery');
        }
    } else {
        console.log('❌ Could not verify phone number');
    }
    
    if (messageId) {
        console.log('✅ Template messages are being sent');
        console.log('   But may not be delivered due to:');
        console.log('   1. WhatsApp spam filters');
        console.log('   2. User blocked the number');
        console.log('   3. Messages going to spam/requests folder');
    }
    
    if (directResult === 'NEEDS_TEMPLATE') {
        console.log('✅ API is working correctly');
        console.log('   24-hour window restriction is active');
    }
    
    console.log('\n📱 ACTIONS TO CHECK ON YOUR PHONE:');
    console.log('1. Open WhatsApp on 9765071249');
    console.log('2. Search for the business number');
    console.log('3. Check "Message Requests" or "Spam" folder');
    console.log('4. Check if you have blocked any business numbers');
    console.log('5. Try sending "Hi" to the business number first');
    
    console.log('\n💡 SOLUTION:');
    console.log('If messages are being sent but not received:');
    console.log('1. The recipient needs to initiate conversation first');
    console.log('2. Or check WhatsApp Business/Requests folder');
    console.log('3. Or the number might be filtered as spam');
}

// Run diagnostics
runFullDiagnostics().catch(console.error);