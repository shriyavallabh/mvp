const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * TEST MEDIA DELIVERY
 * Sends UTILITY template with media unlock
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🖼️ TESTING MEDIA DELIVERY FLOW');
console.log('=' .repeat(70));
console.log('This will send UTILITY template → Click → Deliver IMAGES\n');

async function sendMediaUnlockTemplate(advisorPhone, advisorName) {
    console.log(`📤 Sending media unlock template to ${advisorName}...`);
    
    const buttonId = `UNLOCK_MEDIA_${Date.now()}`;
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: advisorPhone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: '🎨 Premium Visual Content'
                    },
                    body: {
                        text: `Good morning ${advisorName}!

Your daily visual content package includes:

📊 *Market Analysis Chart*
Real-time market snapshot with key indices

💰 *Investment Strategy Infographic*
Portfolio allocation guide for clients

📋 *Tax Saving Visual Guide*
FY 2024-25 deductions at a glance

All images are high-quality, shareable, and include captions for easy forwarding to clients.

Click below to receive your visual content package.`
                    },
                    footer: {
                        text: 'FinAdvise - Visual Marketing Tools'
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: buttonId,
                                    title: '🖼️ Get Images'
                                }
                            }
                        ]
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
        
        console.log(`   ✅ Sent! Message ID: ${response.data.messages?.[0]?.id}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed:`, error.response?.data || error.message);
        return false;
    }
}

async function main() {
    // Test with both numbers
    const advisors = [
        { phone: '919022810769', name: 'Test Advisor' },
        { phone: '919765071249', name: 'Avalok' }
    ];
    
    for (const advisor of advisors) {
        await sendMediaUnlockTemplate(advisor.phone, advisor.name);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 TEST INSTRUCTIONS');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣ CHECK WHATSAPP');
    console.log('   You should see "Premium Visual Content" message');
    
    console.log('\n2️⃣ CLICK "🖼️ Get Images" button');
    
    console.log('\n3️⃣ YOU WILL RECEIVE:');
    console.log('   • Image 1: Market Analysis Chart');
    console.log('   • Image 2: Investment Strategy Infographic');
    console.log('   • Image 3: Tax Saving Visual Guide');
    console.log('   • Follow-up text with instructions');
    
    console.log('\n✅ SUCCESS CRITERIA:');
    console.log('   - All 3 images delivered with captions');
    console.log('   - Images are high quality and shareable');
    console.log('   - Captions include actionable content');
    console.log('   - No 24-hour window restriction');
    
    console.log('\n📊 PRODUCTION PLAN FOR MEDIA:');
    console.log('   1. Create custom branded images daily');
    console.log('   2. Use Canva/Figma templates for consistency');
    console.log('   3. Include advisor branding options');
    console.log('   4. Update data daily (market prices, etc.)');
    console.log('   5. Store media IDs for faster delivery');
}

main().catch(console.error);