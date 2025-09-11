# 🚨 FINAL SOLUTION - WEBHOOK DEPLOYMENT

## Current Situation:
- **VM ID**: 518093693 (mvp-restored)
- **Direct IP**: 64.227.147.237
- **Floating IP**: 139.59.51.237
- **Domain**: hubix.duckdns.org → 139.59.51.237
- **Password Reset**: Done (check email)

## Two Options Available:

---

## Option 1: Use The Password You Provided
If you have access to a VM with these credentials:
- **IP**: 139.59.46.240
- **Username**: root
- **Password**: 6f5bb5e75ddf1461711393813d

Run this:
```bash
sshpass -p "6f5bb5e75ddf1461711393813d" ssh -o StrictHostKeyChecking=no root@139.59.46.240 'bash -s' << 'DEPLOY'
apt-get update && apt-get install -y nodejs npm nginx certbot
npm install -g pm2
mkdir -p /home/webhook && cd /home/webhook

cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(3000, '0.0.0.0');
EOF

npm init -y && npm install express
pm2 start webhook.js --name webhook
pm2 save
DEPLOY
```

---

## Option 2: Use Password Reset Email
Check your email for "DigitalOcean Droplet Password Reset" and run:

```bash
# Replace YOUR_PASSWORD with the password from email
ssh root@139.59.51.237
# Enter password when prompted
```

Then paste this entire block:
```bash
apt-get update && apt-get install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2
mkdir -p /home/webhook && cd /home/webhook

cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(CONFIG.port, '0.0.0.0');
EOF

npm init -y && npm install express
pm2 stop all; pm2 delete all
pm2 start webhook.js --name webhook
pm2 save

# Setup SSL
certbot certonly --standalone -d hubix.duckdns.org \
  --non-interactive --agree-tos --email admin@hubix.duckdns.org

# Configure Nginx
cat > /etc/nginx/sites-available/webhook << 'NGINX'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
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
systemctl restart nginx

# Test
curl "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=SUCCESS"
```

---

## After Deployment:

### Test the webhook:
```bash
curl "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=TEST"
```

Should return: `TEST`

### Configure in Meta:
1. Go to WhatsApp Business Manager
2. Settings > Webhooks
3. Enter:
   - **Callback URL**: `https://hubix.duckdns.org/webhook`
   - **Verify Token**: `jarvish_webhook_2024`
4. Click "Verify and Save"

---

## Complete Story Deployment (After Webhook Works):

```bash
# Story 1.2, 1.3, 1.4 - Message Queue & Logging
apt-get install -y rabbitmq-server redis-server
systemctl start rabbitmq-server
rabbitmqctl add_user mvp mvp123
rabbitmqctl set_permissions -p / mvp ".*" ".*" ".*"

# Story 2.1 - Content Generation
mkdir -p /home/mvp/agents/{generators,controllers,orchestrator}
mkdir -p /home/mvp/{generated-content,generated-images,logs,data}

# Create agent framework files
# ... (copy agent files from local)

# Story 3.1 & 3.2 - WhatsApp Integration
cd /home/webhook
# Copy all webhook files (daily-utility-sender.js, button-click-handler.js, etc.)

# Start all services
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔴 CRITICAL: The webhook MUST be deployed for Meta to work!

**Time needed**: 2 minutes
**Action needed**: Use one of the options above with the correct password