#!/usr/bin/env node

const axios = require('axios');

const VM_IP = '159.89.166.94';
const DO_TOKEN = 'dop_v1_f9b4b1a15c6b52c8f3d2e7a9b1c4f8e2d5a7b9c3e1f6a8d2c5e9b7a4f3d1c8e6b2a5';

async function deployOllamaFinal() {
    console.log('🚀 FINAL OLLAMA DEPLOYMENT');
    
    const installScript = `#!/bin/bash
set -e

echo "🔧 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

echo "📦 Starting Ollama service..."
systemctl enable ollama
systemctl start ollama
systemctl status ollama --no-pager

echo "⏳ Waiting for Ollama service..."
sleep 10

echo "📥 Installing lightweight model..."
export OLLAMA_HOST=0.0.0.0:11434
timeout 300 ollama run tinyllama --verbose || {
    echo "⚠️  Tinyllama timeout, trying phi..."
    timeout 180 ollama run phi || {
        echo "⚠️  Phi timeout, using basic model..."
        timeout 120 ollama run orca-mini || echo "Will use fallback responses"
    }
}

echo "✅ Ollama setup complete"
ollama list

# Restart webhook with Ollama
cd /root/webhook
pm2 restart all || pm2 start webhook-tinyllama.js --name="webhook-ai"

echo "🎉 DEPLOYMENT COMPLETE"`;

    const userData = Buffer.from(installScript).toString('base64');

    try {
        console.log('📡 Deploying via DigitalOcean API...');
        
        const response = await axios.post(
            'https://api.digitalocean.com/v2/droplets/actions',
            {
                type: 'power_cycle',
                params: {
                    user_data: userData
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${DO_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Action initiated:', response.data.action?.id);
        
        // Wait and test
        console.log('⏳ Waiting 3 minutes for deployment...');
        setTimeout(async () => {
            await testOllamaStatus();
        }, 180000);

    } catch (error) {
        console.log('❌ API deployment failed, trying direct connection...');
        await directOllamaFix();
    }
}

async function directOllamaFix() {
    console.log('🔧 DIRECT OLLAMA FIX');
    
    const commands = [
        'curl -fsSL https://ollama.ai/install.sh | sh',
        'systemctl enable ollama',
        'systemctl start ollama',
        'export OLLAMA_HOST=0.0.0.0:11434',
        'sleep 10',
        'timeout 60 ollama run orca-mini',
        'cd /root/webhook && pm2 restart all'
    ];

    for (const cmd of commands) {
        console.log(`Running: ${cmd}`);
        try {
            const result = await axios.post(`http://${VM_IP}:3000/exec`, { 
                command: cmd,
                password: 'droplet'
            }, { timeout: 120000 });
            
            console.log('✅', result.data?.output?.substring(0, 100) || 'Success');
        } catch (error) {
            console.log('⚠️ ', error.message);
        }
    }
    
    await testOllamaStatus();
}

async function testOllamaStatus() {
    console.log('\n🧪 TESTING OLLAMA STATUS');
    
    // Test Ollama direct
    try {
        const test1 = await axios.post(`http://${VM_IP}:11434/api/generate`, {
            model: 'orca-mini',
            prompt: 'Hello',
            stream: false
        }, { timeout: 30000 });
        
        console.log('✅ Ollama working:', test1.data.response?.substring(0, 50));
    } catch (error) {
        console.log('❌ Ollama:', error.message);
    }
    
    // Test webhook integration
    try {
        const test2 = await axios.get(`http://${VM_IP}:3000/test-ollama`, { timeout: 15000 });
        console.log('✅ Webhook AI:', test2.data);
    } catch (error) {
        console.log('❌ Webhook:', error.message);
    }
    
    console.log('\n🎯 FINAL STATUS COMPLETE');
}

deployOllamaFinal().catch(console.error);