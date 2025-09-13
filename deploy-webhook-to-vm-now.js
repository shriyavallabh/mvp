#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs').promises;

const VM_IPS = ['159.89.166.94', '139.59.51.237'];
const PASSWORD = 'droplet';

async function deployWebhookToVM() {
    console.log('🚀 DEPLOYING WEBHOOK TO VM WITH NGROK\n');
    
    // First, try to find which VM is accessible
    let VM_IP = null;
    for (const ip of VM_IPS) {
        try {
            console.log(`Testing VM ${ip}...`);
            await execAsync(`timeout 5 sshpass -p '${PASSWORD}' ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no root@${ip} "echo OK"`, { timeout: 8000 });
            VM_IP = ip;
            console.log(`✅ VM ${ip} is accessible\n`);
            break;
        } catch (error) {
            console.log(`❌ VM ${ip} not accessible`);
        }
    }
    
    if (!VM_IP) {
        console.log('\n❌ No VM is accessible. Please check your VMs.');
        return;
    }
    
    // Step 1: Copy webhook file to VM
    console.log('1️⃣ Copying webhook file to VM...');
    try {
        await execAsync(`sshpass -p '${PASSWORD}' scp -o StrictHostKeyChecking=no webhook-button-handler.js root@${VM_IP}:/root/`, { timeout: 10000 });
        console.log('✅ Webhook file copied');
    } catch (error) {
        console.log('❌ Failed to copy file:', error.message);
    }
    
    // Step 2: Install dependencies and setup on VM
    console.log('\n2️⃣ Setting up webhook on VM...');
    const setupCommands = `
        cd /root
        
        # Install Node.js if not present
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        fi
        
        # Install PM2 if not present
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi
        
        # Stop any existing webhook
        pm2 stop webhook 2>/dev/null || true
        pm2 delete webhook 2>/dev/null || true
        
        # Install dependencies
        npm init -y 2>/dev/null || true
        npm install express axios
        
        # Start webhook with PM2
        pm2 start webhook-button-handler.js --name webhook
        pm2 save
        
        # Check if ngrok is installed
        if ! command -v ngrok &> /dev/null; then
            wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
            tar -xzf ngrok-v3-stable-linux-amd64.tgz
            mv ngrok /usr/local/bin/
            rm ngrok-v3-stable-linux-amd64.tgz
        fi
        
        # Kill any existing ngrok
        pkill ngrok 2>/dev/null || true
        sleep 2
        
        # Configure ngrok (if authtoken exists)
        if [ -f /root/.ngrok2/ngrok.yml ]; then
            echo "ngrok already configured"
        else
            # You'll need to add your authtoken here
            echo "Please configure ngrok authtoken"
        fi
        
        # Start ngrok in background
        nohup ngrok http 3000 > /root/ngrok.log 2>&1 &
        
        sleep 5
        
        # Get ngrok URL
        curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1
    `;
    
    try {
        const { stdout } = await execAsync(`sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${setupCommands}"`, { timeout: 60000 });
        console.log('✅ Webhook setup complete');
        
        if (stdout.includes('https://')) {
            const ngrokUrl = stdout.match(/https:\/\/[^\s]+/)[0];
            console.log(`\n📡 NEW NGROK URL: ${ngrokUrl}`);
            console.log(`Webhook URL: ${ngrokUrl}/webhook`);
        }
    } catch (error) {
        console.log('⚠️  Setup completed with warnings:', error.message.substring(0, 100));
    }
    
    // Step 3: Check webhook status
    console.log('\n3️⃣ Checking webhook status...');
    try {
        const { stdout } = await execAsync(`sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "pm2 list"`, { timeout: 10000 });
        console.log(stdout);
    } catch (error) {
        console.log('Could not check PM2 status');
    }
    
    // Step 4: Test the webhook
    console.log('\n4️⃣ Testing webhook...');
    try {
        // Try the existing ngrok URL first
        const existingUrl = 'https://6ecac5910ac8.ngrok-free.app';
        const response = await axios.get(`${existingUrl}/health`, { 
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ Webhook accessible via ngrok!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Webhook not accessible via ngrok');
        
        // Try direct VM access
        try {
            const response = await axios.get(`http://${VM_IP}:3000/health`, { timeout: 5000 });
            console.log('✅ Webhook accessible directly on VM');
            console.log('Response:', response.data);
        } catch (err) {
            console.log('❌ Webhook not accessible directly either');
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(50));
    console.log(`VM IP: ${VM_IP}`);
    console.log('Webhook Process: PM2 managed');
    console.log('Port: 3000');
    console.log('Existing ngrok URL: https://6ecac5910ac8.ngrok-free.app/webhook');
    console.log('\n⚠️  IMPORTANT: The ngrok URL may have changed!');
    console.log('If the existing URL doesn\'t work, check the VM for the new URL.');
    console.log('\n📱 Update Meta webhook configuration if URL changed.');
}

deployWebhookToVM().catch(console.error);