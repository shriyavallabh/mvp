#!/usr/bin/env node

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// WhatsApp configuration - CRITICAL!
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '515322611682990',  // Your WhatsApp Business ID
    accessToken: 'EAAZAwplKB5MkBO3lhI9kcAOZBaolcqgaX2MjsKf5JhkpPo6u3CKKyVQk4I84AcRIWJLXJZApOayTrWGkQjzfhVKwSHdNz6vOb2Ykb7wXTEzJTJT8ZCIcJRRUjZAhAu6KgrvUJDCRpXl7dGzMfwfgChtlI4DDdWJBGqLGpuxL8kJPCUpqsO36xhOFGOCO7lZCWW0CGyJyBW2cC7WGKgPBa3w6xqvkZDZD',
    ollamaHost: 'http://127.0.0.1:11434'  // Use 127.0.0.1 instead of localhost
};

console.log('🚀 WEBHOOK WITH WHATSAPP RESPONSES STARTING...');

// AI response generation with tinyllama
async function getAIResponse(message) {
    try {
        console.log('   🤖 Getting AI response for:', message);
        const response = await axios.post(`${CONFIG.ollamaHost}/api/generate`, {
            model: 'tinyllama',
            prompt: `You are a helpful financial advisor. User says: "${message}". Give a brief, helpful response about finance or investments.`,
            stream: false,
            options: { 
                temperature: 0.7,
                num_predict: 50
            }
        }, { timeout: 20000 });
        
        if (response.data && response.data.response) {
            const aiResponse = response.data.response.trim();
            console.log('   ✅ AI generated:', aiResponse.substring(0, 100));
            return aiResponse;
        }
    } catch (error) {
        console.log('   ⚠️ AI error:', error.message);
    }
    
    // Fallback responses if AI fails
    const fallbacks = [
        "I can help you with financial planning and investments. What's your goal?",
        "Let's discuss your investment strategy. What interests you most?",
        "I'm here to help with your financial questions. Ask me anything!"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Send message back to WhatsApp
async function sendWhatsAppMessage(to, message) {
    try {
        console.log(`   📱 Sending to ${to}: "${message.substring(0, 50)}..."`);
        
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('   ✅ Message sent successfully!');
        return response.data;
    } catch (error) {
        console.error('   ❌ Failed to send WhatsApp message:', error.response?.data || error.message);
    }
}

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];
        
        if (message) {
            const from = message.from;
            const messageBody = message.text?.body || message.button?.text || '';
            
            console.log(`\n📨 Message from ${from}`);
            console.log(`   User said: "${messageBody}"`);
            
            // Get AI response
            const aiResponse = await getAIResponse(messageBody);
            
            // Send response back to WhatsApp
            await sendWhatsAppMessage(from, aiResponse);
            
            console.log('   ✨ Response cycle complete!\n');
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.sendStatus(200);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        ai_model: 'tinyllama',
        whatsapp: 'configured',
        approach: 'REAL AI + WhatsApp responses',
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ WhatsApp integration ready');
    console.log('✅ AI model: tinyllama');
    console.log('✅ Ready to send responses!\n');
});