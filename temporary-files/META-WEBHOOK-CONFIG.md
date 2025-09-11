# 🎯 EXACT WEBHOOK CONFIGURATION FOR META

## Your Webhook Details:

### Callback URL:
```
http://YOUR_DIGITAL_OCEAN_IP:3000/webhook
```

### Verify Token:
```
jarvish_webhook_2024
```

## First, Get Your VM IP:

Run this on your VM:
```bash
curl ifconfig.me
```
This will show your public IP address.

## Example (Replace with YOUR IP):

If your VM IP is `134.209.154.123`, then your webhook URL would be:
```
http://134.209.154.123:3000/webhook
```

## Complete Setup Process:

### 1. On Your Digital Ocean VM:

```bash
# SSH into your VM
ssh root@YOUR_VM_IP

# Check if webhook is running
pm2 status

# If not running, start it:
cd /home/mvp/webhook
pm2 start webhook.js --name finadvise-webhook

# Check the logs
pm2 logs finadvise-webhook

# Test locally
curl http://localhost:3000/health
```

### 2. Test From Your Computer:

Replace YOUR_VM_IP with actual IP:
```bash
curl http://YOUR_VM_IP:3000/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "finadvise-webhook",
  "vm": "Digital Ocean"
}
```

### 3. In Meta Business Manager:

1. Go to: **WhatsApp Business Settings** → **Configuration** → **Webhooks**

2. Enter these EXACT values:

   **Callback URL:**
   ```
   http://YOUR_VM_IP:3000/webhook
   ```
   
   **Verify Token:**
   ```
   jarvish_webhook_2024
   ```

3. Click **"Verify and Save"**

4. You should see "Webhook Verified" message

5. Make sure these fields are **SUBSCRIBED**:
   - messages ✅
   - message_template_status_update ✅

## Monitoring Commands:

### On Your VM:

```bash
# Watch live webhook logs
pm2 logs finadvise-webhook --lines 100

# Monitor all processes
pm2 monit

# Check webhook status
pm2 status

# Restart if needed
pm2 restart finadvise-webhook
```

## Test Your Webhook:

### 1. Send a test from Meta:
In the webhook configuration page, click "Send Test" next to the messages field.

### 2. Send a WhatsApp message:
Send "Hello" to your WhatsApp number and watch the logs:
```bash
pm2 logs finadvise-webhook
```

You should see:
```
📨 Message from User (919022810769)
   Type: text
   💬 Message: "Hello"
   🤖 Responding with: "Hello User! 👋..."
```

## Troubleshooting:

### If webhook doesn't verify:

1. Check firewall:
```bash
ufw status
ufw allow 3000
ufw reload
```

2. Check if port 3000 is accessible:
```bash
netstat -tlnp | grep 3000
```

3. Make sure webhook is running:
```bash
pm2 status
pm2 start webhook.js --name finadvise-webhook
```

### If messages don't arrive:

1. Check Meta webhook subscriptions
2. Make sure "messages" field is subscribed
3. Check pm2 logs for errors

## Your Complete Webhook URL:

Once you get your VM IP, your complete URL will be:
```
http://[YOUR_VM_IP]:3000/webhook
```

Example:
```
http://134.209.154.123:3000/webhook
```

## Important Notes:

- No HTTPS needed (HTTP works fine with IP)
- Port 3000 must be open in firewall
- PM2 keeps it running 24/7
- No domain or SSL certificate needed