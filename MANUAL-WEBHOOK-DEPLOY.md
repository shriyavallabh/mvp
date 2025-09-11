# MANUAL WEBHOOK DEPLOYMENT INSTRUCTIONS
## Quick Fix for Meta Webhook Verification

### ⚠️ URGENT: Meta webhook verification is failing

The webhook needs to be deployed immediately. Since SSH authentication is failing, here are manual steps:

---

## Option 1: Password Authentication
Try SSH with password (check your Digital Ocean email):
```bash
ssh root@139.59.51.237
# OR
ssh root@64.227.147.237
```

---

## Option 2: Digital Ocean Console
1. Go to: https://cloud.digitalocean.com/droplets/518093693
2. Click "Access" → "Launch Droplet Console"
3. Login as root

---

## Once Connected, Run These Commands:

### Step 1: Quick Webhook Setup
```bash
# Create directory
mkdir -p /home/mvp/webhook
cd /home/mvp/webhook

# Create the webhook file
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// CRITICAL: Meta verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Verification:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Failed');
        res.status(403).send('Forbidden');
    }
});

// Handle messages
app.post('/webhook', (req, res) => {
    console.log('📨 Event received');
    res.status(200).send('OK');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook on port ${CONFIG.port}`);
});
EOF
```

### Step 2: Install Dependencies
```bash
# Install Node.js and npm if not present
apt-get update
apt-get install -y nodejs npm
npm install -g pm2

# Install Express
npm init -y
npm install express
```

### Step 3: SSL Certificate Setup
```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx nginx

# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone \
  -d hubix.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email admin@hubix.duckdns.org
```

### Step 4: Configure Nginx
```bash
cat > /etc/nginx/sites-available/webhook << 'EOF'
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

ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Step 5: Start Webhook
```bash
cd /home/mvp/webhook
pm2 stop all
pm2 delete all
pm2 start webhook.js --name webhook
pm2 save
pm2 startup
```

### Step 6: Test
```bash
# Test locally
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
# Should return: test123

# Test via domain
curl "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
# Should return: test123
```

---

## ✅ After Deployment

### In Meta Business Manager:
1. Go to WhatsApp > Configuration > Webhooks
2. Enter:
   - Callback URL: `https://hubix.duckdns.org/webhook`
   - Verify Token: `jarvish_webhook_2024`
3. Click "Verify and Save"

### Check Logs:
```bash
pm2 logs webhook
```

---

## 🚨 If Still Failing:

### Check these:
1. **Domain pointing**: `nslookup hubix.duckdns.org` should show `139.59.51.237`
2. **Port 443 open**: `ufw allow 443/tcp`
3. **SSL valid**: `curl -I https://hubix.duckdns.org`
4. **Webhook running**: `pm2 status`
5. **Nginx working**: `systemctl status nginx`

### Debug commands:
```bash
# Check if webhook is running
pm2 status

# Check nginx errors
tail -f /var/log/nginx/error.log

# Check webhook logs
pm2 logs webhook --lines 50

# Test webhook directly
curl -v "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test123"
```

---

## 📝 Complete All-Stories Deployment

After fixing the webhook, deploy all stories:

```bash
# Story 1.2, 1.3, 1.4 - Message Queue & Agents
apt-get install -y rabbitmq-server redis-server
systemctl start rabbitmq-server
rabbitmqctl add_user mvp mvp123
rabbitmqctl set_permissions -p / mvp ".*" ".*" ".*"

# Story 2.1 - Content Generation
mkdir -p /home/mvp/agents/{generators,controllers,orchestrator}
mkdir -p /home/mvp/{generated-content,generated-images,logs,data}

# Create the agent files (content-generator.js, distribution-manager.js, etc.)
# ... (copy from the restoration script)

# Start all processes
pm2 start ecosystem.config.js
```

---

**PRIORITY**: Get the webhook verified first, then deploy other stories!