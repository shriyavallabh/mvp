#!/bin/bash

echo "🔧 FIXING OLLAMA ON VM - FINAL SOLUTION"
echo "========================================"
echo ""

# Try all known passwords
PASSWORDS=("Story32Webhook2024!" "FinAdvise2025#VM" "Story32#Webhook2024")
VM_IP="159.89.166.94"

for PASS in "${PASSWORDS[@]}"; do
    echo "Attempting connection..."
    export SSHPASS="$PASS"
    
    if sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$VM_IP 'echo "Connected!"' 2>/dev/null; then
        echo "✅ Connected with password: ${PASS:0:5}..."
        
        sshpass -e ssh -o StrictHostKeyChecking=no root@$VM_IP << 'FIXOLLAMA'

echo "🤖 FIXING OLLAMA INTEGRATION"
echo "============================="

cd /root/webhook

# 1. Check Ollama
echo "1️⃣ Checking Ollama status..."
if ! systemctl is-active --quiet ollama; then
    echo "   Starting Ollama..."
    systemctl start ollama
    systemctl enable ollama
    sleep 5
fi

# Test Ollama directly
echo "2️⃣ Testing Ollama directly..."
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"Say hello in 5 words","stream":false}' \
  -H "Content-Type: application/json" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    response = data.get('response', 'No response')
    print(f'✅ Ollama says: {response[:100]}')
except:
    print('❌ Ollama not responding!')
"

# 3. Create WORKING webhook that ACTUALLY uses Ollama
echo ""
echo "3️⃣ Creating webhook that REALLY uses Ollama..."

cat > webhook-ollama-real.js << 'WEBHOOK'
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

console.log('🤖 REAL OLLAMA WEBHOOK STARTING...');
console.log('📍 Ollama URL: http://localhost:11434');

// ACTUALLY call Ollama - no fallback!
async function getOllamaResponse(message) {
    console.log(`  🧠 Calling Ollama with: "${message}"`);
    
    try {
        const response = await axios.post(
            'http://localhost:11434/api/generate',
            {
                model: 'llama2',
                prompt: message,
                stream: false
            },
            { 
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        if (response.data && response.data.response) {
            const aiText = response.data.response.trim();
            console.log(`  ✅ OLLAMA RESPONDED: "${aiText.substring(0, 50)}..."`);
            return aiText.substring(0, 300); // WhatsApp limit
        }
    } catch (error) {
        console.error('  ❌ Ollama error:', error.message);
        return `[Error: Ollama not responding. Message was: ${message}]`;
    }
    
    return '[No Ollama response]';
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
    console.log('📨 Event at:', new Date().toISOString());
    res.status(200).send('OK');
    
    try {
        const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages || [];
        
        for (const message of messages) {
            const from = message.from;
            
            if (message.type === 'text') {
                const userMessage = message.text.body;
                console.log(`\n💬 User said: "${userMessage}"`);
                
                // ALWAYS use Ollama, no patterns!
                const ollamaResponse = await getOllamaResponse(userMessage);
                
                // Send Ollama's response
                await axios.post(
                    `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: from,
                        type: 'text',
                        text: { body: ollamaResponse }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${CONFIG.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log(`  📤 Sent Ollama response to user`);
            } else if (message.type === 'interactive') {
                const buttonId = message.interactive?.button_reply?.id;
                console.log(`  🔘 Button clicked: ${buttonId}`);
                
                // For buttons, still use Ollama
                const prompt = `User clicked button: ${buttonId}. Give a relevant response.`;
                const response = await getOllamaResponse(prompt);
                
                await axios.post(
                    `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: from,
                        type: 'text',
                        text: { body: response }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${CONFIG.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});

app.get('/test-ollama', async (req, res) => {
    const response = await getOllamaResponse('What is 2+2?');
    res.json({ 
        ollama_response: response,
        timestamp: new Date().toISOString()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ REAL Ollama webhook on port ${CONFIG.port}`);
    console.log('🔗 Test Ollama at: http://localhost:3000/test-ollama');
});
WEBHOOK

# 4. Stop everything and restart
echo ""
echo "4️⃣ Restarting with REAL Ollama webhook..."
pm2 delete all 2>/dev/null || true
pm2 start webhook-ollama-real.js --name real-ollama
pm2 save

# 5. Test the integration
echo ""
echo "5️⃣ Testing Ollama integration..."
sleep 3
curl -s http://localhost:3000/test-ollama | python3 -m json.tool

# 6. Ensure ngrok is running
pkill -f ngrok || true
nohup ngrok http 3000 > /root/webhook/ngrok.log 2>&1 &
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

echo ""
echo "✅ OLLAMA FIXED!"
echo "================"
echo "🔗 Webhook URL: $NGROK_URL/webhook"
echo "🧪 Test Ollama: $NGROK_URL/test-ollama"
echo ""
echo "📱 NOW SEND A MESSAGE!"
echo "You'll get REAL Llama2 responses!"

# Show logs
pm2 logs real-ollama --lines 10 --nostream

FIXOLLAMA
        
        exit 0
    fi
done

echo "❌ Could not connect with any password"
echo ""
echo "📝 Please check your email for the latest password"
echo "   Or access the VM console directly:"
echo "   https://cloud.digitalocean.com/droplets/518113785/console"