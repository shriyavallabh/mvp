#!/bin/bash

# WEBHOOK DEPLOYMENT WITH PASSWORD
# =================================
# Use the password from your email to deploy

set -e

echo "🚀 WEBHOOK DEPLOYMENT SCRIPT"
echo "============================"
echo ""
echo "📧 Check your email for the root password"
echo "   Subject: 'DigitalOcean Droplet Password Reset'"
echo ""
read -p "Enter the root password from email: " -s ROOT_PASSWORD
echo ""
echo ""

VM_IP="139.59.51.237"

# Create deployment script
cat > /tmp/deploy-webhook.sh << 'DEPLOY'
#!/bin/bash
set -e

echo "Installing dependencies..."
apt-get update > /dev/null 2>&1
apt-get install -y nodejs npm nginx certbot python3-certbot-nginx > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo "Creating webhook..."
mkdir -p /home/webhook
cd /home/webhook

cat > webhook.js << 'EOF'
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

// CRITICAL: Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Verification: mode=${mode}, token=${token}, challenge=${challenge}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log(`Message from ${message.from}: ${message.type}`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                console.log(`Button clicked: ${buttonId}`);
                
                // Send response based on button
                if (buttonId === 'UNLOCK_IMAGES') {
                    await sendMessage(message.from, '📸 Here are your images for today!');
                } else if (buttonId === 'UNLOCK_CONTENT') {
                    await sendMessage(message.from, '📝 Here is your content for today!');
                } else if (buttonId === 'UNLOCK_UPDATES') {
                    await sendMessage(message.from, '📊 Here are your market updates!');
                }
            } else if (message.type === 'text') {
                console.log(`Text: ${message.text.body}`);
                await sendMessage(message.from, 'Thank you for your message. I will respond shortly.');
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

async function sendMessage(to, text) {
    try {
        const response = await axios.post(
            \`https://graph.facebook.com/v23.0/\${CONFIG.phoneNumberId}/messages\`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': \`Bearer \${CONFIG.accessToken}\`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Message sent to', to);
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        status: 'Webhook Active',
        endpoints: ['/webhook', '/health']
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(\`✅ Webhook running on port \${CONFIG.port}\`);
});
EOF

echo "Installing packages..."
npm init -y > /dev/null 2>&1
npm install express axios > /dev/null 2>&1

echo "Stopping existing services..."
pm2 stop all > /dev/null 2>&1 || true
pm2 delete all > /dev/null 2>&1 || true
systemctl stop nginx > /dev/null 2>&1 || true

echo "Setting up SSL..."
certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org \
  --force-renewal > /dev/null 2>&1 || echo "SSL exists"

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/webhook << 'NGINX'
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
NGINX

ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx

echo "Starting webhook..."
pm2 start webhook.js --name webhook
pm2 save
pm2 startup systemd -u root --hp /root | grep sudo | bash > /dev/null 2>&1 || true

echo ""
echo "Testing webhook..."
sleep 3
curl -s "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
echo ""
echo ""
echo "✅ WEBHOOK DEPLOYED!"
pm2 status
DEPLOY

echo "📤 Deploying to VM..."
echo ""

# Use sshpass to automate password entry
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass 2>/dev/null || echo "Please install sshpass manually"
    else
        sudo apt-get install -y sshpass 2>/dev/null || echo "Please install sshpass"
    fi
fi

# Deploy using password
if command -v sshpass &> /dev/null; then
    sshpass -p "$ROOT_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/deploy-webhook.sh root@$VM_IP:/tmp/
    sshpass -p "$ROOT_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VM_IP "bash /tmp/deploy-webhook.sh"
else
    # Fallback to manual password entry
    echo "Please enter the password when prompted:"
    scp -o StrictHostKeyChecking=no /tmp/deploy-webhook.sh root@$VM_IP:/tmp/
    ssh -o StrictHostKeyChecking=no root@$VM_IP "bash /tmp/deploy-webhook.sh"
fi

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🔗 Webhook URL: https://hubix.duckdns.org/webhook"
echo "🔑 Verify Token: jarvish_webhook_2024"
echo ""
echo "📱 Configure in Meta Business Manager:"
echo "   1. Go to WhatsApp > Configuration > Webhooks"
echo "   2. Enter URL: https://hubix.duckdns.org/webhook"
echo "   3. Enter Token: jarvish_webhook_2024"
echo "   4. Click 'Verify and Save'"
echo ""
echo "🧪 Test the webhook:"
echo "   curl https://hubix.duckdns.org/health"