# FINAL WEBHOOK SETUP - USE DIGITAL OCEAN CONSOLE

## Step 1: Access Your VM via Digital Ocean Console

1. Go to: https://cloud.digitalocean.com/droplets
2. Click on your droplet (IP: 134.209.154.123)
3. Click the **"Console"** button (opens terminal in browser)
4. You'll be logged in as root automatically

## Step 2: Copy & Paste These Commands in Console

Copy this ENTIRE block and paste in the Digital Ocean console:

```bash
# Quick webhook setup
cd /home/mvp/webhook

# Create webhook
cat > webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === 'jarvish_webhook_2024') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
});

app.listen(3000, () => console.log('Running'));
EOF

# Start webhook
pm2 stop all
pm2 delete all
pm2 start webhook.js --name webhook

# Get SSL certificate
sudo apt install -y certbot nginx
sudo systemctl stop nginx
sudo certbot certonly --standalone -d hubix.duckdns.org \
    --non-interactive --agree-tos --email admin@hubix.duckdns.org

# Configure Nginx
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 443 ssl;
    server_name hubix.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/hubix.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hubix.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx

echo "✅ DONE! Webhook ready!"
```

## Step 3: Use in Meta

After running the commands above:

**Callback URL:** `https://hubix.duckdns.org/webhook`  
**Verify Token:** `jarvish_webhook_2024`

## Alternative: Use Recovery Console

If regular console doesn't work:
1. Click "Recovery" → "Boot from Recovery ISO"
2. Access recovery console
3. Mount filesystem and run commands

## Your Webhook URL:

### ✅ FINAL URL FOR META:
```
https://hubix.duckdns.org/webhook
```

### ✅ VERIFY TOKEN:
```
jarvish_webhook_2024
```

This WILL work with Meta's webhook validation.