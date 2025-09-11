#!/bin/bash

echo "⚡ QUICK SSL SETUP - ONE COMMAND"
echo "================================"
echo ""
echo "1. First, register at https://www.duckdns.org"
echo "   - Sign in with Google"
echo "   - Create subdomain (e.g., 'finadvise')"
echo "   - Set IP to: 134.209.154.123"
echo ""
echo "2. Then run this on your VM:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'QUICKCMD'
# Replace YOURDOMAIN with your actual domain
DOMAIN="YOURDOMAIN.duckdns.org"

# One command to set up everything
sudo apt update && \
sudo apt install -y nginx certbot python3-certbot-nginx && \
sudo systemctl stop nginx && \
sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email test@test.com && \
sudo bash -c "cat > /etc/nginx/sites-available/webhook << 'EOF'
server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
    }
}
EOF" && \
sudo ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/ && \
sudo rm -f /etc/nginx/sites-enabled/default && \
sudo systemctl restart nginx && \
cd /home/mvp/webhook && \
pm2 restart webhook-for-vm --name webhook && \
echo "✅ DONE! Your URL: https://$DOMAIN/webhook"
QUICKCMD

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 After running, your webhook will be:"
echo "   https://YOURDOMAIN.duckdns.org/webhook"
echo ""
echo "🔑 Verify Token: jarvish_webhook_2024"