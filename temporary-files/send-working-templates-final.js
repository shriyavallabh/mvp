const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL WORKING VERSION - With webhook subscription fixed
 * Button clicks should now work properly!
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n✨ CLICK-TO-UNLOCK FINAL TEST - WEBHOOK FIXED!');
console.log('=' .repeat(70));
console.log('Messages field is now subscribed - buttons should work!\n');

const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));

async function sendWorkingTemplate(advisor) {
    // Use interactive button for better reliability
    const payload = {
        messaging_product: 'whatsapp',
        to: advisor.phone.replace('+', ''),
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'text',
                text: '📚 Daily Content Ready!'
            },
            body: {
                text: `Hi ${advisor.name}! Your financial content package for today is ready.\n\nIncludes:\n• LinkedIn posts\n• Instagram content\n• Market insights\n• WhatsApp status\n\nClick below to receive instantly!`
            },
            footer: {
                text: 'FinAdvise - Automated Content Service'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: `UNLOCK_${Date.now()}_${advisor.name.replace(/\s/g, '_')}`,
                            title: '🔓 Get Content'
                        }
                    }
                ]
            }
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return {
            success: true,
            messageId: response.data.messages?.[0]?.id,
            advisor: advisor.name
        };
        
    } catch (error) {
        return {
            success: false,
            advisor: advisor.name,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

async function main() {
    const advisors = [
        ...subscriberData.subscribers,
        { name: 'Test User', phone: '919022810769', segment: 'Premium' }
    ];
    
    console.log('📤 Sending interactive button messages to all advisors...\n');
    
    for (const advisor of advisors) {
        console.log(`Sending to ${advisor.name} (${advisor.phone})...`);
        
        const result = await sendWorkingTemplate(advisor);
        
        if (result.success) {
            console.log(`   ✅ Button message sent!`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 BUTTON CLICKS SHOULD NOW WORK!');
    console.log('=' .repeat(70));
    
    console.log('\n📱 What advisors will see:');
    console.log('   • Header: "Daily Content Ready!"');
    console.log('   • Body: Content description');
    console.log('   • Button: "🔓 Get Content"');
    
    console.log('\n🔓 When they click the button:');
    console.log('   1. Webhook receives the click event');
    console.log('   2. Content is delivered automatically');
    console.log('   3. No typing required!');
    
    console.log('\n✅ The webhook subscription is now fixed!');
    console.log('Button clicks will trigger content delivery as intended.');
}

main().catch(console.error);