#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IPS = ['159.89.166.94', '139.59.51.237'];
const PASSWORD = 'droplet';

async function checkVMAndFindPermanentSolution() {
    console.log('🔍 COMPREHENSIVE VM & NGROK INVESTIGATION\n');
    console.log('=' .repeat(60));
    
    let activeVM = null;
    
    // Step 1: Try to connect to VMs
    console.log('1️⃣ CHECKING VM ACCESSIBILITY...\n');
    
    for (const ip of VM_IPS) {
        console.log(`Testing VM ${ip}...`);
        try {
            const { stdout } = await execAsync(
                `sshpass -p '${PASSWORD}' ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${ip} "hostname && uptime"`,
                { timeout: 15000 }
            );
            console.log(`✅ Connected to ${ip}`);
            console.log(`   ${stdout.trim()}`);
            activeVM = ip;
            break;
        } catch (error) {
            console.log(`❌ Cannot connect to ${ip}`);
        }
    }
    
    if (!activeVM) {
        console.log('\n⚠️  No VM accessible. Checking if they exist...');
        
        // Try to ping
        for (const ip of VM_IPS) {
            try {
                await execAsync(`ping -c 2 -W 2 ${ip}`, { timeout: 5000 });
                console.log(`📡 ${ip} is online but SSH failed (check password/firewall)`);
            } catch {
                console.log(`☠️  ${ip} is completely unreachable`);
            }
        }
    } else {
        // Step 2: Check what's running on the VM
        console.log(`\n2️⃣ CHECKING SERVICES ON VM ${activeVM}...\n`);
        
        try {
            // Check ngrok
            console.log('Checking ngrok status...');
            const { stdout: ngrokCheck } = await execAsync(
                `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${activeVM} "ps aux | grep ngrok | grep -v grep || echo 'No ngrok running'"`,
                { timeout: 10000 }
            );
            console.log('ngrok:', ngrokCheck.trim());
            
            // Check ngrok URL if running
            if (!ngrokCheck.includes('No ngrok')) {
                try {
                    const { stdout: ngrokUrl } = await execAsync(
                        `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${activeVM} "curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^\"]*' | head -1 || echo 'No tunnel'"`,
                        { timeout: 10000 }
                    );
                    console.log('Current ngrok URL:', ngrokUrl.trim());
                } catch {}
            }
            
            // Check webhook
            console.log('\nChecking webhook status...');
            const { stdout: webhookCheck } = await execAsync(
                `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${activeVM} "pm2 list 2>/dev/null || ps aux | grep node | grep webhook | grep -v grep || echo 'No webhook running'"`,
                { timeout: 10000 }
            );
            console.log('Webhook:', webhookCheck.trim());
            
            // Check ports
            console.log('\nChecking open ports...');
            const { stdout: portsCheck } = await execAsync(
                `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${activeVM} "netstat -tlnp 2>/dev/null | grep -E ':(3000|4040|80|443)' || ss -tlnp | grep -E ':(3000|4040|80|443)' || echo 'Cannot check ports'"`,
                { timeout: 10000 }
            );
            console.log('Ports:', portsCheck.trim());
            
        } catch (error) {
            console.log('Error checking services:', error.message.substring(0, 100));
        }
    }
    
    // Step 3: Explain ngrok limitations and solutions
    console.log('\n' + '='.repeat(60));
    console.log('📊 NGROK LIMITATIONS & PERMANENT SOLUTIONS');
    console.log('='.repeat(60));
    
    console.log('\n🔴 NGROK FREE TIER LIMITATIONS:');
    console.log('• URLs change every time ngrok restarts');
    console.log('• Session expires after ~8 hours of inactivity');
    console.log('• Limited to 1 active tunnel');
    console.log('• 40 connections/minute limit');
    console.log('• Random subdomain (6ecac5910ac8.ngrok-free.app)');
    
    console.log('\n💰 PRODUCTION OPTIONS (CHEAPEST TO MOST EXPENSIVE):');
    
    console.log('\n1️⃣ OPTION 1: Direct HTTPS with Let\'s Encrypt (FREE) ⭐ RECOMMENDED');
    console.log('   Cost: $0/month');
    console.log('   Setup:');
    console.log('   • Use your VM\'s IP directly (139.59.51.237 or 159.89.166.94)');
    console.log('   • Install Nginx + Certbot for SSL');
    console.log('   • Point webhook to https://YOUR-VM-IP/webhook');
    console.log('   Pros: Completely free, permanent, reliable');
    console.log('   Cons: Exposes VM IP (but that\'s OK for webhooks)');
    
    console.log('\n2️⃣ OPTION 2: Cloudflare Tunnel (FREE)');
    console.log('   Cost: $0/month');
    console.log('   Setup:');
    console.log('   • Buy domain ($10/year) or use free subdomain service');
    console.log('   • Setup Cloudflare Zero Trust Tunnel');
    console.log('   • Get permanent URL like webhook.yourdomain.com');
    console.log('   Pros: Free, hides VM IP, DDoS protection');
    console.log('   Cons: Needs domain, slightly complex setup');
    
    console.log('\n3️⃣ OPTION 3: ngrok Personal Plan ($8/month)');
    console.log('   Cost: $8/month');
    console.log('   Features:');
    console.log('   • 1 fixed domain (yourname.ngrok.app)');
    console.log('   • No session timeouts');
    console.log('   • 3 tunnels simultaneously');
    console.log('   Pros: Easy setup, fixed URL');
    console.log('   Cons: Monthly cost, still using third-party service');
    
    console.log('\n4️⃣ OPTION 4: Your own subdomain + SSL ($10/year)');
    console.log('   Cost: ~$10/year (domain only)');
    console.log('   Setup:');
    console.log('   • Buy domain from Namecheap/GoDaddy');
    console.log('   • Point to VM IP');
    console.log('   • Use Let\'s Encrypt for free SSL');
    console.log('   Pros: Professional, full control');
    console.log('   Cons: Need to manage DNS');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MY RECOMMENDATION FOR PRODUCTION:');
    console.log('='.repeat(60));
    
    console.log('\nUSE OPTION 1 - Direct HTTPS with Let\'s Encrypt because:');
    console.log('✅ Completely FREE');
    console.log('✅ Takes 10 minutes to setup');
    console.log('✅ 100% reliable (no third-party dependencies)');
    console.log('✅ Meta/WhatsApp accepts IP-based webhooks with valid SSL');
    console.log('✅ Your VM already has a static IP');
    
    console.log('\n📝 QUICK SETUP COMMANDS FOR OPTION 1:');
    console.log('```bash');
    console.log('# SSH into VM');
    console.log(`ssh root@${activeVM || '139.59.51.237'}`);
    console.log('');
    console.log('# Install Nginx & Certbot');
    console.log('apt update && apt install -y nginx certbot python3-certbot-nginx');
    console.log('');
    console.log('# Configure Nginx');
    console.log('cat > /etc/nginx/sites-available/webhook << EOF');
    console.log('server {');
    console.log('    listen 80;');
    console.log(`    server_name ${activeVM || '139.59.51.237'};`);
    console.log('    ');
    console.log('    location /webhook {');
    console.log('        proxy_pass http://localhost:3000/webhook;');
    console.log('        proxy_set_header Host \\$host;');
    console.log('        proxy_set_header X-Real-IP \\$remote_addr;');
    console.log('    }');
    console.log('}');
    console.log('EOF');
    console.log('');
    console.log('# Enable site');
    console.log('ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/');
    console.log('nginx -t && systemctl restart nginx');
    console.log('');
    console.log('# Get SSL certificate');
    console.log(`certbot --nginx -d ${activeVM || '139.59.51.237'} --register-unsafely-without-email --agree-tos`);
    console.log('```');
    
    console.log('\n🔗 Then update Meta webhook to:');
    console.log(`https://${activeVM || '139.59.51.237'}/webhook`);
    
    console.log('\n⏰ This is a PERMANENT solution - no URL changes ever!');
}

checkVMAndFindPermanentSolution().catch(console.error);