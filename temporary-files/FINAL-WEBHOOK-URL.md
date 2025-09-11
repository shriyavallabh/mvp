# 🔴 YOUR WEBHOOK URL - FINAL SOLUTION

## Quick Test First - Try HTTP on Port 80

SSH into your VM and run:
```bash
# Get your VM IP
curl ifconfig.me
# Let's say it returns: 134.209.154.123

# Copy and run webhook on port 80
cd /home/mvp/webhook
pm2 stop all

# Create simple webhook on port 80
cat > webhook-simple.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'jarvish_webhook_2024') {
        console.log('✅ Verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Webhook events
app.post('/webhook', (req, res) => {
    console.log('📨 Event received');
    res.status(200).send('EVENT_RECEIVED');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(80, '0.0.0.0', () => {
    console.log('Webhook on port 80');
});
EOF

# Start on port 80
sudo pm2 start webhook-simple.js --name webhook

# Open port 80
sudo ufw allow 80
sudo ufw reload
```

## 📍 YOUR WEBHOOK URL:

If your VM IP is `134.209.154.123`, then:

```
Callback URL: http://134.209.154.123/webhook
Verify Token: jarvish_webhook_2024
```

## If Meta Still Rejects HTTP, Use Caddy for Automatic HTTPS:

```bash
# Install Caddy (auto HTTPS server)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddy as reverse proxy
sudo nano /etc/caddy/Caddyfile
```

Add this to Caddyfile:
```
:443 {
    reverse_proxy localhost:3000
    tls internal
}
```

Then:
```bash
# Start your webhook on port 3000
cd /home/mvp/webhook
pm2 start webhook-for-vm.js --name webhook

# Restart Caddy
sudo systemctl restart caddy

# Open port 443
sudo ufw allow 443
```

## 🎯 FINAL URLs TO TRY IN META:

### Option 1 (HTTP Port 80):
```
http://YOUR_VM_IP/webhook
```

### Option 2 (HTTPS with Caddy):
```
https://YOUR_VM_IP/webhook
```

### Verify Token (same for both):
```
jarvish_webhook_2024
```

## Test Your Webhook:
```bash
# From your local machine, test:
curl http://YOUR_VM_IP/health

# Should return:
{"status":"healthy"}
```

## Monitor Logs:
```bash
pm2 logs webhook
```