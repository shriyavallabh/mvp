# Story 3.2: VM Deployment Guide
## Click-to-Unlock Strategy with Intelligent Webhook CRM

### 🎯 Objective
Deploy the complete webhook system that enables:
- UTILITY templates with buttons that work anytime (bypass 24-hour limit)
- Intelligent CRM tracking all interactions
- Claude-powered chat responses
- Daily 5 AM content delivery

### 📍 Infrastructure Details
- **VM IP**: 139.59.51.237 (Floating IP - permanent)
- **Domain**: hubix.duckdns.org
- **SSL**: Let's Encrypt (free)
- **Status**: VM restored with all Story 1.1/2.1 files

---

## 🚀 QUICK START (5 Minutes)

### Step 1: SSH into VM
```bash
ssh root@139.59.51.237
# Password: Check your Digital Ocean email
```

### Step 2: Create Quick Deploy Script
```bash
cat > deploy-now.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 DEPLOYING STORY 3.2 WEBHOOK"
echo "=============================="

# 1. Update system
apt update && apt install -y nodejs npm nginx certbot python3-certbot-nginx sqlite3
npm install -g pm2

# 2. Create directories
mkdir -p /home/mvp/{webhook,data,logs,generated-images,reports}
cd /home/mvp/webhook

# 3. Download webhook files from GitHub/Gist (or copy manually)
echo "📥 Setting up webhook files..."

# 4. Create package.json
cat > package.json << 'PKG'
{
  "name": "story-3.2-webhook",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "node-cron": "^3.0.3",
    "sqlite3": "^5.1.6",
    "sqlite": "^5.1.1",
    "dotenv": "^16.3.1",
    "colors": "^1.4.0"
  }
}
PKG

# 5. Install dependencies
npm install

# 6. Create .env file
cat > .env << 'ENV'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
ENV

# 7. Get SSL certificate
echo "🔒 Setting up SSL..."
certbot certonly --standalone -d hubix.duckdns.org \
  --non-interactive --agree-tos --email admin@hubix.duckdns.org \
  --force-renewal || true

# 8. Configure Nginx
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
systemctl restart nginx

# 9. Start webhook (you'll need to add the actual webhook code here)
echo "✅ Setup complete! Add webhook code and start with pm2"
echo "📍 Webhook URL: https://hubix.duckdns.org/webhook"
EOF

chmod +x deploy-now.sh
./deploy-now.sh
```

### Step 3: Upload Webhook Code
Copy the webhook files to VM:

```bash
# From your local machine
scp webhook-for-vm.js root@139.59.51.237:/home/mvp/webhook/
scp daily-utility-sender.js root@139.59.51.237:/home/mvp/webhook/
scp button-click-handler.js root@139.59.51.237:/home/mvp/webhook/
scp intelligent-chat-system.js root@139.59.51.237:/home/mvp/webhook/
scp crm-tracking-system.js root@139.59.51.237:/home/mvp/webhook/
```

### Step 4: Start Services
```bash
# On VM
cd /home/mvp/webhook
pm2 start webhook-for-vm.js --name webhook
pm2 start daily-utility-sender.js --name daily-sender
pm2 save
pm2 startup
```

### Step 5: Test Webhook
```bash
# Test verification
curl "https://hubix.duckdns.org/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test"

# Check health
curl https://hubix.duckdns.org/health
```

---

## 📱 Meta Configuration

### 1. Access Meta Business Manager
- Go to: https://business.facebook.com
- Navigate to: WhatsApp > Settings > Configuration

### 2. Configure Webhook
```
Callback URL: https://hubix.duckdns.org/webhook
Verify Token: jarvish_webhook_2024
```

### 3. Subscribe to Webhooks
Select these fields:
- ✅ messages
- ✅ message_status
- ✅ message_template_status_update

### 4. Create UTILITY Template

Go to WhatsApp > Message Templates > Create Template

**Template Details:**
- Name: `advisor_daily_content_ready`
- Category: **UTILITY** (NOT Marketing!)
- Language: English

**Header:**
```
Good Morning, {{1}}!
```

**Body:**
```
Your personalized financial content for {{2}} is ready.

Click any button below to instantly receive your content. These buttons work anytime - even days later!
```

**Buttons (Quick Reply):**
1. 📸 Get Images
2. 📝 Get Content  
3. 📊 Get Updates

**Button Payloads:**
- Button 1: `UNLOCK_IMAGES`
- Button 2: `UNLOCK_CONTENT`
- Button 3: `UNLOCK_UPDATES`

---

## 🔍 Monitoring & Logs

### View Real-time Logs
```bash
# Webhook logs
pm2 logs webhook

# Daily sender logs
pm2 logs daily-sender

# All services
pm2 status
```

### Check CRM Analytics
```bash
# View analytics
curl https://hubix.duckdns.org/crm/analytics

# Check health
curl https://hubix.duckdns.org/health
```

### Database Queries
```bash
sqlite3 /home/mvp/data/crm.db

# Recent button clicks
SELECT * FROM button_clicks ORDER BY clicked_at DESC LIMIT 10;

# Active advisors today
SELECT DISTINCT advisor_phone FROM button_clicks 
WHERE DATE(clicked_at) = DATE('now');

# Exit
.quit
```

---

## 🧪 Testing

### Test Button Click
```bash
# Simulate button click
curl -X POST https://hubix.duckdns.org/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919022810769",
            "type": "interactive",
            "interactive": {
              "type": "button_reply",
              "button_reply": {
                "id": "UNLOCK_IMAGES",
                "title": "Get Images"
              }
            }
          }]
        }
      }]
    }]
  }'
```

### Test Daily Send
```bash
cd /home/mvp/webhook
node daily-utility-sender.js --test 919022810769
```

---

## 🚨 Troubleshooting

### Webhook Not Responding
```bash
# Check if service is running
pm2 status

# Restart webhook
pm2 restart webhook

# Check Nginx
nginx -t
systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew --force-renewal
systemctl restart nginx
```

### Port Issues
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 [PID]
```

### Database Issues
```bash
# Check database
ls -la /home/mvp/data/crm.db

# Reset database (WARNING: Deletes all data)
rm /home/mvp/data/crm.db
pm2 restart webhook
```

---

## 📊 Success Indicators

After deployment, you should see:

1. ✅ Webhook verified in Meta (green checkmark)
2. ✅ Health check returns `{"status": "healthy"}`
3. ✅ PM2 shows all services "online"
4. ✅ UTILITY template approved in Meta
5. ✅ Test button clicks deliver content
6. ✅ 5 AM daily sends work

---

## 🎯 Business Impact

### What This Enables:
1. **100% Reach**: UTILITY templates bypass opt-in requirements
2. **Anytime Engagement**: Buttons work even days after sending
3. **No 24-Hour Limit**: Click-to-unlock creates new conversation window
4. **Smart CRM**: Track every interaction automatically
5. **AI Responses**: Claude-powered intelligent chat

### Expected Results:
- 📈 80%+ button click rate (vs 20% for text commands)
- ⏰ Peak engagement 9-11 AM (post 5 AM send)
- 💬 30% advisors use chat feature
- 📊 Rich analytics for optimization

---

## 📝 Post-Deployment Checklist

- [ ] Webhook verified in Meta
- [ ] UTILITY template approved
- [ ] Test message sent successfully
- [ ] Button clicks deliver content
- [ ] CRM tracking working
- [ ] Daily sender scheduled
- [ ] Monitoring dashboard accessible
- [ ] Team trained on system

---

## 🆘 Support

### Issues?
1. Check logs: `pm2 logs webhook`
2. Review this guide
3. Check Meta webhook status
4. Verify domain/SSL working

### Need Help?
- Create issue at: github.com/your-repo/issues
- Check health: https://hubix.duckdns.org/health
- Analytics: https://hubix.duckdns.org/crm/analytics

---

**Last Updated**: 2025-09-11
**Story**: 3.2 - Click-to-Unlock Strategy
**Status**: Ready for Deployment