const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

console.log('🚀 REAL AI WEBHOOK WITH PHI MODEL');

async function getAIResponse(userMessage) {
    console.log(`   Getting AI response for: "${userMessage}"`);
    
    // Use phi model with proper prompt
    const prompt = `You are a helpful financial advisor. A user asks: "${userMessage}"

Provide specific, actionable financial advice. Be direct and practical. Give percentages and specific recommendations when applicable. Do not use generic responses.

Response:`;

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'phi',  // Using phi model
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 200,  // Enough for complete response
                top_p: 0.9
            }
        }, { 
            timeout: 45000  // Longer timeout for phi model
        });
        
        if (response.data?.response) {
            let aiResponse = response.data.response.trim();
            
            // Clean up any weird formatting
            aiResponse = aiResponse.replace(/^Response:\s*/i, '');
            aiResponse = aiResponse.replace(/^Assistant:\s*/i, '');
            
            // Ensure proper length for WhatsApp
            if (aiResponse.length > 1500) {
                // Find last complete sentence within limit
                const sentences = aiResponse.substring(0, 1500).split(/[.!?]/);
                aiResponse = sentences.slice(0, -1).join('. ') + '.';
            }
            
            console.log(`   ✅ AI generated ${aiResponse.length} chars`);
            return aiResponse;
        }
    } catch (error) {
        console.log(`   ❌ AI Error: ${error.message}`);
        
        // Try tinyllama as fallback
        try {
            const fallback = await axios.post('http://localhost:11434/api/generate', {
                model: 'tinyllama',
                prompt: `Financial advisor response to: "${userMessage}". Be specific and helpful.`,
                stream: false,
                options: { num_predict: 150 }
            }, { timeout: 20000 });
            
            if (fallback.data?.response) {
                console.log('   Using tinyllama fallback');
                return fallback.data.response.trim();
            }
        } catch (fallbackError) {
            console.log('   Fallback also failed');
        }
    }
    
    // Last resort - return error message
    return "I apologize, but I'm having technical difficulties. Please try asking your financial question again in a moment.";
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
        
        console.log('   ✅ Sent to WhatsApp! ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Send failed:', error.response?.data?.error?.message || error.message);
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
    // Respond immediately to WhatsApp
    res.sendStatus(200);
    
    // Process message async
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message && message.text?.body) {
        const from = message.from;
        const text = message.text.body;
        
        console.log(`\n📨 From ${from}: "${text}"`);
        
        // Get AI response
        const aiResponse = await getAIResponse(text);
        
        // Send response
        await sendWhatsAppMessage(from, aiResponse);
        
        console.log('   ✨ Complete\n');
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        model: 'phi (with tinyllama fallback)',
        type: 'Real AI responses',
        timestamp: new Date()
    });
});

// Test endpoint
app.get('/test-ai', async (req, res) => {
    const prompt = req.query.prompt || 'How should I invest 50000 rupees?';
    const response = await getAIResponse(prompt);
    res.json({ prompt, response, length: response.length });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('📡 Webhook ready on port', CONFIG.port);
    console.log('🤖 Using phi model for intelligent responses');
    console.log('✅ Real AI - NO hardcoding');
});
