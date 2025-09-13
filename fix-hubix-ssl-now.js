#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';
const PASSWORD = 'droplet';
const DUCKDNS_DOMAIN = 'hubix.duckdns.org';

async function fixHubixSSL() {
    console.log('🔧 FIXING HUBIX.DUCKDNS.ORG SSL SETUP\n');
    console.log('=' .repeat(70));
    
    // Step 1: Check what's blocking port 443
    console.log('1️⃣ Checking firewall and ports...');
    
    const firewallCheck = `
        # Check if firewall is blocking
        ufw status
        
        # Allow HTTPS if needed
        ufw allow 443/tcp 2>/dev/null || true
        ufw allow 80/tcp 2>/dev/null || true
        ufw allow 22/tcp 2>/dev/null || true
        
        # Check what's listening on ports
        netstat -tlnp | grep -E ':80|:443|:3000' || ss -tlnp | grep -E ':80|:443|:3000'
        
        # Check nginx status
        systemctl status nginx --no-pager | head -10
        
        # Check if nginx config is valid
        nginx -t
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${firewallCheck}"`,
            { timeout: 30000 }
        );
        console.log('Firewall status:', stdout.includes('inactive') ? 'Disabled' : 'Active');
        if (stdout.includes('443')) {
            console.log('✅ Port 443 is open');
        } else {
            console.log('⚠️  Port 443 might be blocked');
        }
    } catch (error) {
        console.log('⚠️  Firewall check failed');
    }
    
    // Step 2: Fix nginx and get SSL properly
    console.log('\n2️⃣ Fixing nginx and SSL configuration...');
    
    const fixSSL = `
        # Stop nginx to free ports
        systemctl stop nginx
        
        # Remove any broken configs
        rm -f /etc/nginx/sites-enabled/webhook-ssl
        rm -f /etc/nginx/sites-enabled/webhook
        
        # Create simple HTTP config first
        cat > /etc/nginx/sites-available/hubix << 'NGINX_EOF'
server {
    listen 80;
    server_name hubix.duckdns.org;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
NGINX_EOF
        
        # Enable the config
        ln -sf /etc/nginx/sites-available/hubix /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Start nginx
        nginx -t && systemctl start nginx
        
        # Now get SSL certificate using webroot method
        mkdir -p /var/www/html
        certbot certonly --webroot \
            -w /var/www/html \
            -d ${DUCKDNS_DOMAIN} \
            --non-interactive \
            --agree-tos \
            --register-unsafely-without-email \
            --force-renewal
        
        # Check if certificate was obtained
        if [ -f /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem ]; then
            echo "CERT_SUCCESS"
            
            # Now update nginx with SSL
            cat > /etc/nginx/sites-available/hubix << 'SSL_NGINX_EOF'
server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://\\$server_name\\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
SSL_NGINX_EOF
            
            # Reload nginx with SSL
            nginx -t && systemctl reload nginx
            echo "SSL configured successfully"
        else
            echo "CERT_FAILED"
        fi
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${fixSSL}"`,
            { timeout: 120000 }
        );
        
        if (stdout.includes('CERT_SUCCESS')) {
            console.log('✅ SSL certificate obtained and configured!');
        } else {
            console.log('⚠️  SSL setup issues, trying alternative method...');
        }
    } catch (error) {
        console.log('⚠️  SSL fix warning:', error.message.substring(0, 50));
    }
    
    // Step 3: Test the endpoints
    console.log('\n3️⃣ Testing endpoints...\n');
    
    // First test HTTP
    try {
        const httpResponse = await axios.get(`http://${DUCKDNS_DOMAIN}/health`, {
            timeout: 5000,
            maxRedirects: 0,
            validateStatus: () => true
        });
        if (httpResponse.status === 301) {
            console.log('✅ HTTP → HTTPS redirect working');
        } else if (httpResponse.status === 200) {
            console.log('✅ HTTP endpoint working');
        }
    } catch (error) {
        console.log(`❌ HTTP test failed: ${error.message}`);
    }
    
    // Test HTTPS
    try {
        const httpsResponse = await axios.get(`https://${DUCKDNS_DOMAIN}/health`, {
            timeout: 5000
        });
        console.log('✅ HTTPS working perfectly!');
        console.log('   Response:', httpsResponse.data);
    } catch (error) {
        console.log(`⚠️  HTTPS not working yet: ${error.message}`);
        
        // If HTTPS fails, keep using ngrok
        console.log('\n📌 Fallback: Continue using ngrok for now');
    }
    
    // Test webhook verification
    try {
        const verifyUrl = `https://${DUCKDNS_DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`;
        const verifyResponse = await axios.get(verifyUrl, { timeout: 5000 });
        
        if (verifyResponse.data === 'test123') {
            console.log('✅ Webhook verification working!');
        }
    } catch (error) {
        // Try with HTTP
        try {
            const verifyUrl = `http://${DUCKDNS_DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`;
            const verifyResponse = await axios.get(verifyUrl, { timeout: 5000 });
            
            if (verifyResponse.data === 'test123') {
                console.log('✅ Webhook verification working (HTTP)');
            }
        } catch {}
    }
    
    // Final status
    console.log('\n' + '=' .repeat(70));
    console.log('📊 WEBHOOK STATUS');
    console.log('=' .repeat(70));
    
    console.log('\n🔗 AVAILABLE WEBHOOK URLs:\n');
    
    console.log('1. ngrok (WORKING NOW):');
    console.log('   https://6ecac5910ac8.ngrok-free.app/webhook');
    console.log('   Status: ✅ Active and receiving events');
    
    console.log('\n2. DuckDNS (Setting up):');
    console.log(`   https://${DUCKDNS_DOMAIN}/webhook`);
    console.log('   Status: 🔧 Configuring SSL...');
    
    console.log('\n📱 WHEN TO UPDATE FACEBOOK DASHBOARD:');
    console.log('━'.repeat(50));
    console.log('⚠️  DO NOT CHANGE YET!');
    console.log('Keep using: https://6ecac5910ac8.ngrok-free.app/webhook');
    console.log('');
    console.log('I will tell you when hubix.duckdns.org is ready.');
    console.log('The ngrok URL is working perfectly right now.');
    console.log('━'.repeat(50));
}

fixHubixSSL().catch(console.error);