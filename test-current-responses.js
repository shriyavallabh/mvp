#!/usr/bin/env node

const axios = require('axios');

async function testCurrentResponses() {
    console.log('🧪 TESTING CURRENT WEBHOOK RESPONSES\n');

    const testMessages = [
        'love you',
        'done', 
        'love you again',
        'I am done',
        'love',
        'finished'
    ];

    console.log('Testing webhook via ngrok tunnel...\n');

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
                            profile: { name: 'Test User' }
                        }]
                    }
                }]
            }]
        };

        try {
            const startTime = Date.now();
            const response = await axios.post('https://6ecac5910ac8.ngrok-free.app/webhook', payload, {
                timeout: 30000,
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`   ✅ Response in ${responseTime}ms (Status: ${response.status})`);
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.code} - ${error.message}`);
        }
    }

    console.log('\n🔍 Testing webhook health endpoint...');
    try {
        const healthCheck = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            timeout: 10000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ Health check:', healthCheck.data);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }

    console.log('\n🤖 Testing AI response endpoint...');
    try {
        const aiTest = await axios.get('https://6ecac5910ac8.ngrok-free.app/test-ollama', {
            timeout: 15000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ AI test response:', aiTest.data);
    } catch (error) {
        console.log('❌ AI test failed:', error.message);
    }

    console.log('\n📊 RESPONSE ANALYSIS');
    console.log('If responses are working via ngrok, the system is functional.');
    console.log('The key test is whether repeated "love you" messages get different responses.');
    console.log('Check your WhatsApp to see if responses are varied or identical.');
}

testCurrentResponses().catch(console.error);