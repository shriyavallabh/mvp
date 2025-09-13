#!/usr/bin/env node

const axios = require('axios');

const VM_IP = '159.89.166.94';

async function checkRealAIDeployment() {
    console.log('🔍 CHECKING REAL AI DEPLOYMENT STATUS\n');

    // 1. Check if Ollama service is running
    console.log('1️⃣ Testing Ollama service directly...');
    try {
        const ollamaStatus = await axios.get(`http://${VM_IP}:11434/api/tags`, { timeout: 10000 });
        console.log('✅ Ollama is running');
        console.log('📦 Available models:', ollamaStatus.data.models?.map(m => m.name) || 'None');
        
        if (!ollamaStatus.data.models || ollamaStatus.data.models.length === 0) {
            console.log('❌ NO AI MODELS INSTALLED ON OLLAMA!');
        }
    } catch (error) {
        console.log('❌ Ollama service not accessible:', error.code);
        console.log('   This means the AI model is not running at all');
    }

    // 2. Test phi model directly
    console.log('\n2️⃣ Testing phi model directly...');
    try {
        const phiTest = await axios.post(`http://${VM_IP}:11434/api/generate`, {
            model: 'phi',
            prompt: 'Say hello in exactly 3 words',
            stream: false
        }, { timeout: 30000 });
        
        if (phiTest.data && phiTest.data.response) {
            console.log('✅ PHI MODEL IS WORKING!');
            console.log('   Response:', phiTest.data.response);
        }
    } catch (error) {
        console.log('❌ PHI model not working:', error.message);
        console.log('   This is why you\'re getting "AI services unavailable"');
    }

    // 3. Check webhook AI integration
    console.log('\n3️⃣ Testing webhook AI endpoint...');
    try {
        const webhookAI = await axios.get(`http://${VM_IP}:3000/test-ollama`, { timeout: 15000 });
        console.log('✅ Webhook AI integration:', webhookAI.data);
    } catch (error) {
        console.log('❌ Webhook AI endpoint failed:', error.message);
    }

    // 4. Check webhook health
    console.log('\n4️⃣ Checking webhook health...');
    try {
        const health = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 5000 });
        console.log('✅ Webhook health:', health.data);
        
        if (health.data.ai_model !== 'phi' || health.data.approach !== 'Real AI - No hardcoding') {
            console.log('⚠️  Webhook may be using fallback responses, not real AI');
        }
    } catch (error) {
        console.log('❌ Webhook health check failed:', error.message);
    }

    // 5. Test via ngrok
    console.log('\n5️⃣ Testing via ngrok tunnel...');
    try {
        const ngrokHealth = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 5000
        });
        console.log('✅ ngrok tunnel health:', ngrokHealth.data);
    } catch (error) {
        console.log('❌ ngrok tunnel issue:', error.message);
    }

    console.log('\n📋 DIAGNOSIS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 NEXT STEPS NEEDED:');
    console.log('If Ollama shows no models → Install phi model');
    console.log('If phi test fails → Model installation incomplete');  
    console.log('If webhook AI fails → Integration broken');
    console.log('If all pass but you get "unavailable" → Check WhatsApp responses again');
}

checkRealAIDeployment().catch(console.error);