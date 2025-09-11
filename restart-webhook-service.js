#!/usr/bin/env node

const axios = require('axios');

const DO_TOKEN = 'YOUR_DO_TOKEN_HERE';
const DROPLET_ID = '518113785';

const doAPI = axios.create({
    baseURL: 'https://api.digitalocean.com/v2',
    headers: {
        'Authorization': `Bearer ${DO_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

console.log('🔄 RESTARTING WEBHOOK SERVICE');
console.log('==============================\n');

async function powerCycleDroplet() {
    try {
        console.log('1. Power cycling droplet to restart services...');
        
        // Power off
        console.log('   Powering off...');
        await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'power_off'
        });
        
        // Wait 30 seconds
        console.log('   Waiting 30 seconds...');
        await new Promise(r => setTimeout(r, 30000));
        
        // Power on
        console.log('   Powering on...');
        await doAPI.post(`/droplets/${DROPLET_ID}/actions`, {
            type: 'power_on'  
        });
        
        console.log('✅ Power cycle complete\n');
        
        // Wait for boot
        console.log('2. Waiting 2 minutes for services to start...');
        await new Promise(r => setTimeout(r, 120000));
        
        // Test webhook
        console.log('\n3. Testing webhook...');
        for (let i = 0; i < 5; i++) {
            try {
                const response = await axios.get('http://hubix.duckdns.org/webhook', {
                    params: {
                        'hub.mode': 'subscribe',
                        'hub.verify_token': 'jarvish_webhook_2024',
                        'hub.challenge': 'RESTART_TEST'
                    },
                    timeout: 5000
                });
                
                if (response.data === 'RESTART_TEST') {
                    console.log('🎉 WEBHOOK IS WORKING!');
                    console.log('\n✅ Meta verification should work now!');
                    console.log('URL: http://hubix.duckdns.org/webhook');
                    console.log('Token: jarvish_webhook_2024');
                    return;
                }
            } catch (error) {
                console.log(`   Attempt ${i+1}/5: ${error.message}`);
                if (i < 4) await new Promise(r => setTimeout(r, 30000));
            }
        }
        
        console.log('\n⚠️ Webhook may need manual intervention');
        console.log('SSH to VM and run the commands from fix-nginx-config.sh');
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

powerCycleDroplet();