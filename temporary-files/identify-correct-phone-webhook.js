const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * IDENTIFY: Which phone number we're using and fix its webhook
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
};

console.log('\n🔍 IDENTIFYING PHONE NUMBER AND WEBHOOK CONFIGURATION');
console.log('=' .repeat(70));

/**
 * Step 1: Get phone number details
 */
async function getPhoneNumberDetails() {
    console.log('\n1️⃣ Getting details for Phone Number ID: 574744175733556\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}`;
    
    try {
        const response = await axios.get(url, {
            params: {
                fields: 'display_phone_number,verified_name,id,quality_rating,status,name_status,code_verification_status'
            },
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        console.log('Phone Number Details:');
        console.log(`   Display Number: ${response.data.display_phone_number}`);
        console.log(`   Verified Name: ${response.data.verified_name}`);
        console.log(`   Quality Rating: ${response.data.quality_rating}`);
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Name Status: ${response.data.name_status}`);
        console.log(`   Code Verification: ${response.data.code_verification_status}`);
        
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Step 2: Get ALL phone numbers in the WABA
 */
async function getAllPhoneNumbers() {
    console.log('\n2️⃣ Getting ALL phone numbers in your WABA...\n');
    
    const url = `https://graph.facebook.com/v21.0/${CONFIG.businessAccountId}/phone_numbers`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        const phoneNumbers = response.data.data || [];
        console.log(`Found ${phoneNumbers.length} phone number(s):\n`);
        
        for (const phone of phoneNumbers) {
            console.log(`   • ${phone.display_phone_number || 'Unknown'}`);
            console.log(`     ID: ${phone.id}`);
            console.log(`     Verified Name: ${phone.verified_name || 'N/A'}`);
            console.log(`     Status: ${phone.quality_rating || 'N/A'}\n`);
        }
        
        return phoneNumbers;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return [];
    }
}

/**
 * Step 3: Send test message to identify which phone we're using
 */
async function sendTestMessage() {
    console.log('\n3️⃣ Sending test message to identify active phone...\n');
    
    const testNumbers = [
        '919765071249',  // Avalok
        '919022810769'   // Test User
    ];
    
    for (const number of testNumbers) {
        try {
            const response = await axios.post(
                `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: number,
                    type: 'text',
                    text: {
                        body: `Test: Identifying phone number for ID ${CONFIG.phoneNumberId}`
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ Message sent to ${number}`);
            console.log(`   Check which phone number shows as sender!`);
            
        } catch (error) {
            console.log(`❌ Failed to send to ${number}`);
        }
    }
}

/**
 * Main function
 */
async function main() {
    // Get phone details
    const phoneDetails = await getPhoneNumberDetails();
    
    // Get all phones
    const allPhones = await getAllPhoneNumbers();
    
    // Send test
    await sendTestMessage();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 ANALYSIS');
    console.log('=' .repeat(70));
    
    console.log('\n✅ FINDINGS:');
    if (phoneDetails?.display_phone_number) {
        console.log(`Phone Number ID 574744175733556 = ${phoneDetails.display_phone_number}`);
        
        // Match with your screenshot
        const phoneMap = {
            '+15550188463': 'Test Number',
            '+919022473943': 'The Skin Rules',
            '+917666684471': 'Your Jarvis Daily Assistant'
        };
        
        const phoneName = phoneMap[phoneDetails.display_phone_number.replace(/\s/g, '')];
        if (phoneName) {
            console.log(`This is: "${phoneName}"`);
        }
    }
    
    console.log('\n📱 CHECK YOUR WHATSAPP:');
    console.log('The test message will show which phone is sending');
    console.log('This confirms which phone corresponds to ID 574744175733556');
}

main().catch(console.error);