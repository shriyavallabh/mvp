#!/bin/bash

echo "🔧 CLEAN VM SETUP - FIXING NODE.JS CONFLICT"
echo "==========================================="
echo ""

export SSHPASS='Story32Webhook2024!'
VM_IP="159.89.166.94"

# First fix Node.js
sshpass -e ssh -o StrictHostKeyChecking=no root@$VM_IP << 'FIX'

echo "1. Removing old Node.js..."
apt-get remove -y nodejs libnode-dev
apt-get autoremove -y
apt-get purge -y nodejs

echo "2. Installing Node.js 18 properly..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo "3. Verifying installation..."
node --version
npm --version

echo "4. Fixing nginx SSL issue..."
# Remove SSL config
cat > /etc/nginx/nginx.conf << 'NGINX'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    gzip on;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINX

systemctl restart nginx

echo "5. Checking webhook..."
pm2 list
pm2 logs story-3.2 --lines 5 --nostream

echo "6. Testing locally..."
curl -s "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=WORKING"

FIX

echo ""
echo "Testing from outside..."
curl -s "http://$VM_IP/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS"