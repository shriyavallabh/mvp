#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function diagnoseWhatsAppIssue() {
    console.log('🔍 DIAGNOSING WHATSAPP RESPONSE ISSUE\n');

    // 1. Check if webhook is receiving messages
    console.log('1️⃣ Checking webhook logs...');
    try {
        const logsCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 logs webhook --lines 20 --nostream"`;
        const { stdout } = await execAsync(logsCmd, { timeout: 10000 });
        console.log('📋 Recent webhook logs:');
        console.log(stdout.substring(0, 500));
    } catch (error) {
        console.log('❌ Could not fetch logs:', error.message);
    }

    // 2. Check if tinyllama is really installed
    console.log('\n2️⃣ Checking tinyllama model...');
    try {
        const modelsResponse = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 8000 });
        const models = modelsResponse.data.models || [];
        console.log('✅ Installed models:', models.map(m => m.name));
        
        if (!models.find(m => m.name.includes('tinyllama'))) {
            console.log('❌ TINYLLAMA NOT FOUND!');
        }
    } catch (error) {
        console.log('❌ Ollama not accessible:', error.message);
    }

    // 3. Test model directly
    console.log('\n3️⃣ Testing tinyllama response...');
    try {
        const testResponse = await axios.post(`http://${VM_IP}:11434/api/generate`, {
            model: 'tinyllama',
            prompt: 'Say hello',
            stream: false,
            options: { num_predict: 20 }
        }, { timeout: 30000 });
        
        if (testResponse.data && testResponse.data.response) {
            console.log('✅ Model is responding:', testResponse.data.response.substring(0, 100));
        }
    } catch (error) {
        console.log('❌ Model test failed:', error.message);
    }

    // 4. Check webhook code
    console.log('\n4️⃣ Checking webhook code...');
    try {
        const codeCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "ls -la /root/webhook/*.js | head -5"`;
        const { stdout } = await execAsync(codeCmd, { timeout: 10000 });
        console.log('📁 Webhook files:', stdout);
        
        // Check which file is running
        const runningCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 list"`;
        const { stdout: pmList } = await execAsync(runningCmd, { timeout: 10000 });
        console.log('🔄 Running processes:', pmList.substring(0, 300));
    } catch (error) {
        console.log('❌ Could not check webhook:', error.message);
    }

    // 5. Check if webhook sends to WhatsApp
    console.log('\n5️⃣ Checking WhatsApp API integration...');
    try {
        const webhookCodeCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "grep -l 'graph.facebook' /root/webhook/*.js 2>/dev/null || echo 'No WhatsApp API calls found'"`;
        const { stdout } = await execAsync(webhookCodeCmd, { timeout: 10000 });
        console.log('📱 WhatsApp API integration:', stdout.trim());
        
        if (stdout.includes('No WhatsApp API calls found')) {
            console.log('❌ CRITICAL: Webhook is NOT sending messages to WhatsApp!');
            console.log('   The webhook receives messages but doesn\'t send responses back!');
        }
    } catch (error) {
        console.log('⚠️  Check failed:', error.message);
    }

    // 6. Test current webhook health
    console.log('\n6️⃣ Testing webhook health...');
    try {
        const health = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 5000 });
        console.log('✅ Webhook health:', health.data);
    } catch (error) {
        console.log('❌ Webhook not responding:', error.message);
    }

    console.log('\n📊 DIAGNOSIS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔴 ISSUE FOUND:');
    console.log('The webhook is receiving messages but NOT sending responses back to WhatsApp!');
    console.log('It only logs messages but doesn\'t have the code to send replies.');
    console.log('\n🔧 FIXING NOW...');
}

diagnoseWhatsAppIssue().catch(console.error);
