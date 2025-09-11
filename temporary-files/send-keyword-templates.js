const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send templates with keyword instructions
 * Advisors can reply with "UNLOCK" to get content
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n📱 SENDING KEYWORD-BASED UNLOCK TEMPLATES');
console.log('=' .repeat(60));

async function sendInstructionMessage(advisor) {
    const payload = {
        messaging_product: 'whatsapp',
        to: advisor.phone.replace('+', ''),
        type: 'text',
        text: {
            body: `Hi ${advisor.name}! 🎯\n\n` +
                  `Your daily financial content is ready!\n\n` +
                  `To receive your content package with:\n` +
                  `• LinkedIn posts\n` +
                  `• Instagram content\n` +
                  `• Market insights\n` +
                  `• WhatsApp status updates\n\n` +
                  `Simply reply with: UNLOCK\n\n` +
                  `_Content will be delivered instantly!_`
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
    const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));
    
    const advisors = [
        ...subscriberData.subscribers,
        { name: 'Test User', phone: '919022810769', segment: 'Premium' }
    ];
    
    console.log('Sending keyword-based unlock instructions...\n');
    
    for (const advisor of advisors) {
        console.log(`📤 Sending to ${advisor.name} (${advisor.phone})...`);
        
        const result = await sendInstructionMessage(advisor);
        
        if (result.success) {
            console.log(`   ✅ Instructions sent!`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n✅ INSTRUCTIONS SENT!');
    console.log('\n📱 Advisors can now:');
    console.log('1. Read the message about content availability');
    console.log('2. Reply with "UNLOCK" (or "unlock", "Unlock")');
    console.log('3. Receive all content automatically!');
    console.log('\nThis bypasses the button issue completely!');
}

main().catch(console.error);