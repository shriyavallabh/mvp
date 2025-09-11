const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Direct test to deliver content immediately
 * Simulates what should happen when button is clicked
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

async function sendMessage(to, message) {
    const url = `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace('+', ''),
        ...message
    };
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Message sent: ${response.data.messages?.[0]?.id}`);
        return response.data;
        
    } catch (error) {
        console.error(`❌ Error:`, error.response?.data || error.message);
        throw error;
    }
}

async function deliverContentToShruti() {
    console.log('\n🚀 TESTING DIRECT DELIVERY TO SHRUTI (9673758777)');
    console.log('=' .repeat(60));
    
    const phoneNumber = '919673758777';
    const advisorName = 'Shruti';
    
    try {
        // Check if we can send a simple message first
        console.log('\n1️⃣ Sending test message...');
        await sendMessage(phoneNumber, {
            type: 'text',
            text: {
                body: `🔓 Test: Content delivery system check for ${advisorName}`
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Send the actual content
        console.log('2️⃣ Sending unlock confirmation...');
        await sendMessage(phoneNumber, {
            type: 'text',
            text: {
                body: `🎯 *Content Unlocked Successfully!*\n\n` +
                      `Hi ${advisorName}, your button click was received!\n\n` +
                      `Here's your daily financial content for sharing:`
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Send LinkedIn content
        console.log('3️⃣ Sending LinkedIn content...');
        await sendMessage(phoneNumber, {
            type: 'text',
            text: {
                body: `*📘 LINKEDIN POST*\n\n` +
                      `Market Alert 📊\n\n` +
                      `The equity markets are showing strong momentum with IT and Banking sectors leading.\n\n` +
                      `Key Highlights:\n` +
                      `• Sensex up 0.5%\n` +
                      `• Banking index at 52-week high\n` +
                      `• FII inflows continue\n\n` +
                      `Is your portfolio positioned for this rally? Let's discuss!\n\n` +
                      `#StockMarket #Investing #WealthManagement`
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Send image content
        console.log('4️⃣ Sending visual content...');
        await sendMessage(phoneNumber, {
            type: 'image',
            image: {
                link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
                caption: '📈 Market Performance Dashboard'
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Send completion
        console.log('5️⃣ Sending instructions...');
        await sendMessage(phoneNumber, {
            type: 'text',
            text: {
                body: `✅ *CONTENT DELIVERED!*\n\n` +
                      `You can now:\n` +
                      `• Copy and share on LinkedIn\n` +
                      `• Forward to clients\n` +
                      `• Save for later use\n\n` +
                      `🔔 Fresh content daily!`
            }
        });
        
        console.log('\n✅ All messages sent successfully!');
        console.log('\n📱 Check WhatsApp on 9673758777 (Shruti)');
        console.log('You should see 5 messages with content.');
        
    } catch (error) {
        console.error('\n❌ Delivery failed:', error.message);
    }
}

// Also test the webhook directly
async function testWebhookDirectly() {
    console.log('\n🔧 Testing webhook endpoint directly...');
    
    try {
        const webhookPayload = {
            object: 'whatsapp_business_account',
            entry: [{
                id: 'ENTRY_ID',
                changes: [{
                    field: 'messages',
                    value: {
                        messaging_product: 'whatsapp',
                        messages: [{
                            from: '919673758777',
                            type: 'interactive',
                            interactive: {
                                type: 'button_reply',
                                button_reply: {
                                    id: 'UNLOCK_TEST_CONTENT',
                                    title: 'Retrieve Content'
                                }
                            }
                        }]
                    }
                }]
            }]
        };
        
        const response = await axios.post(
            'https://softball-one-realtor-telecom.trycloudflare.com/webhook',
            webhookPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Webhook test response:', response.status);
        
    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
    }
}

async function main() {
    // First deliver content directly
    await deliverContentToShruti();
    
    // Then test webhook
    await testWebhookDirectly();
}

main().catch(console.error);