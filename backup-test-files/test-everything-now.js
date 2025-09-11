const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * COMPLETE TEST SUITE - Text and Images
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🧪 COMPLETE TEST SUITE');
console.log('=' .repeat(70));

async function sendTestButton() {
    console.log('\n1️⃣ Sending Get Images button...');
    
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919022810769',
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: '🖼️ Visual Content Ready'
                    },
                    body: {
                        text: `Your daily visual package includes:
                        
• Market analysis chart
• Investment portfolio guide
• Tax saving checklist

Click below to receive images.`
                    },
                    action: {
                        buttons: [{
                            type: 'reply',
                            reply: {
                                id: 'UNLOCK_MEDIA_TEST_' + Date.now(),
                                title: '📸 Get Images'
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
        
        console.log('   ✅ Button sent!');
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data || error.message);
    }
}

async function sendTestPrompts() {
    console.log('\n2️⃣ Sending text prompts...');
    
    const prompts = [
        "Try these messages:",
        "• Hello",
        "• How's market today?",
        "• I don't like today's content",
        "• Send mutual fund tips",
        "• Help"
    ];
    
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919022810769',
                type: 'text',
                text: {
                    body: prompts.join('\n')
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('   ✅ Test prompts sent!');
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data || error.message);
    }
}

async function main() {
    await sendTestButton();
    await sendTestPrompts();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📋 TEST INSTRUCTIONS');
    console.log('=' .repeat(70));
    
    console.log('\n✅ WHAT TO TEST:');
    
    console.log('\n1. CLICK "📸 Get Images" button');
    console.log('   Expected: 3 images with captions');
    
    console.log('\n2. SEND "Hello"');
    console.log('   Expected: Friendly greeting (NOT repetitive message)');
    
    console.log('\n3. SEND "How\'s market today?"');
    console.log('   Expected: Actual market data with numbers');
    
    console.log('\n4. SEND "I don\'t like today\'s content"');
    console.log('   Expected: Asks what you prefer, offers options');
    
    console.log('\n5. SEND "mutual funds"');
    console.log('   Expected: MF recommendations with actual fund names');
    
    console.log('\n❌ WHAT SHOULD NOT HAPPEN:');
    console.log('   • No "Thank you for your message" repetition');
    console.log('   • No echoing your message back');
    console.log('   • Images should be actual images, not text');
    
    console.log('\n🎯 IMPROVEMENTS MADE:');
    console.log('   • Fixed repetitive responses');
    console.log('   • Added real market data');
    console.log('   • Proper image delivery');
    console.log('   • Context-aware responses');
}

main().catch(console.error);