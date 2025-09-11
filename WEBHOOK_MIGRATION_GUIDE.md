# 🔄 WhatsApp Webhook Migration Guide
## From Fly.io to Your VM (Complete Independence)

## ✅ What We've Built

You now have a **completely independent webhook solution** running on your VM instead of Fly.io:

### Your New Webhook Server
- **Location**: Your VM (143.110.191.97)
- **Port**: 3000
- **URL**: `http://143.110.191.97:3000/webhook`
- **File**: `webhook-server.js`
- **Process Manager**: PM2 (auto-restart on crash)

## 🚀 Quick Deploy

```bash
# Run this single command to deploy webhook to your VM
./deploy-webhook.sh
```

This will:
1. Copy webhook server to VM
2. Install dependencies
3. Start with PM2
4. Configure auto-restart

## 📱 Update WhatsApp Settings (One-Time Setup)

### Step 1: Access Meta Developer Console
1. Go to: https://developers.facebook.com/apps/
2. Log in with your Facebook account
3. Select your WhatsApp Business app

### Step 2: Update Webhook URL
1. Navigate to: **WhatsApp → Configuration**
2. Find the **Webhooks** section
3. Click **Edit** next to your webhook
4. Change the Callback URL:
   - **OLD**: `https://jarvis-whatsapp-assist-silent-fog-7955.fly.dev/webhook`
   - **NEW**: `http://143.110.191.97:3000/webhook`
5. Keep Verify Token: `jarvish_webhook_2024`
6. Click **Verify and Save**

### Step 3: Subscribe to Messages
Make sure you're subscribed to:
- ✅ messages
- ✅ message_status
- ✅ message_template_status_update

## 🔍 Verify Everything Works

### 1. Check Webhook Health
```bash
curl http://143.110.191.97:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "WhatsApp Webhook Server",
  "timestamp": "2024-01-09T12:00:00.000Z"
}
```

### 2. Monitor Logs
```bash
ssh root@143.110.191.97 'pm2 logs whatsapp-webhook --lines 50'
```

### 3. Test Commands (8:30 PM - 11:00 PM only)
Send these messages to your WhatsApp Business number:
- `STATUS` - Check system status (works anytime)
- `APPROVE CNT_12345` - Approve content
- `REJECT CNT_12345` - Reject content
- `HELP` - Show available commands

## 🛡️ Security & Maintenance

### Firewall Rules (Already configured on VM)
```bash
# Port 3000 is open for webhook
ufw allow 3000/tcp
```

### PM2 Management
```bash
# On your VM
pm2 status               # Check webhook status
pm2 restart whatsapp-webhook  # Restart webhook
pm2 logs whatsapp-webhook     # View logs
pm2 monit                # Real-time monitoring
```

### Automatic Recovery
- PM2 auto-restarts on crash
- Maximum 10 restarts
- Logs stored in `/home/mvp/logs/`

## 📊 What Happens to Fly.io?

You can now:
1. **Cancel your Fly.io subscription** - You don't need it anymore!
2. **Delete the Fly.io app** - Everything runs on your VM
3. **Save money** - No external service costs

Your VM now handles:
- ✅ WhatsApp webhook reception
- ✅ Command processing
- ✅ Response sending
- ✅ All revision commands

## 🎯 Benefits of This Migration

| Before (Fly.io) | After (Your VM) |
|-----------------|-----------------|
| External dependency | Full control |
| Monthly costs | No extra costs |
| Limited debugging | Full access to logs |
| Deployment complexity | Simple PM2 commands |
| External downtime risk | Your VM = your control |

## 🆘 Troubleshooting

### Webhook Not Receiving Messages?
1. Check PM2 status: `pm2 status`
2. Verify port 3000 is accessible: `telnet 143.110.191.97 3000`
3. Check Meta webhook status in developer console
4. Review logs: `pm2 logs whatsapp-webhook --err`

### Meta Can't Verify Webhook?
1. Ensure verify token matches: `jarvish_webhook_2024`
2. Check firewall: `ufw status`
3. Test manually:
```bash
curl "http://143.110.191.97:3000/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=test"
```
Should return: `test`

### Commands Not Working?
1. Check time window (8:30 PM - 11:00 PM)
2. Verify content ID format (CNT_XXXXX)
3. Check revision handler logs

## ✅ Success Checklist

- [ ] Webhook deployed to VM
- [ ] PM2 process running
- [ ] WhatsApp settings updated with new URL
- [ ] Health check returns success
- [ ] Test message received and processed
- [ ] Fly.io app can be deleted

## 🎉 Congratulations!

You're now **completely independent** from Fly.io! Your webhook runs on your own VM with full control and no external dependencies.

**Next Steps:**
1. Monitor for 24 hours to ensure stability
2. Cancel Fly.io subscription
3. Enjoy your self-hosted solution!

---

**Support Commands:**
```bash
# Deploy webhook
./deploy-webhook.sh

# Check status
ssh root@143.110.191.97 'pm2 status'

# View logs
ssh root@143.110.191.97 'pm2 logs whatsapp-webhook'

# Restart if needed
ssh root@143.110.191.97 'pm2 restart whatsapp-webhook'
```