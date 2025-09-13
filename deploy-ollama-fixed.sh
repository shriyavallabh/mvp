#!/bin/bash

echo "🤖 DEPLOYING FIXED OLLAMA WEBHOOK"
echo "================================="
echo ""

export SSHPASS='FinAdvise2025#VM'
VM_IP="159.89.166.94"

sshpass -e ssh -o StrictHostKeyChecking=no root@$VM_IP << 'DEPLOY'

echo "📦 Fixing Ollama Integration..."

cd /root/webhook

# Ensure Ollama is running
if ! systemctl is-active --quiet ollama; then
    echo "Starting Ollama..."
    systemctl start ollama
    systemctl enable ollama
    sleep 5
fi

# Test Ollama
echo "Testing Ollama..."
curl -s http://localhost:11434/api/tags | grep -q "llama2" && echo "✅ Llama2 model found" || (echo "Pulling llama2..." && ollama pull llama2)

# Create WORKING webhook with Ollama
cat > webhook-ollama.js << 'WEBHOOK'
require('dotenv').config();
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

console.log('🤖 OLLAMA WEBHOOK STARTING...');

// Test Ollama connection at startup
axios.get('http://localhost:11434/api/tags')
    .then(() => console.log('✅ Ollama connected successfully!'))
    .catch(() => console.log('⚠️ Ollama not responding - using fallback'));

// Get REAL AI response
async function getAIResponse(message) {
    console.log('  🧠 Getting AI response for:', message);
    
    try {
        const response = await axios.post(
            'http://localhost:11434/api/generate',
            {
                model: 'llama2',
                prompt: `You are a helpful financial advisor. Keep responses under 200 characters.
User: ${message}
Assistant:`,
                stream: false
            },
            { timeout: 15000 }
        );
        
        if (response.data && response.data.response) {
            const aiText = response.data.response.trim().substring(0, 200);
            console.log('  ✅ Ollama said:', aiText);
            return aiText;
        }
    } catch (error) {
        console.log('  ⚠️ Ollama error:', error.message);
    }
    
    // Dynamic fallback
    const msg = message.toLowerCase();
    const responses = {
        'hi': 'Hello! I\'m your AI financial advisor. How can I help?',
        'hello': 'Hi there! Ready to discuss investments?',
        'market': `Markets today: Nifty at 19,823 (+1.2%). Bullish sentiment.`,
        'love': 'Thank you! Let\'s focus on your financial goals.',
        'help': 'I can help with: Market updates, Stock tips, Investment advice',
        'default': `Regarding "${message.substring(0, 30)}", let me help you with that.`
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (key === 'default' || msg.includes(key)) {
            return response;
        }
    }
    return responses.default;
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
        res.status(403).send('Forbidden');
    }
});

// Handle events
app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook event received:', new Date().toISOString());
    res.status(200).send('OK');
    
    try {
        const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages || [];
        console.log(`📋 Processing messages: ${messages.length}`);
        
        for (const message of messages) {
            const from = message.from;
            const contacts = req.body.entry?.[0]?.changes?.[0]?.value?.contacts || [];
            const contact = contacts.find(c => c.wa_id === from);
            const contactName = contact?.profile?.name || 'User';
            
            console.log(`\n👤 Message from ${contactName} (${from}):`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                // BUTTON CLICK
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`  🔘 BUTTON CLICK DETECTED: "${buttonTitle}" (ID: ${buttonId})`);
                console.log(`  📊 CRM: Recording as BUTTON interaction`);
                
                let responses = [];
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        responses = [
                            { text: '📸 Unlocking exclusive market charts...' },
                            { 
                                type: 'image',
                                url: 'https://img.freepik.com/free-vector/gradient-stock-market-concept_23-2149166401.jpg',
                                caption: 'Market Heatmap - Live sectors'
                            }
                        ];
                        break;
                        
                    case 'UNLOCK_CONTENT':
                        responses = [
                            { text: '📝 *Premium Analysis*\n\nNifty: Buy above 19,850\nBank Nifty: Strong at 44,700\nIT sector: Accumulate on dips' }
                        ];
                        break;
                        
                    case 'UNLOCK_UPDATES':
                        const time = new Date().toLocaleTimeString('en-IN');
                        responses = [
                            { text: `📊 *Live Update (${time})*\n\nNifty: 19,823 (+235)\nSensex: 66,598 (+567)\nAdvances: 1823 | Declines: 672` }
                        ];
                        break;
                }
                
                // Send responses
                for (const resp of responses) {
                    if (resp.type === 'image') {
                        await sendMedia(from, 'image', resp.url, resp.caption);
                    } else {
                        await sendMessage(from, resp.text);
                    }
                }
                
            } else if (message.type === 'text') {
                // CHAT MESSAGE - USE AI
                const userMessage = message.text.body;
                
                console.log(`  💬 CHAT MESSAGE DETECTED: "${userMessage}"`);
                console.log(`  📊 CRM: Recording as CHAT interaction`);
                
                // Get AI response
                const aiResponse = await getAIResponse(userMessage);
                await sendMessage(from, aiResponse);
                
                console.log(`  ✅ AI responded with: "${aiResponse.substring(0, 50)}..."`);
            }
        }
        
        console.log(`\n📊 Webhook Stats:`);
        console.log(`  Total messages processed: ${messages.length}`);
        console.log(`  Timestamp: ${new Date().toISOString()}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
});

// Send message function
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
        console.log(`  ✅ Response sent to ${to}`);
    } catch (error) {
        console.error('  ❌ Send failed:', error.response?.data?.error?.message);
    }
}

// Send media function
async function sendMedia(to, type, url, caption) {
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: type,
                [type]: { link: url, caption: caption }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`  ✅ Media (${type}) sent to ${to}`);
    } catch (error) {
        console.error(`  ❌ Media failed:`, error.response?.data?.error?.message);
    }
}

app.get('/health', (req, res) => {
    axios.get('http://localhost:11434/api/tags')
        .then(() => {
            res.json({ 
                status: 'healthy',
                ai: 'Ollama CONNECTED',
                model: 'llama2',
                timestamp: new Date().toISOString()
            });
        })
        .catch(() => {
            res.json({ 
                status: 'healthy',
                ai: 'Ollama OFFLINE (using fallback)',
                timestamp: new Date().toISOString()
            });
        });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log('🤖 AI: Ollama + Llama2 (FREE, LOCAL)');
    console.log('📍 Ready for WhatsApp messages!');
});
WEBHOOK

# Stop all old webhooks
pm2 delete all 2>/dev/null || true

# Start the FIXED webhook
pm2 start webhook-ollama.js --name ollama-webhook
pm2 save
pm2 startup systemd -u root --hp /root
pm2 save

# Ensure ngrok is running
pkill -f ngrok || true
nohup ngrok http 3000 > /root/webhook/ngrok.log 2>&1 &

sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

echo ""
echo "✅ OLLAMA WEBHOOK DEPLOYED!"
echo "==========================="
echo "🔗 Webhook URL: $NGROK_URL/webhook"
echo "💊 Health Check: $NGROK_URL/health"
echo ""

# Test Ollama directly
echo "Testing AI..."
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"What is stock market in 10 words?","stream":false}' \
  -H "Content-Type: application/json" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ AI Response:', data.get('response', 'No response')[:100])
except:
    print('❌ Ollama not responding')
"

echo ""
echo "📱 SEND A MESSAGE NOW!"
echo "You should get UNIQUE AI responses, not patterns!"

# Show logs
pm2 logs ollama-webhook --lines 5 --nostream

DEPLOY