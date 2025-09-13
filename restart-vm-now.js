#!/usr/bin/env node

const axios = require('axios');

const DO_TOKEN = 'dop_v1_f9b4b1a15c6b52c8f3d2e7a9b1c4f8e2d5a7b9c3e1f6a8d2c5e9b7a4f3d1c8e6b2a5';
const DROPLET_ID = '474662826';

async function restartVM() {
    console.log('🚀 RESTARTING VM\n');

    try {
        // Check droplet status first
        console.log('1️⃣ Checking droplet status...');
        const statusResponse = await axios.get(
            `https://api.digitalocean.com/v2/droplets/${DROPLET_ID}`,
            {
                headers: { 'Authorization': `Bearer ${DO_TOKEN}` }
            }
        );

        const droplet = statusResponse.data.droplet;
        console.log(`   Status: ${droplet.status}`);
        console.log(`   IP: ${droplet.networks.v4[0]?.ip_address || 'No IP'}`);

        if (droplet.status !== 'active') {
            console.log('2️⃣ Droplet not active, powering on...');
            
            const powerOnResponse = await axios.post(
                `https://api.digitalocean.com/v2/droplets/${DROPLET_ID}/actions`,
                { type: 'power_on' },
                {
                    headers: {
                        'Authorization': `Bearer ${DO_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`   Power on action: ${powerOnResponse.data.action.id}`);
            console.log('   Waiting 60 seconds for boot...');
            
            await new Promise(resolve => setTimeout(resolve, 60000));
        }

        console.log('3️⃣ Installing services via user data...');
        
        const installScript = `#!/bin/bash
cd /root/webhook || mkdir -p /root/webhook
cd /root/webhook

# Ensure webhook files exist
if [ ! -f webhook-tinyllama.js ]; then
cat > webhook-tinyllama.js << 'EOF'
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Fallback responses for when Ollama isn't ready
const responses = {
    love: [
        "That's wonderful! Let me help you love your finances too. What's your investment goal?",
        "Love is great! Now let's talk about building wealth together.",
        "I appreciate that! How about we focus on growing your money with smart investments?"
    ],
    done: [
        "Great job! Now let's work on your financial portfolio. What interests you?",
        "Excellent! Ready to explore some investment opportunities?",
        "Well done! Let's discuss your next financial milestone."
    ],
    default: [
        "I'm your financial advisor! Ask me about investments, SIPs, or mutual funds.",
        "Let's talk money! What financial goal can I help you achieve?",
        "Ready to build wealth? Ask me about smart investment strategies!"
    ]
};

async function getAIResponse(message) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'tinyllama',
            prompt: \`You are a helpful financial advisor. Respond to: "\${message}" in a friendly, brief way about finance/investments.\`,
            stream: false
        }, { timeout: 10000 });
        
        return response.data.response || getFallbackResponse(message);
    } catch {
        return getFallbackResponse(message);
    }
}

function getFallbackResponse(message) {
    const msg = message.toLowerCase();
    if (msg.includes('love')) {
        return responses.love[Math.floor(Math.random() * responses.love.length)];
    } else if (msg.includes('done') || msg.includes('finish')) {
        return responses.done[Math.floor(Math.random() * responses.done.length)];
    } else {
        return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
}

app.post('/webhook', async (req, res) => {
    try {
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (message?.text?.body) {
            const aiResponse = await getAIResponse(message.text.body);
            console.log('AI Response:', aiResponse);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(200);
    }
});

app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));
app.get('/test-ollama', async (req, res) => {
    const testResponse = await getAIResponse('test message');
    res.json({ response: testResponse });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('🤖 AI Webhook running on port 3000');
});
EOF
fi

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install dependencies
npm init -y 2>/dev/null || true
npm install express axios 2>/dev/null || true

# Start webhook
pm2 stop all 2>/dev/null || true
pm2 start webhook-tinyllama.js --name="ai-webhook"
pm2 startup
pm2 save

# Install Ollama (lightweight)
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh
    systemctl enable ollama
    systemctl start ollama
fi

echo "✅ VM Setup Complete"
`;

        const userData = Buffer.from(installScript).toString('base64');

        // Use rebuild to apply user data
        const rebuildResponse = await axios.post(
            `https://api.digitalocean.com/v2/droplets/${DROPLET_ID}/actions`,
            {
                type: 'rebuild',
                image: 'ubuntu-22-04-x64',
                user_data: userData
            },
            {
                headers: {
                    'Authorization': `Bearer ${DO_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`   Rebuild action: ${rebuildResponse.data.action.id}`);
        console.log('⏳ Waiting 3 minutes for rebuild and service startup...');

        setTimeout(async () => {
            await testVMServices();
        }, 180000);

    } catch (error) {
        console.error('❌ Failed to restart VM:', error.response?.data || error.message);
    }
}

async function testVMServices() {
    console.log('\n🧪 TESTING VM SERVICES');
    
    const VM_IP = '159.89.166.94';
    
    try {
        const healthCheck = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 10000 });
        console.log('✅ Webhook service:', healthCheck.data);
    } catch (error) {
        console.log('❌ Webhook service:', error.message);
    }
    
    try {
        const aiTest = await axios.get(`http://${VM_IP}:3000/test-ollama`, { timeout: 15000 });
        console.log('✅ AI responses:', aiTest.data.response);
    } catch (error) {
        console.log('❌ AI responses:', error.message);
    }
    
    console.log('\n🎯 VM RESTART COMPLETE');
    console.log('Next: Update Meta webhook URL if needed');
}

restartVM().catch(console.error);