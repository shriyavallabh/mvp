const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('🚀 WEBHOOK SERVER STARTING...');

// Meta webhook verification endpoint - WORKING!
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`[${new Date().toISOString()}] Verification request:`);
    console.log(`  Mode: ${mode}`);
    console.log(`  Token: ${token}`);
    console.log(`  Challenge: ${challenge}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook event received:', new Date().toISOString());
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];
        
        for (const message of messages) {
            const from = message.from;
            const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'User';
            
            console.log(`\nMessage from ${contactName} (${from}):`);
            console.log(`  Type: ${message.type}`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                // Handle button clicks
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`  🔘 Button clicked: "${buttonTitle}" (ID: ${buttonId})`);
                
                let responseText = '';
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        responseText = '📸 Your daily images are ready! Check your WhatsApp for shareable market visuals.';
                        break;
                    case 'UNLOCK_CONTENT':
                        responseText = '📝 Here is your personalized content for today! Market insights and investment tips incoming.';
                        break;
                    case 'UNLOCK_UPDATES':
                        responseText = '📊 Live Market Update:\\n\\nNifty: 19,823 (+1.2%)\\nSensex: 66,598 (+0.8%)\\nBank Nifty: 44,672\\n\\nMarkets showing positive momentum!';
                        break;
                    default:
                        responseText = 'Thank you for clicking! Your content is on the way.';
                }
                
                // Send response
                await sendMessage(from, responseText);
                
            } else if (message.type === 'text') {
                // Handle text messages
                const text = message.text.body;
                console.log(`  💬 Text: "${text}"`);
                
                // Send auto-response
                const response = `Thank you for your message! I received: "${text}". Our advisor will respond shortly.`;
                await sendMessage(from, response);
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Send WhatsApp message
async function sendMessage(to, text) {
    try {
        const response = await axios.post(
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
        console.log(`  ✅ Response sent to ${to}`);
        return response.data;
    } catch (error) {
        console.error(`  ❌ Failed to send message:`, error.response?.data || error.message);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'Story 3.2 Webhook',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('✅ Webhook is running! Use /webhook endpoint for Meta verification.');
});

app.listen(CONFIG.port, () => {
    console.log(`✅ Webhook server running on port ${CONFIG.port}`);
    console.log('📍 Ready for Meta verification!');
});