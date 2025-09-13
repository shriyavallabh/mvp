const axios = require('axios');

console.log('🧪 TESTING UNIQUE AI RESPONSES\n');

async function testUniqueResponses() {
    const testMessages = [
        'love you',
        'done',
        'love you',
        'I am done',
        'love',
        'finished',
        'love you so much',
        'done with everything'
    ];

    console.log('Testing webhook for unique responses...\n');

    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`${i + 1}️⃣ Testing: "${message}"`);

        const payload = {
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            from: '919765071249',
                            type: 'text',
                            text: { body: message }
                        }],
                        contacts: [{
                            wa_id: '919765071249',
                            profile: { name: 'User' }
                        }]
                    }
                }]
            }]
        };

        try {
            const response = await axios.post('https://6ecac5910ac8.ngrok-free.app/webhook', payload, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('   ✅ Response sent to WhatsApp');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log('   ❌ Failed:', error.message);
        }
    }

    console.log('\n🔍 Now checking Ollama status directly...');
    
    try {
        const ollamaCheck = await axios.post(
            'http://159.89.166.94:11434/api/generate',
            {
                model: 'tinyllama',
                prompt: 'Say hello in exactly 5 words',
                stream: false
            },
            { timeout: 20000 }
        );
        
        if (ollamaCheck.data && ollamaCheck.data.response) {
            console.log('✅ Ollama tinyllama is responding!');
            console.log('   Response:', ollamaCheck.data.response);
        }
    } catch (error) {
        console.log('❌ Ollama not ready:', error.message);
        
        try {
            const statusCheck = await axios.get('http://159.89.166.94:11434/api/tags', { timeout: 10000 });
            console.log('📋 Available models:', statusCheck.data);
        } catch {
            console.log('⚠️  Ollama service may not be running');
        }
    }
}

testUniqueResponses();
