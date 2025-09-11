#!/bin/bash

echo "🦆 SETTING UP FREE DUCKDNS DOMAIN"
echo "=================================="
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Register Domain (2 minutes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: https://www.duckdns.org"
echo "2. Sign in with Google/GitHub/Twitter"
echo "3. Choose a subdomain (e.g., 'finadvise' or 'jarvishadvisor')"
echo "   Your domain will be: yourname.duckdns.org"
echo "4. Enter your VM IP: 134.209.154.123"
echo "5. Click 'add domain'"
echo "6. Copy your token (shown at top of page)"
echo ""

read -p "Enter your DuckDNS domain (e.g., finadvise.duckdns.org): " DOMAIN
read -p "Enter your DuckDNS token: " TOKEN
read -p "Enter your VM IP: " VM_IP

if [ -z "$DOMAIN" ] || [ -z "$TOKEN" ] || [ -z "$VM_IP" ]; then
    echo "❌ Missing information"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Auto-setup SSL on VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create setup script
cat > vm-ssl-setup.sh << EOSCRIPT
#!/bin/bash

echo "🔧 Setting up SSL for $DOMAIN"

# Update DuckDNS
echo "Updating DuckDNS..."
curl "https://www.duckdns.org/update?domains=${DOMAIN%.duckdns.org}&token=$TOKEN&ip=$VM_IP"

# Install required packages
echo "Installing Nginx and Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Stop services on ports 80/443
sudo systemctl stop nginx
pm2 stop all

# Get Let's Encrypt certificate
echo "Getting SSL certificate..."
sudo certbot certonly --standalone -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  --email admin@example.com \
  --preferred-challenges http

# Create Nginx configuration
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/webhook > /dev/null << 'NGINX'
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
        proxy_read_timeout 90;
    }
}

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
NGINX

# Fix the Nginx config with actual domain
sudo sed -i "s/\$DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/webhook

# Enable site
sudo ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl restart nginx

# Start webhook on port 3000
cd /home/mvp/webhook
pm2 start webhook-for-vm.js --name webhook
pm2 save
pm2 startup

# Open firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 443
sudo ufw allow 80
sudo ufw reload

echo ""
echo "✅ SSL SETUP COMPLETE!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 YOUR WEBHOOK URL:"
echo "   https://$DOMAIN/webhook"
echo ""
echo "🔑 VERIFY TOKEN:"
echo "   jarvish_webhook_2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test the webhook
echo ""
echo "Testing webhook..."
curl -s "https://$DOMAIN/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
EOSCRIPT

echo "Copying setup script to VM..."
scp vm-ssl-setup.sh root@$VM_IP:/tmp/

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Run setup on VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SSH into your VM and run:"
echo ""
echo "ssh root@$VM_IP"
echo "bash /tmp/vm-ssl-setup.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 YOUR FINAL WEBHOOK URL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Callback URL: https://$DOMAIN/webhook"
echo "Verify Token: jarvish_webhook_2024"
echo ""
echo "This URL is permanent and will work with Meta!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"