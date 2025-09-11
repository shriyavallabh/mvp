#!/bin/bash

echo "🔍 DEBUGGING WEBHOOK FOR hubix.duckdns.org"
echo "=========================================="
echo ""

echo "Run these tests:"
echo ""

echo "1️⃣ TEST FROM YOUR LOCAL MACHINE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Test if domain resolves:"
echo "nslookup hubix.duckdns.org"
echo ""
echo "# Test HTTP:"
echo "curl -v http://hubix.duckdns.org/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123"
echo ""
echo "# Test HTTPS:"
echo "curl -v https://hubix.duckdns.org/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123"
echo ""

echo "2️⃣ ON YOUR VM - CHECK SERVICES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'VMCHECK'
# SSH into VM
ssh root@134.209.154.123

# Check if webhook is running
pm2 status

# Check if Nginx is running
sudo systemctl status nginx

# Check what's listening on ports
sudo netstat -tlnp | grep -E ':80|:443|:3000'

# Check Nginx error logs
sudo tail -n 20 /var/log/nginx/error.log

# Test webhook locally
curl http://localhost:3000/webhook?hub.mode=subscribe\&hub.verify_token=jarvish_webhook_2024\&hub.challenge=test123

# Check if SSL certificate exists
sudo ls -la /etc/letsencrypt/live/hubix.duckdns.org/

# Test Nginx config
sudo nginx -t
VMCHECK

echo ""
echo "3️⃣ QUICK FIX - RESTART EVERYTHING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'QUICKFIX'
# On your VM:
cd /home/mvp/webhook

# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Start webhook first
pm2 start webhook-for-vm.js --name webhook
pm2 logs webhook --lines 10

# Make sure it's running on port 3000
curl http://localhost:3000/health

# Start Nginx
sudo systemctl start nginx
sudo systemctl status nginx

# Test from outside
curl https://hubix.duckdns.org/health
QUICKFIX

echo ""
echo "4️⃣ IF SSL CERTIFICATE IS MISSING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'SSLFIX'
# Get new certificate
sudo systemctl stop nginx
sudo certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email test@test.com
sudo systemctl start nginx
SSLFIX