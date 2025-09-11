const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔴 SENDING BUTTON NOW\n');

async function send() {
    // Send to BOTH numbers
    const numbers = ['919765071249', '919022810769'];
    
    for (const number of numbers) {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: number,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: 'CLICK THE BUTTON BELOW RIGHT NOW'
                    },
                    action: {
                        buttons: [{
                            type: 'reply',
                            reply: {
                                id: 'CLICK_NOW_' + Date.now(),
                                title: 'CLICK THIS'
                            }
                        }]
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Sent to ${number} - ID: ${response.data.messages?.[0]?.id}`);
    }
    
    console.log('\n👆 CLICK THE BUTTON "CLICK THIS" ON WHATSAPP NOW!');
}

send().catch(console.error);