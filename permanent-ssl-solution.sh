#!/bin/bash

echo "🔥 PERMANENT SSL SOLUTION - NO TUNNELS!"
echo "======================================="
echo ""
echo "Using your Digital Ocean VM with a FREE domain + SSL"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Get a FREE .tk domain (5 minutes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://www.freenom.com"
echo "2. Search for: finadvise (or any name)"
echo "3. Get free domain: finadvise.tk (or .ml, .ga, .cf)"
echo "4. Register for FREE (12 months)"
echo "5. Point it to your VM IP: 134.209.154.123"
echo ""
echo "OR use DuckDNS (easier):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to: https://www.duckdns.org"
echo "2. Sign in with Google/GitHub"
echo "3. Create subdomain: finadvise"
echo "4. You get: finadvise.duckdns.org"
echo "5. Point to your VM IP"
echo ""
read -p "Enter your domain (e.g., finadvise.duckdns.org): " DOMAIN

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Install SSL on your VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SSH into your VM and run:"
echo ""
cat << SSLSETUP
# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Stop any service on port 80
sudo systemctl stop nginx
pm2 stop all

# Get SSL certificate from Let's Encrypt (FREE)
sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Configure Nginx as reverse proxy
sudo cat > /etc/nginx/sites-available/webhook << 'EOF'
server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start your webhook on port 3000
cd /home/mvp/webhook
pm2 start webhook-for-vm.js --name webhook
pm2 save
pm2 startup

# Open firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 443
sudo ufw allow 80
sudo ufw reload

echo "✅ SSL SETUP COMPLETE!"
echo ""
echo "Your webhook URL: https://$DOMAIN/webhook"
SSLSETUP

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 YOUR PERMANENT WEBHOOK URL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Callback URL: https://$DOMAIN/webhook"
echo "Verify Token: jarvish_webhook_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Benefits:"
echo "- Permanent URL (won't change)"
echo "- Valid SSL certificate (Meta will accept)"
echo "- No tunnels needed"
echo "- Runs 24/7 on your VM"
echo "- Professional setup"