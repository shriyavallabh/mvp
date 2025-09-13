#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function checkVMStatus() {
    console.log('🔍 VM STATUS CHECK\n');
    
    // Check basic connectivity
    try {
        console.log('1️⃣ Testing VM connectivity...');
        const pingResult = await execAsync(`ping -c 2 ${VM_IP}`, { timeout: 10000 });
        console.log('✅ VM is reachable');
    } catch (error) {
        console.log('❌ VM not reachable');
        return;
    }
    
    // Check webhook port
    try {
        console.log('2️⃣ Testing webhook port 3000...');
        const webhookTest = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 5000 });
        console.log('✅ Webhook port open:', webhookTest.status);
    } catch (error) {
        console.log('❌ Webhook port 3000:', error.code || error.message);
    }
    
    // Check Ollama port
    try {
        console.log('3️⃣ Testing Ollama port 11434...');
        const ollamaTest = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 5000 });
        console.log('✅ Ollama port open:', ollamaTest.data);
    } catch (error) {
        console.log('❌ Ollama port 11434:', error.code || error.message);
    }
    
    // Check SSH connectivity
    try {
        console.log('4️⃣ Testing SSH access...');
        const sshResult = await execAsync(`timeout 10 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${VM_IP} echo "SSH OK"`, { timeout: 15000 });
        console.log('✅ SSH accessible');
    } catch (error) {
        console.log('❌ SSH access failed:', error.message);
        
        // Try with password
        try {
            const sshPassResult = await execAsync(`timeout 10 sshpass -p 'droplet' ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${VM_IP} echo "SSH with password OK"`, { timeout: 15000 });
            console.log('✅ SSH with password works');
        } catch {
            console.log('❌ SSH with password also failed');
        }
    }
    
    // Check ngrok tunnel
    try {
        console.log('5️⃣ Testing ngrok tunnel...');
        const ngrokTest = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', { 
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ ngrok tunnel active:', ngrokTest.status);
    } catch (error) {
        console.log('❌ ngrok tunnel:', error.code || error.message);
    }
    
    console.log('\n📊 STATUS SUMMARY:');
    console.log('VM IP:', VM_IP);
    console.log('Expected services: Webhook (3000), Ollama (11434), SSH (22)');
    console.log('ngrok URL: https://6ecac5910ac8.ngrok-free.app');
}

checkVMStatus().catch(console.error);