#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function completeE2ETest() {
    console.log('🔍 COMPLETE END-TO-END DIAGNOSIS\n');
    
    let issues = [];
    
    // 1. Check if webhook is actually receiving REAL messages
    console.log('1️⃣ Checking last 30 webhook logs for REAL messages from your number...');
    try {
        const logsCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 logs webhook --lines 30 --nostream | grep -E '919765071249|Message from' || echo 'No messages found'"`;
        const { stdout } = await execAsync(logsCmd, { timeout: 10000 });
        
        if (stdout.includes('919765071249')) {
            console.log('✅ Found messages from your number in logs');
            console.log(stdout.substring(0, 300));
        } else {
            console.log('❌ NO MESSAGES from your number found in logs!');
            issues.push('Webhook not receiving your messages');
        }
    } catch (error) {
        console.log('❌ Could not check logs');
    }
    
    // 2. Check Meta webhook configuration
    console.log('\n2️⃣ Current webhook URL configured in Meta:');
    console.log('   Expected: https://6ecac5910ac8.ngrok-free.app/webhook');
    console.log('   ⚠️  If different, messages won\'t reach the webhook');
    
    // 3. Test ngrok tunnel
    console.log('\n3️⃣ Testing ngrok tunnel...');
    try {
        const ngrokTest = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 8000
        });
        console.log('✅ ngrok tunnel is active');
    } catch (error) {
        console.log('❌ ngrok tunnel is DOWN!');
        issues.push('ngrok tunnel not working');
    }
    
    // 4. Check WhatsApp credentials from .env
    console.log('\n4️⃣ Checking WhatsApp credentials...');
    try {
        const { stdout: phoneId } = await execAsync('grep WHATSAPP_PHONE_NUMBER_ID .env 2>/dev/null || echo "NOT_FOUND"', { timeout: 5000 });
        const { stdout: token } = await execAsync('grep WHATSAPP_ACCESS_TOKEN .env 2>/dev/null || echo "NOT_FOUND"', { timeout: 5000 });
        
        console.log('Phone Number ID:', phoneId.trim().substring(0, 50));
        console.log('Access Token:', token.trim().substring(0, 30) + '...');
        
        if (phoneId.includes('NOT_FOUND') || token.includes('NOT_FOUND')) {
            issues.push('Missing WhatsApp credentials');
        }
    } catch (error) {
        console.log('❌ Could not read credentials');
    }
    
    // 5. Test sending a REAL message via WhatsApp API
    console.log('\n5️⃣ Testing WhatsApp API send capability...');
    const PHONE_ID = '515322611682990';
    const TOKEN = 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: '919765071249',
                type: 'text',
                text: { body: '🤖 TEST: If you see this, WhatsApp API is working!' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ WhatsApp API test successful!');
        console.log('   Message ID:', response.data.messages?.[0]?.id);
        console.log('   📱 CHECK YOUR WHATSAPP NOW - You should see the test message!');
    } catch (error) {
        console.log('❌ WhatsApp API failed:', error.response?.data?.error || error.message);
        issues.push('WhatsApp API not working');
    }
    
    // 6. Check webhook error logs
    console.log('\n6️⃣ Checking webhook error logs...');
    try {
        const errorCmd = `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 logs webhook --err --lines 10 --nostream | head -20"`;
        const { stdout } = await execAsync(errorCmd, { timeout: 10000 });
        if (stdout.includes('error') || stdout.includes('Error')) {
            console.log('⚠️  Found errors in webhook:');
            console.log(stdout.substring(0, 300));
        } else {
            console.log('✅ No recent errors');
        }
    } catch (error) {
        console.log('Could not check error logs');
    }
    
    // DIAGNOSIS SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        issues.forEach(issue => console.log(`   • ${issue}`));
    } else {
        console.log('\n✅ All systems appear functional');
    }
    
    console.log('\n🔧 MOST LIKELY PROBLEMS:');
    console.log('1. Meta webhook URL is pointing to old/dead ngrok URL');
    console.log('2. WhatsApp access token has expired');
    console.log('3. Phone number ID is incorrect');
    console.log('4. Webhook receives but doesn\'t send responses');
    
    console.log('\n📱 DID YOU RECEIVE THE TEST MESSAGE?');
    console.log('If YES → API works, webhook needs fixing');
    console.log('If NO → API credentials are wrong');
}

completeE2ETest().catch(console.error);
