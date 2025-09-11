const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Use PORT 80 - No port needed in URL!
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 80  // CHANGED TO 80!
};

console.log('\n🚀 WEBHOOK RUNNING ON PORT 80 (HTTP DEFAULT)');
console.log('===========================================');
console.log('No port needed in URL!\n');

// Webhook verification - THIS IS CRITICAL!
app.get('/webhook', (req, res) => {
    console.log('🔍 Verification request from Meta:');
    console.log('   Mode:', req.query['hub.mode']);
    console.log('   Token:', req.query['hub.verify_token']);
    console.log('   Challenge:', req.query['hub.challenge']);
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === CONFIG.verifyToken) {
            console.log('✅ WEBHOOK VERIFIED!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Token mismatch!');
            res.sendStatus(403);
        }
    } else {
        console.log('❌ Missing parameters!');
        res.sendStatus(400);
    }
});

// Webhook events
app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook event received!');
    res.status(200).send('EVENT_RECEIVED');
    
    // Process the message
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log(`Message from ${message.from}: ${message.text?.body || message.type}`);
            
            // Simple echo response for testing
            if (message.type === 'text') {
                await sendMessage(message.from, `Got your message: "${message.text.body}"`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function sendMessage(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Reply sent');
    } catch (error) {
        console.error('Send error:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        port: CONFIG.port,
        service: 'webhook'
    });
});

// Root endpoint for testing
app.get('/', (req, res) => {
    res.send('Webhook is running! Use /webhook endpoint for Meta.');
});

// Start server on port 80
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log(`\n📍 YOUR WEBHOOK URL (NO PORT):`);
    console.log(`   http://YOUR_VM_IP/webhook`);
    console.log(`\n🔑 VERIFY TOKEN:`);
    console.log(`   jarvish_webhook_2024\n`);
});