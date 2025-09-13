#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function configureWebhookLocally() {
    console.log('🔧 CONFIGURING WEBHOOK WITH EXISTING NGROK URL\n');
    
    // Step 1: Check if webhook is running locally
    console.log('1️⃣ Checking local webhook...');
    try {
        const response = await axios.get('http://localhost:3000/health', { timeout: 2000 });
        console.log('✅ Webhook is running locally');
        console.log('   Status:', response.data.status);
        console.log('   Content types:', response.data.contentTypes.join(', '));
    } catch (error) {
        console.log('❌ Webhook not running locally');
        console.log('   Starting webhook...');
        
        // Start webhook in background
        exec('node webhook-button-handler.js', (error, stdout, stderr) => {
            if (error) {
                console.error('Webhook error:', error);
            }
        });
        
        // Wait for it to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
            const response = await axios.get('http://localhost:3000/health', { timeout: 2000 });
            console.log('✅ Webhook started successfully');
        } catch (err) {
            console.log('❌ Failed to start webhook');
            return;
        }
    }
    
    // Step 2: Test the existing ngrok URL
    console.log('\n2️⃣ Testing existing ngrok URL...');
    const ngrokUrl = 'https://6ecac5910ac8.ngrok-free.app';
    
    try {
        const response = await axios.get(`${ngrokUrl}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`, {
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (response.data === 'test123') {
            console.log('✅ Ngrok URL is working and connected to webhook!');
            console.log('   Webhook verification successful');
        } else {
            console.log('⚠️  Ngrok connected but webhook verification failed');
        }
    } catch (error) {
        console.log('❌ Ngrok URL not connecting to our webhook');
        console.log('   Error:', error.message);
        
        // Try to establish new ngrok tunnel
        console.log('\n3️⃣ Attempting to establish ngrok tunnel...');
        console.log('   Note: This will create a NEW ngrok URL');
        console.log('   The existing URL (6ecac5910ac8.ngrok-free.app) belongs to another session\n');
        
        try {
            // Kill any existing ngrok
            await execAsync('pkill ngrok 2>/dev/null || true');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start new ngrok
            exec('ngrok http 3000', (error, stdout, stderr) => {
                if (error) {
                    console.error('ngrok error:', error.message);
                }
            });
            
            // Wait for ngrok to start
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Get the new URL
            const { stdout } = await execAsync('curl -s http://localhost:4040/api/tunnels 2>/dev/null || echo "{}"');
            const tunnels = JSON.parse(stdout || '{}');
            
            if (tunnels.tunnels && tunnels.tunnels.length > 0) {
                const newUrl = tunnels.tunnels[0].public_url;
                console.log('✅ NEW ngrok tunnel created!');
                console.log(`   URL: ${newUrl}`);
                console.log(`   Webhook URL: ${newUrl}/webhook`);
                console.log('\n⚠️  IMPORTANT: Update Meta webhook configuration with this new URL');
            } else {
                console.log('❌ Could not create new ngrok tunnel');
                console.log('   You may have reached ngrok session limit');
            }
        } catch (err) {
            console.log('❌ Failed to establish ngrok tunnel:', err.message);
        }
    }
    
    // Step 4: Test complete flow
    console.log('\n4️⃣ Testing WhatsApp integration...');
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
                                { type: 'text', text: 'Investment' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Market Insights Available' }
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
        
        console.log('✅ Test template sent successfully!');
        console.log('   Message ID:', response.data.messages[0].id);
        console.log('\n📱 CHECK YOUR WHATSAPP:');
        console.log('   1. You should see the template message');
        console.log('   2. Click "Retrieve Content" button');
        console.log('   3. Watch the webhook console for events');
    } catch (error) {
        console.log('❌ Failed to send test template:', error.response?.data?.error?.message || error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 CONFIGURATION SUMMARY');
    console.log('='.repeat(50));
    console.log('\nWEBHOOK STATUS:');
    console.log('• Local webhook: Running on port 3000');
    console.log('• Health endpoint: http://localhost:3000/health');
    console.log(`• Ngrok URL: ${ngrokUrl}/webhook`);
    console.log('\nWHATSAPP CONFIG:');
    console.log('• Phone Number ID: 574744175733556');
    console.log('• Template: daily_content_ready_v1');
    console.log('• Recipient: 919765071249');
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. If ngrok URL is not working, you need to:');
    console.log('   - Check who owns the ngrok session at dashboard.ngrok.com');
    console.log('   - Or create a new ngrok tunnel (will get new URL)');
    console.log('2. Make sure Meta webhook URL matches the working ngrok URL');
    console.log('3. Monitor webhook console for incoming button clicks');
}

configureWebhookLocally().catch(console.error);