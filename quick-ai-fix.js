#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const axios = require('axios');

const VM_IP = '159.89.166.94';

async function quickAIFix() {
    console.log('⚡ QUICK AI MODEL INSTALLATION\n');

    // 1. Test if Ollama is now accessible
    console.log('1️⃣ Testing Ollama service...');
    try {
        const response = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 8000 });
        console.log('✅ Ollama is running!');
        console.log('   Available models:', response.data.models?.map(m => m.name) || 'None yet');
    } catch (error) {
        console.log('❌ Ollama still not accessible:', error.code);
        return;
    }

    // 2. Install small model (tinyllama - much smaller than phi)
    console.log('\n2️⃣ Installing tinyllama (lightweight model)...');
    try {
        const installCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "timeout 120 ollama pull tinyllama"`;
        const { stdout, stderr } = await execAsync(installCmd, { timeout: 140000 });
        console.log('✅ Model installation output:', stdout?.substring(0, 100) || 'Success');
    } catch (error) {
        console.log('⚠️  Installation might be in progress:', error.message.substring(0, 60));
    }

    // 3. Test the model
    console.log('\n3️⃣ Testing tinyllama model...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for model to load
    
    try {
        const testResponse = await axios.post(`http://${VM_IP}:11434/api/generate`, {
            model: 'tinyllama',
            prompt: 'Hello, I am a financial advisor',
            stream: false
        }, { timeout: 20000 });
        
        if (testResponse.data && testResponse.data.response) {
            console.log('✅ TINYLLAMA IS WORKING!');
            console.log('   Sample response:', testResponse.data.response.substring(0, 100));
        }
    } catch (error) {
        console.log('❌ Model test failed:', error.message);
        
        // Try listing models again
        try {
            const modelsCheck = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 5000 });
            console.log('   Available models now:', modelsCheck.data.models?.map(m => m.name) || 'Still none');
        } catch {}
    }

    // 4. Update webhook to use tinyllama
    console.log('\n4️⃣ Updating webhook to use tinyllama...');
    try {
        const updateWebhookCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && sed -i 's/phi/tinyllama/g' *.js"`;
        await execAsync(updateWebhookCmd, { timeout: 10000 });
        console.log('✅ Webhook updated to use tinyllama');
        
        // Restart webhook
        const restartCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && pm2 restart all"`;
        await execAsync(restartCmd, { timeout: 10000 });
        console.log('✅ Webhook restarted');
    } catch (error) {
        console.log('⚠️  Webhook update issue:', error.message);
    }

    // 5. Final test
    console.log('\n5️⃣ Final AI integration test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        const finalTest = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 8000 });
        console.log('✅ Webhook health:', finalTest.data);
    } catch (error) {
        console.log('❌ Final test failed:', error.message);
    }

    console.log('\n🎯 QUICK FIX COMPLETE');
    console.log('Testing WhatsApp responses now...');
}

quickAIFix().catch(console.error);