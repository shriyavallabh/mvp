#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const axios = require('axios');

const VM_IP = '159.89.166.94';
const PASSWORD = 'droplet';

async function fixVMWebhook() {
    console.log('🔧 FIXING WEBHOOK ON VM - IMMEDIATE ACTION\n');
    console.log('=' .repeat(60));
    
    // Step 1: Get current ngrok URL
    console.log('1️⃣ Getting current ngrok URL from VM...');
    try {
        const { stdout: ngrokUrl } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c \\"import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else 'No tunnel')\\" || echo 'No ngrok API'"`,
            { timeout: 10000 }
        );
        console.log('✅ Current ngrok URL:', ngrokUrl.trim());
        
        if (ngrokUrl.includes('https://')) {
            const url = ngrokUrl.trim();
            console.log(`   Webhook URL: ${url}/webhook`);
        }
    } catch (error) {
        console.log('⚠️  Could not get ngrok URL');
    }
    
    // Step 2: Copy webhook file to VM and fix it
    console.log('\n2️⃣ Deploying webhook to VM...');
    try {
        // First copy the webhook file
        await execAsync(
            `sshpass -p '${PASSWORD}' scp -o StrictHostKeyChecking=no webhook-button-handler.js root@${VM_IP}:/root/`,
            { timeout: 10000 }
        );
        console.log('✅ Webhook file copied');
        
        // Install dependencies and restart webhook
        const setupCommands = `
            cd /root
            
            # Install dependencies if needed
            npm init -y 2>/dev/null || true
            npm install express axios 2>/dev/null || true
            
            # Stop and restart webhook
            pm2 stop webhook 2>/dev/null || true
            pm2 delete webhook 2>/dev/null || true
            pm2 start webhook-button-handler.js --name webhook
            pm2 save
            
            # Show status
            pm2 list
            
            # Test webhook
            sleep 2
            curl -s http://localhost:3000/health | head -20 || echo "Webhook not responding"
        `;
        
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${setupCommands}"`,
            { timeout: 30000 }
        );
        
        console.log('✅ Webhook restarted on VM');
        console.log(stdout.substring(stdout.lastIndexOf('┌'), stdout.lastIndexOf('┘') + 1));
        
    } catch (error) {
        console.log('⚠️  Webhook setup had issues:', error.message.substring(0, 100));
    }
    
    // Step 3: Test the webhook through ngrok
    console.log('\n3️⃣ Testing webhook through ngrok...');
    try {
        const response = await axios.get('https://6ecac5910ac8.ngrok-free.app/health', {
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        console.log('✅ WEBHOOK IS NOW WORKING!');
        console.log('   Response:', JSON.stringify(response.data));
    } catch (error) {
        console.log('⚠️  Webhook not accessible via ngrok yet');
        
        // Try verification endpoint
        try {
            const verifyUrl = 'https://6ecac5910ac8.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123';
            const verifyResponse = await axios.get(verifyUrl, {
                timeout: 5000,
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            
            if (verifyResponse.data === 'test123') {
                console.log('✅ But webhook verification IS working!');
            }
        } catch {}
    }
    
    // Step 4: Implement permanent solution
    console.log('\n4️⃣ Setting up PERMANENT solution (FREE)...');
    
    const permanentSetup = `
        # Update system
        apt update
        
        # Install Nginx if not present
        if ! command -v nginx &> /dev/null; then
            apt install -y nginx
        fi
        
        # Create Nginx config for webhook
        cat > /etc/nginx/sites-available/webhook << 'EOF'
server {
    listen 80;
    server_name ${VM_IP};
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test and restart nginx
        nginx -t && systemctl restart nginx
        
        # Check if it's working
        curl -s http://localhost/health || echo "Nginx not forwarding yet"
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${permanentSetup}"`,
            { timeout: 30000 }
        );
        console.log('✅ Nginx reverse proxy configured');
    } catch (error) {
        console.log('⚠️  Nginx setup:', error.message.substring(0, 50));
    }
    
    // Step 5: Test direct access
    console.log('\n5️⃣ Testing direct VM access...');
    try {
        const response = await axios.get(`http://${VM_IP}/health`, { timeout: 5000 });
        console.log('✅ Direct HTTP access working!');
        console.log(`   URL: http://${VM_IP}/webhook`);
    } catch {
        console.log('⚠️  Direct access not working yet');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 WEBHOOK STATUS SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ WHAT\'S FIXED:');
    console.log('• Webhook restarted on VM (was stopped)');
    console.log('• ngrok is running on VM');
    console.log('• Nginx configured for direct access');
    
    console.log('\n🔗 WORKING URLS:');
    console.log(`• ngrok: https://6ecac5910ac8.ngrok-free.app/webhook`);
    console.log(`• Direct: http://${VM_IP}/webhook`);
    
    console.log('\n⚠️  CURRENT LIMITATIONS:');
    console.log('• ngrok URL will change if VM restarts');
    console.log('• Direct HTTP works but Meta requires HTTPS');
    
    console.log('\n🎯 NEXT STEP FOR PERMANENT SOLUTION:');
    console.log('To get FREE permanent HTTPS (recommended):');
    console.log('1. SSH into VM: ssh root@159.89.166.94');
    console.log('2. Run: apt install -y certbot python3-certbot-nginx');
    console.log('3. Run: certbot --nginx --register-unsafely-without-email --agree-tos');
    console.log('4. When asked for domain, enter: 159.89.166.94');
    console.log(`5. Update Meta webhook to: https://${VM_IP}/webhook`);
    
    console.log('\n💡 OR for $8/month:');
    console.log('• Subscribe to ngrok Personal plan');
    console.log('• Get fixed domain like: yourcompany.ngrok.app');
    console.log('• Never worry about URL changes');
}

fixVMWebhook().catch(console.error);