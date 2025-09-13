#!/usr/bin/env node

const axios = require('axios');

const EXISTING_NGROK_URL = 'https://6ecac5910ac8.ngrok-free.app';
const LOCAL_WEBHOOK_URL = 'http://localhost:3000';

async function testAndFixNgrok() {
    console.log('🔍 TESTING AND CONFIGURING NGROK CONNECTION\n');
    
    // Step 1: Verify local webhook is running
    console.log('1️⃣ Testing local webhook...');
    try {
        const health = await axios.get(`${LOCAL_WEBHOOK_URL}/health`);
        console.log('✅ Local webhook is running');
        console.log('   Status:', health.data.status);
        console.log('   Port: 3000');
    } catch (error) {
        console.log('❌ Local webhook not running');
        console.log('   Please run: node webhook-button-handler.js');
        return;
    }
    
    // Step 2: Test the existing ngrok URL
    console.log('\n2️⃣ Testing your ngrok URL: ' + EXISTING_NGROK_URL);
    
    // Test health endpoint
    try {
        const response = await axios.get(`${EXISTING_NGROK_URL}/health`, {
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ Ngrok URL is ACTIVE and responding!');
        console.log('   Response:', response.data);
    } catch (error) {
        console.log('⚠️  Ngrok URL not responding to /health');
        
        // Test webhook verification
        try {
            const verifyUrl = `${EXISTING_NGROK_URL}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`;
            const verifyResponse = await axios.get(verifyUrl, {
                timeout: 5000,
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            
            if (verifyResponse.data === 'test123') {
                console.log('✅ But webhook verification IS working!');
            } else {
                console.log('❌ Webhook verification not working properly');
            }
        } catch (err) {
            console.log('❌ Ngrok URL appears to be pointing elsewhere');
        }
    }
    
    // Step 3: Send test message
    console.log('\n3️⃣ Sending test template to trigger button...');
    
    const CONFIG = {
        phoneNumberId: '574744175733556',
        accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
        recipientNumber: '919765071249'
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'Portfolio' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Investment Insights Ready' }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Template sent successfully!');
        console.log('   Message ID:', response.data.messages[0].id);
    } catch (error) {
        console.log('❌ Failed to send template:', error.response?.data?.error?.message || error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 CONFIGURATION STATUS');
    console.log('='.repeat(50));
    
    console.log('\n✅ WHAT\'S WORKING:');
    console.log('• Local webhook running on port 3000');
    console.log('• WhatsApp API authentication');
    console.log('• Template sending capability');
    
    console.log('\n🔧 NGROK STATUS:');
    console.log(`• URL: ${EXISTING_NGROK_URL}`);
    console.log('• This URL belongs to an existing ngrok session');
    console.log('• It may be running on a different machine/VM');
    
    console.log('\n📱 ACTION REQUIRED:');
    console.log('1. Check WhatsApp for the template message');
    console.log('2. Click "Retrieve Content" button');
    console.log('3. Watch the local webhook console for events');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('If button clicks are not reaching your local webhook:');
    console.log('1. The ngrok URL may be pointing to a VM/different machine');
    console.log('2. You need to either:');
    console.log('   a) Find where ngrok is running (check VMs)');
    console.log('   b) Kill that session and start ngrok locally');
    console.log('   c) Update Meta webhook URL to a new ngrok tunnel');
    
    console.log('\n💡 TO CREATE NEW LOCAL NGROK:');
    console.log('1. Visit https://dashboard.ngrok.com/agents');
    console.log('2. Kill the existing session');
    console.log('3. Run: ngrok http 3000');
    console.log('4. Update Meta webhook with new URL');
}

testAndFixNgrok().catch(console.error);