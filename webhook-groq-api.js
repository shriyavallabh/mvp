const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    // Get FREE API key from: https://console.groq.com/keys
    groqApiKey: 'YOUR_GROQ_API_KEY' // REPLACE THIS
};

console.log('🚀 WEBHOOK WITH GROQ AI (FREE & FAST)');

async function getAIResponse(userMessage) {
    try {
        console.log('   Calling Groq AI...');
        
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.2-3b-preview', // Or 'mixtral-8x7b-32768' for better quality
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful financial advisor. Give specific, actionable investment advice with percentages and clear recommendations. Be concise and practical.'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // Groq is super fast
            }
        );
        
        if (response.data?.choices?.[0]?.message?.content) {
            const aiText = response.data.choices[0].message.content.trim();
            console.log(`   ✅ Generated ${aiText.length} chars`);
            return aiText;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.response?.data || error.message);
    }
    
    return "I'm having trouble connecting to my AI service. Please try again.";
}

async function sendWhatsAppMessage(to, message) {
    try {
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
        
        console.log('   ✅ Sent! ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data?.error?.message || error.message);
        return false;
    }
}

app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && 
        req.query['hub.verify_token'] === CONFIG.verifyToken) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    res.sendStatus(200);
    
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message?.text?.body) {
        const from = message.from;
        const text = message.text.body;
        
        console.log(`\n📨 From ${from}: "${text}"`);
        
        const aiResponse = await getAIResponse(text);
        
        console.log(`   Response preview: "${aiResponse.substring(0, 100)}..."`);
        
        await sendWhatsAppMessage(from, aiResponse);
        
        console.log('   ✨ Complete\n');
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        ai: 'Groq API - Free & Fast',
        model: 'llama-3.2-3b',
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('✅ Webhook ready with Groq AI');
    console.log('🆓 Using FREE Groq API (better than tinyllama/phi)');
    console.log('⚡ Response time: <1 second');
});