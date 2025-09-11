const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n💬 PROMPTING FOR TEXT REPLY\n');

async function sendPrompt() {
    const response = await axios.post(
        `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to: '919022810769',
            type: 'text',
            text: {
                body: `📱 CRM CHAT IS NOW ACTIVE!

Try replying with:
• "How are you?"
• "I don't like today's content"
• "Send me mutual fund tips"
• "What time do updates arrive?"
• Any question or feedback

The system will respond intelligently!`
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    console.log('✅ Prompt sent! Now reply to test the chat.');
}

sendPrompt().catch(console.error);