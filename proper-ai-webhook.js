const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    ollamaHost: 'http://127.0.0.1:11434'
};

console.log('🚀 REAL AI WEBHOOK - NO HARDCODING');

async function getAIResponse(userMessage) {
    // CORRECT PROMPT - AI IS the advisor
    const prompt = `You are a financial advisor. The user says: "${userMessage}"
Give helpful financial advice. Be direct and specific.`;

    console.log('   Getting AI response...');
    
    try {
        const response = await axios.post(`${CONFIG.ollamaHost}/api/generate`, {
            model: 'tinyllama',
            prompt: prompt,
            stream: false,
            options: { 
                temperature: 0.7,
                num_predict: 250  // Enough for complete response
            }
        }, { timeout: 25000 });
        
        if (response.data?.response) {
            let aiText = response.data.response.trim();
            
            // Limit to WhatsApp max (4096) but keep complete
            if (aiText.length > 1500) {
                aiText = aiText.substring(0, 1500);
            }
            
            console.log(`   AI generated ${aiText.length} chars`);
            return aiText;
        }
    } catch (error) {
        console.log('   AI error:', error.message);
        // NO FALLBACK - return error message
        return "AI service is temporarily unavailable. Please try again.";
    }
    
    return "AI did not generate a response. Please try again.";
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
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message) {
        const from = message.from;
        const text = message.text?.body || '';
        
        console.log(`\n📨 From ${from}: "${text}"`);
        
        const aiResponse = await getAIResponse(text);
        
        // Show preview in logs
        console.log(`   Response preview: "${aiResponse.substring(0, 80)}..."`);
        
        await sendWhatsAppMessage(from, aiResponse);
    }
    
    res.sendStatus(200);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        ai: 'tinyllama - REAL responses only',
        noHardcoding: true,
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('✅ Webhook ready - REAL AI, NO HARDCODED RESPONSES');
});
