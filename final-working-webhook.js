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

console.log('🚀 FINAL WORKING WEBHOOK');

async function getAIResponse(userMessage) {
    // CRITICAL: Proper prompt that makes tinyllama act as advisor
    const prompt = `You are an expert financial advisor talking directly to a client.
Client says: "${userMessage}"

Give specific financial advice with:
- Exact percentages for allocation
- Specific fund names or investment types
- Clear action steps
- Risk considerations

Your response (be direct, no greetings):`;

    try {
        console.log('   Calling tinyllama...');
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'tinyllama',
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.8,
                num_predict: 250,  // Proper length
                top_p: 0.95,
                repeat_penalty: 1.1
            }
        }, { 
            timeout: 35000  // Reasonable timeout
        });
        
        if (response.data?.response) {
            let aiText = response.data.response.trim();
            
            // Remove any meta text
            aiText = aiText.replace(/^(Assistant:|Response:|Answer:)\s*/gi, '');
            
            // Ensure it's not too long for WhatsApp
            if (aiText.length > 1400) {
                const sentences = aiText.substring(0, 1400).split(/[.!?]/);
                aiText = sentences.slice(0, -1).join('. ') + '.';
            }
            
            console.log(`   ✅ Generated ${aiText.length} chars`);
            return aiText;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    return "I'm experiencing technical issues. Please try again in a moment.";
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
                },
                timeout: 10000
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
    // Respond immediately
    res.sendStatus(200);
    
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message?.text?.body) {
        const from = message.from;
        const text = message.text.body;
        
        console.log(`\n📨 From ${from}: "${text}"`);
        
        const aiResponse = await getAIResponse(text);
        
        // Show preview
        console.log(`   Preview: "${aiResponse.substring(0, 100)}..."`);
        
        await sendWhatsAppMessage(from, aiResponse);
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        model: 'tinyllama with proper prompts',
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('✅ Webhook ready - Real AI with tinyllama');
});
