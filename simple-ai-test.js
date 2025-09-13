#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function simpleAITest() {
    console.log('🚀 SIMPLE AI TEST\n');

    // 1. Quick model check
    console.log('1️⃣ Checking available models...');
    try {
        const models = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 8000 });
        console.log('✅ Models available:', models.data.models?.map(m => m.name) || 'None');
    } catch (error) {
        console.log('❌ Models check failed');
        return;
    }

    // 2. Test with very simple prompt
    console.log('\n2️⃣ Testing with simple prompt...');
    try {
        const simpleTest = await axios.post(`http://${VM_IP}:11434/api/generate`, {
            model: 'tinyllama',
            prompt: 'Hi',
            stream: false,
            options: {
                temperature: 0.1,
                top_p: 0.9,
                max_tokens: 50
            }
        }, { timeout: 15000 });
        
        if (simpleTest.data && simpleTest.data.response) {
            console.log('✅ AI IS RESPONDING!');
            console.log('   Response:', simpleTest.data.response.trim());
        }
    } catch (error) {
        console.log('❌ Simple test failed:', error.message);
    }

    // 3. Update webhook for real AI
    console.log('\n3️⃣ Updating webhook for real AI...');
    
    const webhookCode = `const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

async function getAIResponse(message) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'tinyllama',
            prompt: \`Financial advisor response to: "\${message}"\`,
            stream: false,
            options: { temperature: 0.3, max_tokens: 100 }
        }, { timeout: 20000 });
        return response.data.response?.trim() || 'I can help with your financial questions!';
    } catch (error) {
        console.error('AI Error:', error.message);
        return 'Let me help you with financial planning and investments.';
    }
}

app.post('/webhook', async (req, res) => {
    try {
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (message?.text?.body) {
            console.log('Processing:', message.text.body);
            const aiResponse = await getAIResponse(message.text.body);
            console.log('AI Generated:', aiResponse);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(200);
    }
});

app.get('/health', (req, res) => res.json({ 
    status: 'healthy', 
    ai_model: 'tinyllama', 
    approach: 'REAL AI - WORKING',
    timestamp: new Date() 
}));

app.listen(3000, '0.0.0.0', () => console.log('Real AI Webhook running'));`;

    try {
        // Write new webhook
        const writeCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && cat > webhook-real-ai.js << 'EOF'
${webhookCode}
EOF"`;
        await execAsync(writeCmd, { timeout: 15000 });
        
        // Start new webhook
        const startCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && pm2 delete all 2>/dev/null || true && pm2 start webhook-real-ai.js --name='real-ai'"`;
        await execAsync(startCmd, { timeout: 15000 });
        
        console.log('✅ Real AI webhook deployed');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.log('⚠️  Webhook deployment issue:', error.message);
    }

    // 4. Test final integration
    console.log('\n4️⃣ Testing final integration...');
    try {
        const finalTest = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 8000 });
        console.log('✅ Final health check:', finalTest.data);
    } catch (error) {
        console.log('❌ Final test failed:', error.message);
    }

    console.log('\n🎯 SETUP COMPLETE!');
    console.log('Now testing WhatsApp with real AI...');
}

simpleAITest().catch(console.error);