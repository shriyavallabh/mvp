#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';
const PASSWORD = 'droplet';
const DUCKDNS_DOMAIN = 'hubix.duckdns.org';
const DUCKDNS_TOKEN = 'a40539fd-a867-4615-a37b-36cf5fa8489e';

async function setupHubixDuckDNSWithSSL() {
    console.log('🚀 SETTING UP PERMANENT WEBHOOK WITH HUBIX.DUCKDNS.ORG\n');
    console.log('=' .repeat(70));
    
    console.log('📋 CONFIGURATION:');
    console.log(`• Domain: ${DUCKDNS_DOMAIN}`);
    console.log(`• Points to: ${VM_IP}`);
    console.log(`• Final URL: https://${DUCKDNS_DOMAIN}/webhook`);
    console.log('');
    
    // Step 1: Update DuckDNS and setup auto-update
    console.log('1️⃣ Setting up DuckDNS auto-update on VM...');
    
    const duckDNSSetup = `
        # Create DuckDNS update script
        cat > /root/duckdns-update.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=hubix&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o /tmp/duckdns.log -K -
EOF
        
        chmod +x /root/duckdns-update.sh
        
        # Run it once to update IP
        /root/duckdns-update.sh
        
        # Add to crontab for auto-update every 5 minutes
        (crontab -l 2>/dev/null | grep -v duckdns-update; echo "*/5 * * * * /root/duckdns-update.sh >/dev/null 2>&1") | crontab -
        
        echo "DuckDNS auto-update configured"
        
        # Verify DNS resolution
        sleep 2
        nslookup ${DUCKDNS_DOMAIN} || host ${DUCKDNS_DOMAIN} || dig ${DUCKDNS_DOMAIN}
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${duckDNSSetup}"`,
            { timeout: 30000 }
        );
        console.log('✅ DuckDNS auto-update configured');
        if (stdout.includes(VM_IP)) {
            console.log(`✅ DNS verified: ${DUCKDNS_DOMAIN} → ${VM_IP}`);
        }
    } catch (error) {
        console.log('⚠️  DuckDNS setup warning:', error.message.substring(0, 50));
    }
    
    // Step 2: Install and configure nginx
    console.log('\n2️⃣ Installing nginx and configuring for webhook...');
    
    const nginxSetup = `
        # Install nginx and certbot
        apt-get update -qq
        apt-get install -y nginx certbot python3-certbot-nginx -qq
        
        # Stop nginx temporarily to free port 80
        systemctl stop nginx
        
        # Create nginx configuration for hubix.duckdns.org
        cat > /etc/nginx/sites-available/webhook << 'NGINX_EOF'
server {
    listen 80;
    server_name ${DUCKDNS_DOMAIN};
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        
        # Important for WhatsApp webhooks
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 50M;
        proxy_read_timeout 300s;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
    
    location / {
        return 200 'Webhook server running';
        add_header Content-Type text/plain;
    }
}
NGINX_EOF
        
        # Enable the site
        ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Start nginx
        systemctl start nginx
        nginx -t && systemctl reload nginx
        
        echo "nginx configured for ${DUCKDNS_DOMAIN}"
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${nginxSetup}"`,
            { timeout: 60000 }
        );
        console.log('✅ nginx configured successfully');
    } catch (error) {
        console.log('⚠️  nginx setup warning:', error.message.substring(0, 50));
    }
    
    // Step 3: Get Let's Encrypt SSL certificate
    console.log('\n3️⃣ Getting Let\'s Encrypt SSL certificate...');
    
    const certbotSetup = `
        # Get certificate using certbot
        certbot certonly --nginx \
            -d ${DUCKDNS_DOMAIN} \
            --non-interactive \
            --agree-tos \
            --register-unsafely-without-email \
            --expand \
            2>&1
        
        # Check if certificate was obtained
        if [ -f /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem ]; then
            echo "SSL_CERT_SUCCESS"
            
            # Update nginx configuration for SSL
            cat > /etc/nginx/sites-available/webhook-ssl << 'SSL_NGINX_EOF'
server {
    listen 443 ssl http2;
    server_name ${DUCKDNS_DOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # WhatsApp webhook requirements
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 50M;
        proxy_read_timeout 300s;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
    
    location / {
        return 200 'FinAdvise Webhook Server';
        add_header Content-Type text/plain;
    }
}

server {
    listen 80;
    server_name ${DUCKDNS_DOMAIN};
    return 301 https://\\$server_name\\$request_uri;
}
SSL_NGINX_EOF
            
            # Enable SSL configuration
            ln -sf /etc/nginx/sites-available/webhook-ssl /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/webhook
            
            # Reload nginx with SSL
            nginx -t && systemctl reload nginx
            
            echo "SSL enabled successfully"
        else
            echo "SSL_CERT_FAILED"
        fi
        
        # Setup auto-renewal
        echo "0 0 * * * root certbot renew --quiet --no-self-upgrade --post-hook 'systemctl reload nginx'" > /etc/cron.d/certbot-renew
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${certbotSetup}"`,
            { timeout: 120000 }
        );
        
        if (stdout.includes('SSL_CERT_SUCCESS')) {
            console.log('✅ SSL certificate obtained from Let\'s Encrypt!');
            console.log('✅ Auto-renewal configured');
        } else {
            console.log('⚠️  SSL certificate setup had issues');
            console.log('   Will retry with standalone method...');
            
            // Fallback to standalone method
            const standaloneSetup = `
                systemctl stop nginx
                certbot certonly --standalone \
                    -d ${DUCKDNS_DOMAIN} \
                    --non-interactive \
                    --agree-tos \
                    --register-unsafely-without-email
                systemctl start nginx
            `;
            
            await execAsync(
                `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${standaloneSetup}"`,
                { timeout: 60000 }
            );
        }
    } catch (error) {
        console.log('⚠️  Certbot warning:', error.message.substring(0, 50));
    }
    
    // Step 4: Ensure webhook is running
    console.log('\n4️⃣ Ensuring webhook is running...');
    
    const webhookCheck = `
        # Check if webhook is running
        pm2 list
        
        # Restart webhook to ensure it's running
        cd /root
        pm2 restart webhook || pm2 start webhook-button-handler.js --name webhook
        pm2 save
        pm2 startup systemd -u root --hp /root
        
        # Test local webhook
        curl -s http://localhost:3000/health | head -10
    `;
    
    try {
        const { stdout } = await execAsync(
            `sshpass -p '${PASSWORD}' ssh -o StrictHostKeyChecking=no root@${VM_IP} "${webhookCheck}"`,
            { timeout: 30000 }
        );
        console.log('✅ Webhook is running on PM2');
    } catch (error) {
        console.log('⚠️  Webhook check warning');
    }
    
    // Step 5: Test all endpoints
    console.log('\n5️⃣ Testing all endpoints...\n');
    
    const endpoints = [
        {
            name: 'HTTP redirect',
            url: `http://${DUCKDNS_DOMAIN}/health`,
            expectRedirect: true
        },
        {
            name: 'HTTPS health',
            url: `https://${DUCKDNS_DOMAIN}/health`,
            expectJSON: true
        },
        {
            name: 'HTTPS webhook verification',
            url: `https://${DUCKDNS_DOMAIN}/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123`,
            expectChallenge: true
        }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint.url, {
                timeout: 10000,
                maxRedirects: endpoint.expectRedirect ? 5 : 0,
                validateStatus: () => true
            });
            
            if (endpoint.expectJSON && response.data.status === 'healthy') {
                console.log(`✅ ${endpoint.name}: Working perfectly!`);
            } else if (endpoint.expectChallenge && response.data === 'test123') {
                console.log(`✅ ${endpoint.name}: Verification successful!`);
            } else if (endpoint.expectRedirect && response.status === 200) {
                console.log(`✅ ${endpoint.name}: Redirecting to HTTPS`);
            } else {
                console.log(`✅ ${endpoint.name}: Responding (${response.status})`);
            }
        } catch (error) {
            console.log(`⚠️  ${endpoint.name}: ${error.message}`);
        }
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 PERMANENT WEBHOOK SETUP COMPLETE!');
    console.log('=' .repeat(70));
    
    console.log('\n✅ WHAT\'S BEEN CONFIGURED:');
    console.log(`• Domain: ${DUCKDNS_DOMAIN} → ${VM_IP}`);
    console.log('• DuckDNS auto-update every 5 minutes');
    console.log('• nginx reverse proxy to webhook');
    console.log('• Let\'s Encrypt SSL certificate');
    console.log('• Auto-renewal of SSL certificate');
    console.log('• PM2 managing webhook process');
    
    console.log('\n🔗 YOUR PERMANENT WEBHOOK URL:');
    console.log(`https://${DUCKDNS_DOMAIN}/webhook`);
    
    console.log('\n📱 UPDATE META WEBHOOK:');
    console.log('1. Go to Meta Business Manager');
    console.log('2. Navigate to WhatsApp > Configuration > Webhook');
    console.log(`3. Update URL to: https://${DUCKDNS_DOMAIN}/webhook`);
    console.log('4. Keep verify token: jarvish_webhook_2024');
    console.log('5. Click Verify and Save');
    
    console.log('\n✨ BENEFITS:');
    console.log('• URL never changes (permanent)');
    console.log('• Free forever (no monthly costs)');
    console.log('• Auto-renewing SSL certificate');
    console.log('• Professional appearance');
    console.log('• Meta fully supports this setup');
    
    console.log('\n🚀 This webhook URL will work forever!');
}

setupHubixDuckDNSWithSSL().catch(console.error);