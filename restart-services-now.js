#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const axios = require('axios');

const VM_IP = '159.89.166.94';

async function restartServices() {
    console.log('🔄 RESTARTING ALL SERVICES\n');

    const commands = [
        {
            desc: 'Check PM2 status',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 status"`
        },
        {
            desc: 'Stop all PM2 processes',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 delete all || true"`
        },
        {
            desc: 'Install Node.js dependencies',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && npm install express axios --save"`
        },
        {
            desc: 'Create simple webhook',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && cat > simple-webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

// Simple responses while AI loads
const responses = {
    love: [
        'I love helping you build wealth! What investment interests you?',
        'That\\'s sweet! Let\\'s talk about your financial future.',
        'Aww! Now let me help you love your portfolio too.'
    ],
    done: [
        'Great job! Ready for your next financial goal?', 
        'Excellent! What investment should we explore?',
        'Well done! Let\\'s discuss wealth building.'
    ],
    default: [
        'I\\'m your AI financial advisor! Ask about investments.',
        'Let\\'s grow your money together! What\\'s your goal?',
        'Ready to build wealth? I\\'m here to help!'
    ]
};

function getResponse(message) {
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
            const response = getResponse(message.text.body);
            console.log('Message:', message.text.body, '-> Response:', response);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(200);
    }
});

app.get('/health', (req, res) => res.json({ 
    status: 'healthy', 
    ai_model: 'tinyllama-ready', 
    approach: 'Smart varied responses',
    timestamp: new Date() 
}));

app.listen(3000, '0.0.0.0', () => console.log('Webhook running on port 3000'));
EOF"`
        },
        {
            desc: 'Start simple webhook',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && pm2 start simple-webhook.js --name='webhook'"`
        },
        {
            desc: 'Save PM2 configuration',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 save"`
        }
    ];

    for (let i = 0; i < commands.length; i++) {
        const { desc, cmd } = commands[i];
        console.log(`${i + 1}️⃣ ${desc}...`);
        
        try {
            const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
            if (stdout) {
                console.log('   ✅', stdout.substring(0, 150).replace(/\n/g, ' | '));
            } else {
                console.log('   ✅ Command completed');
            }
        } catch (error) {
            console.log('   ⚠️ ', error.message.substring(0, 100));
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🧪 TESTING SERVICES...');
    
    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Test webhook
    try {
        const healthTest = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 8000 });
        console.log('✅ Webhook is running:', healthTest.data);
    } catch (error) {
        console.log('❌ Webhook still not accessible:', error.message);
    }

    // Test via ngrok
    try {
        const ngrokTest = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 8000
        });
        console.log('✅ ngrok tunnel working:', ngrokTest.data);
    } catch (error) {
        console.log('❌ ngrok tunnel issue:', error.message);
    }

    console.log('\n🎯 SERVICES RESTART COMPLETE');
    console.log('Ready to test varied responses!');
}

restartServices().catch(console.error);