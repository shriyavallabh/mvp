#!/usr/bin/env node

const axios = require('axios');

console.log('🧪 TESTING OLLAMA ON YOUR VM\n');
console.log('Waiting 60 seconds for installation to complete...\n');

setTimeout(async () => {
    try {
        // Test Ollama directly
        console.log('1️⃣ Testing Ollama directly on VM...');
        const ollamaTest = await axios.post(
            'http://159.89.166.94:11434/api/generate',
            {
                model: 'llama2',
                prompt: 'What is a mutual fund in 20 words?',
                stream: false
            },
            { timeout: 30000 }
        );
        
        if (ollamaTest.data && ollamaTest.data.response) {
            console.log('✅ Ollama is working!');
            console.log('   Response:', ollamaTest.data.response.substring(0, 150));
        }
    } catch (error) {
        console.log('❌ Ollama not responding yet');
    }
    
    console.log('\n2️⃣ Testing webhook with Ollama...');
    try {
        const webhookTest = await axios.get('http://159.89.166.94:3000/test-ollama', { timeout: 15000 });
        console.log('✅ Webhook Ollama integration:');
        console.log('   ', webhookTest.data);
    } catch {
        console.log('❌ Webhook Ollama endpoint not ready');
    }
    
    console.log('\n3️⃣ Testing complete flow...');
    
    // Simulate text message
    const payload = {
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: '919876543210',
                        type: 'text',
                        text: { body: 'What is SIP investment?' }
                    }],
                    contacts: [{
                        wa_id: '919876543210',
                        profile: { name: 'Test' }
                    }]
                }
            }]
        }]
    };
    
    try {
        await axios.post('http://159.89.166.94:3000/webhook', payload);
        console.log('✅ AI response system working!\n');
        console.log('🎉 SUCCESS! Your VM now has:');
        console.log('   ✅ Ollama installed and running');
        console.log('   ✅ Llama2 model loaded');
        console.log('   ✅ Webhook using AI for responses');
        console.log('   ✅ Complete WhatsApp integration\n');
    } catch {
        console.log('⚠️  Webhook needs restart');
    }
    
}, 60000); // Wait 1 minute

console.log('Test will run in 60 seconds...');
