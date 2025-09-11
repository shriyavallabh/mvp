#!/usr/bin/env python3

import paramiko
import time
import sys

# Configuration
NEW_VM_IP = "139.59.46.240"
PASSWORD = "6f5bb5e75ddf1461711393813d"
USERNAME = "root"

def deploy_webhook():
    print("🚀 Automated Webhook Deployment")
    print("================================\n")
    
    # Connect to VM
    print(f"📡 Connecting to {NEW_VM_IP}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(NEW_VM_IP, username=USERNAME, password=PASSWORD)
        print("✅ Connected successfully!\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    # Commands to execute
    commands = [
        ("Installing dependencies", "apt-get update && apt-get install -y nodejs npm nginx certbot python3-certbot-nginx && npm install -g pm2"),
        ("Creating webhook directory", "mkdir -p /home/webhook && cd /home/webhook"),
    ]
    
    # Execute basic setup commands
    for desc, cmd in commands:
        print(f"📦 {desc}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.read()  # Wait for completion
    
    # Create webhook file
    print("📝 Creating webhook server...")
    webhook_code = '''cat > /home/webhook/webhook.js << 'EOF'
const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// Meta webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Verification: mode=${mode}, token=${token}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('Webhook verified!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', (req, res) => {
    console.log('Event received');
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.get('/', (req, res) => {
    res.send('Webhook running');
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`Webhook on port ${CONFIG.port}`);
});
EOF'''
    
    ssh.exec_command(webhook_code)
    time.sleep(2)
    
    # Install packages and start webhook
    print("📦 Installing Express...")
    ssh.exec_command("cd /home/webhook && npm init -y && npm install express")
    time.sleep(5)
    
    print("🚀 Starting webhook with PM2...")
    ssh.exec_command("cd /home/webhook && pm2 stop all; pm2 delete all; pm2 start webhook.js --name webhook && pm2 save")
    time.sleep(3)
    
    # Setup SSL
    print("🔒 Setting up SSL certificate...")
    ssl_commands = """
    systemctl stop nginx
    certbot certonly --standalone -d hubix.duckdns.org --non-interactive --agree-tos --email admin@hubix.duckdns.org || true
    
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
    nginx -t && systemctl restart nginx
    """
    
    ssh.exec_command(ssl_commands)
    time.sleep(5)
    
    # Test webhook
    print("\n🧪 Testing webhook...")
    stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=TEST"')
    result = stdout.read().decode()
    
    if "TEST" in result:
        print("✅ Webhook test successful!")
    else:
        print("⚠️ Webhook test returned:", result)
    
    # Check PM2 status
    stdin, stdout, stderr = ssh.exec_command("pm2 list")
    print("\n📊 PM2 Status:")
    print(stdout.read().decode())
    
    ssh.close()
    
    print("\n" + "="*50)
    print("✅ DEPLOYMENT COMPLETE!")
    print("="*50)
    print("\n🔗 Webhook URL: https://hubix.duckdns.org/webhook")
    print("🔑 Verify Token: jarvish_webhook_2024")
    print("\n📱 Configure in Meta Business Manager now!")
    
    return True

# Update DuckDNS
def update_duckdns():
    import requests
    print("\n🔄 Updating DuckDNS domain to point to new IP...")
    url = f"https://www.duckdns.org/update?domains=hubix&token=3cf32727-dc65-424f-a71d-abbc35ad3c5a&ip={NEW_VM_IP}"
    response = requests.get(url)
    if "OK" in response.text:
        print("✅ Domain updated successfully!")
    else:
        print("⚠️ Domain update response:", response.text)

if __name__ == "__main__":
    try:
        # First update DNS
        update_duckdns()
        time.sleep(2)
        
        # Then deploy webhook
        deploy_webhook()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)