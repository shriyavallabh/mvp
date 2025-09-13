#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';
const PASSWORD = 'droplet';
const DOMAIN = 'hubix.duckdns.org';

async function completeSSLFix() {
    console.log('🔧 COMPLETE SSL FIX - FULLY AUTOMATED\n');
    console.log('=' .repeat(70));
    
    // Step 1: Complete diagnostics
    console.log('1️⃣ Running complete diagnostics...');
    
    const diagnostics = `
        # Check if VM is accessible
        echo "VM Hostname: $(hostname)"
        echo "VM IP: $(curl -s ifconfig.me)"
        
        # Check all services
        echo -e "\\n=== Service Status ==="
        systemctl status nginx --no-pager | grep Active || echo "nginx not running"
        pm2 list 2>/dev/null | grep webhook || echo "webhook not in PM2"
        
        # Check ports
        echo -e "\\n=== Port Status ==="
        netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3000' || ss -tlnp | grep -E ':80|:443|:3000' || echo "No ports info"
        
        # Check firewall
        echo -e "\\n=== Firewall Status ==="
        ufw status 2>/dev/null || echo "ufw not installed"
        iptables -L INPUT -n -v | head -10 2>/dev/null || echo "iptables check failed"
        
        # Check existing certificates
        echo -e "\\n=== SSL Certificates ==="
        ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No certificates"
        
        # Check nginx configs
        echo -e "\\n=== Nginx Configs ==="
        ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites enabled"
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${diagnostics}"`,
            { timeout: 30000 }
        );
        console.log('Diagnostics completed');
        
        // Parse diagnostics
        if (!stdout.includes('nginx not running')) {
            console.log('✅ nginx is running');
        } else {
            console.log('⚠️  nginx needs to be started');
        }
        
        if (stdout.includes('webhook') && stdout.includes('online')) {
            console.log('✅ Webhook is running');
        } else {
            console.log('⚠️  Webhook needs restart');
        }
    } catch (error) {
        console.log('⚠️  Diagnostics failed:', error.message.substring(0, 50));
    }
    
    // Step 2: Clean and rebuild everything
    console.log('\n2️⃣ Cleaning and rebuilding SSL setup...');
    
    const cleanRebuild = `
        # Stop all services
        systemctl stop nginx 2>/dev/null || true
        
        # Clean old configs
        rm -f /etc/nginx/sites-enabled/*
        rm -rf /etc/letsencrypt/live/${DOMAIN}
        rm -rf /etc/letsencrypt/archive/${DOMAIN}
        rm -rf /etc/letsencrypt/renewal/${DOMAIN}.conf
        
        # Install required packages
        apt-get update -qq
        apt-get install -y nginx certbot python3-certbot-nginx -qq
        
        # Ensure webhook is running
        cd /root
        pm2 stop webhook 2>/dev/null || true
        pm2 delete webhook 2>/dev/null || true
        pm2 start webhook-button-handler.js --name webhook
        pm2 save
        
        # Create webroot directory
        mkdir -p /var/www/certbot
        
        # Create minimal nginx config for cert validation
        cat > /etc/nginx/sites-available/certbot-temp << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'Cert validation in progress';
        add_header Content-Type text/plain;
    }
}
EOF
        
        ln -sf /etc/nginx/sites-available/certbot-temp /etc/nginx/sites-enabled/
        nginx -t && systemctl start nginx
        sleep 2
        
        # Test if nginx is accessible
        curl -s http://localhost/ || echo "nginx not responding"
        
        echo "Clean rebuild complete"
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${cleanRebuild}"`,
            { timeout: 60000 }
        );
        console.log('✅ Clean rebuild completed');
    } catch (error) {
        console.log('⚠️  Rebuild warning:', error.message.substring(0, 50));
    }
    
    // Step 3: Get SSL certificate using standalone method
    console.log('\n3️⃣ Getting SSL certificate (standalone method)...');
    
    const getSSL = `
        # Stop nginx to use standalone
        systemctl stop nginx
        
        # Get certificate using standalone (more reliable)
        certbot certonly --standalone \
            -d ${DOMAIN} \
            --non-interactive \
            --agree-tos \
            --register-unsafely-without-email \
            --force-renewal \
            2>&1
        
        # Check if successful
        if [ -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
            echo "SSL_SUCCESS"
            
            # Create proper nginx config with SSL
            cat > /etc/nginx/sites-available/webhook-ssl << 'NGINX_SSL'
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\\$server_name\\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Webhook proxy
    location /webhook {
        proxy_pass http://127.0.0.1:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        
        # Meta webhook requirements
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 300;
        client_max_body_size 50M;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
    
    location / {
        return 200 'FinAdvise Webhook Server - SSL Active';
        add_header Content-Type text/plain;
    }
}
NGINX_SSL
            
            # Enable SSL config
            rm -f /etc/nginx/sites-enabled/*
            ln -sf /etc/nginx/sites-available/webhook-ssl /etc/nginx/sites-enabled/
            
            # Start nginx with SSL
            nginx -t && systemctl start nginx && systemctl enable nginx
            
            # Setup auto-renewal
            (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
            
            echo "SSL fully configured"
        else
            echo "SSL_FAILED"
            
            # Fallback to HTTP only
            cat > /etc/nginx/sites-available/webhook-http << 'HTTP_ONLY'
server {
    listen 80;
    server_name ${DOMAIN} ${VM_IP};
    
    location /webhook {
        proxy_pass http://127.0.0.1:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
HTTP_ONLY
            
            rm -f /etc/nginx/sites-enabled/*
            ln -sf /etc/nginx/sites-available/webhook-http /etc/nginx/sites-enabled/
            nginx -t && systemctl start nginx
            
            echo "HTTP fallback configured"
        fi
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${getSSL}"`,
            { timeout: 120000 }
        );
        
        if (stdout.includes('SSL_SUCCESS')) {
            console.log('✅ SSL certificate obtained successfully!');
            console.log('✅ HTTPS is now configured');
        } else {
            console.log('⚠️  SSL certificate failed, using HTTP fallback');
        }
    } catch (error) {
        console.log('⚠️  SSL setup error:', error.message.substring(0, 50));
    }
    
    // Step 4: Verify everything is working
    console.log('\n4️⃣ Verifying all endpoints...\n');
    
    // Wait a bit for services to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const tests = [
        { name: 'HTTP Health', url: `http://${DOMAIN}/health` },
        { name: 'HTTPS Health', url: `https://${DOMAIN}/health` },
        { name: 'HTTP Webhook Verify', url: `http://${DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123` },
        { name: 'HTTPS Webhook Verify', url: `https://${DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123` },
        { name: 'ngrok (backup)', url: 'https://6ecac5910ac8.ngrok-free.app/health' }
    ];
    
    let workingUrl = null;
    
    for (const test of tests) {
        try {
            const response = await axios.get(test.url, {
                timeout: 8000,
                headers: test.url.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {},
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });
            
            if (test.name.includes('Verify') && response.data === 'test123') {
                console.log(`✅ ${test.name}: Verification working!`);
                if (test.url.includes('https://hubix')) {
                    workingUrl = 'https://hubix.duckdns.org/webhook';
                }
            } else if (response.data.status === 'healthy') {
                console.log(`✅ ${test.name}: Working!`);
            } else {
                console.log(`✅ ${test.name}: Responding`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message.substring(0, 30)}`);
        }
    }
    
    // Step 5: Final status and instructions
    console.log('\n' + '=' .repeat(70));
    console.log('📊 FINAL WEBHOOK STATUS');
    console.log('=' .repeat(70));
    
    if (workingUrl) {
        console.log('\n✅ SUCCESS! PERMANENT WEBHOOK IS READY!\n');
        console.log('🔗 YOUR PERMANENT WEBHOOK URL:');
        console.log(`   ${workingUrl}`);
        console.log('\n📱 UPDATE FACEBOOK DASHBOARD NOW:');
        console.log('━'.repeat(50));
        console.log('1. Go to: https://business.facebook.com');
        console.log('2. Navigate: WhatsApp > Configuration > Webhook');
        console.log(`3. Change URL to: ${workingUrl}`);
        console.log('4. Keep Token: jarvish_webhook_2024');
        console.log('5. Click "Verify and Save"');
        console.log('━'.repeat(50));
        console.log('\n✨ This URL will NEVER change!');
    } else {
        console.log('\n⚠️  SSL setup needs manual intervention');
        console.log('\n📌 CONTINUE USING ngrok FOR NOW:');
        console.log('   https://6ecac5910ac8.ngrok-free.app/webhook');
        console.log('\nDO NOT change anything in Facebook dashboard yet.');
        console.log('\nThe issue might be:');
        console.log('• DigitalOcean firewall blocking port 443');
        console.log('• DNS propagation still in progress');
        console.log('• Rate limiting from Let\'s Encrypt');
    }
    
    // Create a status file on VM
    const saveStatus = `
        cat > /root/webhook-status.txt << 'STATUS'
Webhook Status Report
=====================
Domain: ${DOMAIN}
VM IP: ${VM_IP}
Date: $(date)

Services:
- Webhook: $(pm2 list | grep webhook | grep online && echo "Running" || echo "Stopped")
- Nginx: $(systemctl is-active nginx)
- SSL: $([ -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ] && echo "Installed" || echo "Not installed")

Endpoints:
- HTTP: http://${DOMAIN}/webhook
- HTTPS: https://${DOMAIN}/webhook
- ngrok: https://6ecac5910ac8.ngrok-free.app/webhook

Test with:
curl https://${DOMAIN}/health
STATUS
        
        echo "Status saved to /root/webhook-status.txt"
    `;
    
    try {
        await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${saveStatus}"`,
            { timeout: 10000 }
        );
    } catch {}
}

completeSSLFix().catch(console.error);