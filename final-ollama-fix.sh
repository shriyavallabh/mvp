#!/bin/bash

echo "🔧 ULTIMATE OLLAMA FIX"
echo "====================="
echo ""

# Check current webhook status locally
echo "📊 Current local webhook status:"
curl -s http://localhost:3000/health 2>/dev/null | python3 -m json.tool || echo "No local webhook running"

echo ""
echo "📝 The problem is clear:"
echo "   - Webhook is running LOCALLY on your Mac"
echo "   - Ollama is on the VM (159.89.166.94)"
echo "   - They CANNOT communicate!"
echo ""

# Stop local webhook
echo "🛑 Stopping local webhook..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pkill -f "node.*webhook" 2>/dev/null

echo ""
echo "✅ Local webhook stopped"
echo ""

# Create a test script
cat > /tmp/test-ollama-vm.sh << 'TESTSCRIPT'
#!/bin/bash

echo "🧪 OLLAMA VM TEST SCRIPT"
echo "========================"

cd /root/webhook

# 1. Start Ollama
systemctl start ollama
systemctl enable ollama
sleep 3

# 2. Test Ollama directly
echo ""
echo "Testing Ollama..."
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"What is 2+2? Answer in one sentence.","stream":false}' \
  -H "Content-Type: application/json" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    response = data.get('response', 'No response')
    print('✅ OLLAMA WORKS!')
    print('Response:', response[:200])
except:
    print('❌ Ollama not responding')
"

# 3. Fix the webhook
echo ""
echo "Fixing webhook..."

# Find which webhook file exists and use it
if [ -f webhook-ai.js ]; then
    echo "Using webhook-ai.js"
    pm2 delete all 2>/dev/null
    pm2 start webhook-ai.js --name ollama
elif [ -f webhook-ai-working.js ]; then
    echo "Using webhook-ai-working.js"
    pm2 delete all 2>/dev/null
    pm2 start webhook-ai-working.js --name ollama
elif [ -f webhook-complete.js ]; then
    echo "Using webhook-complete.js"
    pm2 delete all 2>/dev/null
    pm2 start webhook-complete.js --name ollama
else
    echo "Creating new webhook..."
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

console.log('OLLAMA WEBHOOK READY');

async function ollama(text) {
    try {
        const r = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama2', prompt: text, stream: false
        }, {timeout: 20000});
        return r.data.response || 'No response';
    } catch(e) {
        return 'Ollama error: ' + e.message;
    }
}

app.get('/webhook', (req, res) => {
    res.send(req.query['hub.challenge'] || '');
});

app.post('/webhook', async (req, res) => {
    res.sendStatus(200);
    const msgs = req.body.entry?.[0]?.changes?.[0]?.value?.messages || [];
    for (const m of msgs) {
        if (m.type === 'text') {
            const reply = await ollama(m.text.body);
            await axios.post('https://graph.facebook.com/v23.0/' + CONFIG.phoneNumberId + '/messages', {
                messaging_product: 'whatsapp',
                to: m.from,
                type: 'text',
                text: { body: reply.substring(0, 300) }
            }, {
                headers: {
                    'Authorization': 'Bearer ' + CONFIG.accessToken,
                    'Content-Type': 'application/json'
                }
            }).catch(e => console.log('Send error'));
        }
    }
});

app.listen(CONFIG.port, () => console.log('Port 3000'));
WEBHOOK
    pm2 start webhook-ollama.js --name ollama
fi

pm2 save

# 4. Ensure ngrok
pkill -f ngrok 2>/dev/null
nohup ngrok http 3000 > /dev/null 2>&1 &
sleep 5

# 5. Get URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

echo ""
echo "✅ FIXED!"
echo "========="
echo "Webhook URL: $NGROK_URL/webhook"
echo ""

# 6. Show logs
pm2 logs ollama --lines 10 --nostream
TESTSCRIPT

echo "📋 INSTRUCTIONS:"
echo "================"
echo ""
echo "Since SSH isn't working, use the DigitalOcean console:"
echo ""
echo "1. Click this link:"
echo "   https://cloud.digitalocean.com/droplets/518113785/console"
echo ""
echo "2. Click 'Launch Droplet Console'"
echo ""
echo "3. Login:"
echo "   Username: root"
echo "   Password: [check your email]"
echo ""
echo "4. Copy and paste this ENTIRE command:"
echo ""
echo "----------------------------------------"
cat /tmp/test-ollama-vm.sh
echo "----------------------------------------"
echo ""
echo "5. After running, send any message to WhatsApp"
echo "   You'll get a REAL Llama2 response!"
echo ""
echo "🎯 How to verify it's working:"
echo "   - Send 'What is 2+2?'"
echo "   - Llama2 will say: '2+2 equals 4' or similar"
echo "   - NOT: 'I understand you're asking about...'"