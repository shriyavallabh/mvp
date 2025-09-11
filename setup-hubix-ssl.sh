#!/bin/bash

echo "🚀 SETTING UP SSL FOR hubix.duckdns.org"
echo "======================================="
echo ""
echo "SSH into your VM (134.209.154.123) and run these commands:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'COMMANDS'
# 1. Install required packages
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Stop any services on port 80/443
sudo systemctl stop nginx
pm2 stop all

# 3. Get SSL certificate from Let's Encrypt
sudo certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org

# 4. Create Nginx configuration
sudo tee /etc/nginx/sites-available/webhook > /dev/null << 'EOF'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name hubix.duckdns.org;
    return 301 https://$server_name$request_uri;
}
EOF

# 5. Enable the site
sudo ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 7. Start your webhook on port 3000
cd /home/mvp/webhook
pm2 start webhook-for-vm.js --name webhook
pm2 save

# 8. Open firewall ports
sudo ufw allow 'Nginx Full'
sudo ufw reload

# 9. Test the webhook
echo ""
echo "Testing webhook..."
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 YOUR WEBHOOK URL:"
echo "   https://hubix.duckdns.org/webhook"
echo ""
echo "🔑 VERIFY TOKEN:"
echo "   jarvish_webhook_2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
COMMANDS