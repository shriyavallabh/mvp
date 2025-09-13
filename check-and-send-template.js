require('dotenv').config();
const axios = require('axios');

const PHONE_NUMBER_ID = '574744175733556';  // From your .env
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const YOUR_NUMBER = '919765071249';

console.log('🔍 CHECKING WHATSAPP CONFIGURATION\n');

async function checkAndSend() {
    // 1. Check webhook subscription
    console.log('1️⃣ Checking Meta webhook configuration...');
    console.log('   Webhook URL should be: http://159.89.166.94:3000/webhook');
    console.log('   Verify token: jarvish_webhook_2024\n');
    
    // 2. Try to send a test message
    console.log('2️⃣ Sending test message to', YOUR_NUMBER);
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: YOUR_NUMBER,
                type: 'text',
                text: { 
                    body: `🧪 Test Message - ${new Date().toLocaleTimeString()}\n\nThis is a test from your FinAdvise webhook.\n\nIf you receive this, please reply with "Hi" to test the webhook response.`
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Message sent successfully!');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('\n📱 Please check your WhatsApp!');
        console.log('   Then send a message back to test the webhook.\n');
        
    } catch (error) {
        console.log('❌ Failed to send message:', error.response?.data?.error || error.message);
        
        if (error.response?.data?.error?.code === 131031) {
            console.log('\n⚠️  The recipient number is not registered or opted-in.');
            console.log('   Make sure 919765071249 has messaged your WhatsApp Business number first.\n');
        }
    }
    
    // 3. Check what number the webhook is configured for
    console.log('3️⃣ IMPORTANT: Check these settings in Meta Business Manager:');
    console.log('   • Go to: WhatsApp > Configuration > Webhooks');
    console.log('   • Webhook URL: http://159.89.166.94:3000/webhook');
    console.log('   • Verify Token: jarvish_webhook_2024');
    console.log('   • Subscribe to: messages webhook field');
    console.log('   • Make sure webhook is "Active"\n');
    
    console.log('4️⃣ To receive messages, the user must:');
    console.log('   • First message your WhatsApp Business number');
    console.log('   • Or you must use a pre-approved template\n');
}

checkAndSend();
