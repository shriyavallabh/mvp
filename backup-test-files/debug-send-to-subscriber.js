const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Debug and send to subscriber with different approaches
 */

const axios = require('axios');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function checkMessageStatus(messageId) {
    console.log('\n🔍 Checking message status...');
    try {
        const url = `https://graph.facebook.com/${config.apiVersion}/${messageId}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${config.accessToken}` }
        });
        console.log('Message status:', response.data);
    } catch (error) {
        console.log('Could not fetch message status');
    }
}

async function tryDifferentTemplate() {
    console.log('\n🔄 Trying with UTILITY template (better deliverability)...\n');
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    // Try the UTILITY category template instead
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
        type: 'template',
        template: {
            name: 'finadvise_utility_v1757563556085', // UTILITY template
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
                        { type: 'text', text: 'Dear Subscriber' },        // {{1}} - Name
                        { type: 'text', text: 'January 11, 2025' },       // {{2}} - Date
                        { type: 'text', text: '52,75,000' },              // {{3}} - Portfolio Value
                        { type: 'text', text: '+2.8%' }                   // {{4}} - Today's Change
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
            console.log('✅ UTILITY template sent successfully!');
            console.log('Message ID:', response.data.messages[0].id);
            return response.data.messages[0].id;
        }
    } catch (error) {
        console.error('❌ UTILITY template also failed:', error.response?.data?.error?.message);
    }
}

async function trySimpleTextTemplate() {
    console.log('\n🔄 Trying simple text template...\n');
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    // Try hello_world template as last resort
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
        type: 'template',
        template: {
            name: 'hello_world',
            language: { code: 'en_US' }
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
            console.log('✅ Hello World template sent!');
            console.log('Message ID:', response.data.messages[0].id);
            return response.data.messages[0].id;
        }
    } catch (error) {
        console.error('❌ Hello World template failed:', error.response?.data?.error?.message);
    }
}

async function checkNumberStatus() {
    console.log('\n📱 Checking if number is registered on WhatsApp...\n');
    
    // First, let's verify the number format and status
    const numbers = [
        '919022810769',  // With country code
        '9022810769',    // Without country code
    ];

    for (const number of numbers) {
        console.log(`Testing format: ${number}`);
        
        try {
            // Try sending to each format
            const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: number,
                type: 'template',
                template: {
                    name: 'hello_world',
                    language: { code: 'en_US' }
                }
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.messages?.[0]?.id) {
                console.log(`✅ SUCCESS with format: ${number}`);
                console.log(`Message ID: ${response.data.messages[0].id}`);
                console.log(`Contact status:`, response.data.contacts?.[0]);
                return true;
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error;
            if (errorMsg?.code === 131026) {
                console.log(`❌ ${number} - Not a WhatsApp user or blocked`);
            } else if (errorMsg?.code === 131047) {
                console.log(`❌ ${number} - Rate limit or marketing cap reached`);
            } else {
                console.log(`❌ ${number} - ${errorMsg?.message || 'Unknown error'}`);
            }
        }
    }
}

async function main() {
    console.log('\n🔍 DEBUGGING WHATSAPP DELIVERY ISSUE');
    console.log('=' .repeat(60));
    console.log('Recipient: 9022810769');
    console.log('Previous Message ID: wamid.HBgMOTE5MDIyODEwNzY5FQIAERgSN0JDNDA4NkEwNEIwNzQ5NzMwAA==\n');

    // Step 1: Check number status
    await checkNumberStatus();

    // Step 2: Try UTILITY template (better deliverability)
    await tryDifferentTemplate();

    // Step 3: Try simple text template
    await trySimpleTextTemplate();

    console.log('\n' + '=' .repeat(60));
    console.log('📊 TROUBLESHOOTING SUMMARY:\n');
    console.log('Possible reasons for non-delivery:');
    console.log('1. ❓ Number not registered on WhatsApp');
    console.log('2. ⏱️  Delivery delay (can take 1-5 minutes)');
    console.log('3. 🚫 User has blocked the business number');
    console.log('4. 📵 Marketing message cap reached for user');
    console.log('5. 🔕 User opted out previously');
    console.log('6. 📱 WhatsApp not active on the device');
    console.log('\nPlease verify:');
    console.log('• Is 9022810769 an active WhatsApp number?');
    console.log('• Has this number received messages from 574744175733556 before?');
    console.log('• Check if any messages arrived after a few minutes delay');
}

main().catch(console.error);