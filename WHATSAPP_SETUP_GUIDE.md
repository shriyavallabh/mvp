# WhatsApp Business API Setup Guide

## ⚠️ Current Issue
The access token could not be decrypted. This usually means:
1. The token has expired
2. The token was copied incorrectly
3. The token needs to be regenerated

## 🔄 How to Get a Fresh WhatsApp Access Token

### Method 1: Meta Business Platform (Permanent Token)

1. **Go to Meta for Developers**
   - URL: https://developers.facebook.com/apps/
   - Select your app

2. **Navigate to WhatsApp > API Setup**
   - Find your Phone Number ID: `574744175733556` ✅ (This is correct)
   - Business Account ID: `1861646317956355` ✅ (This is correct)

3. **Generate New Permanent Token**
   - Go to "API Setup" or "Configuration"
   - Look for "Permanent Token" or "System User Access Token"
   - Click "Generate New Token"
   - Select permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Copy the ENTIRE token (it's very long)

### Method 2: Graph API Explorer (Quick Test Token)

1. **Go to Graph API Explorer**
   - URL: https://developers.facebook.com/tools/explorer/
   
2. **Select Your App**
   - Choose your WhatsApp Business app from dropdown
   
3. **Generate Token**
   - Click "Generate Access Token"
   - Grant necessary permissions
   - Copy the token

## 📝 Update Your Credentials

Once you have a new token, update the file `send-whatsapp-now.js`:

```javascript
const WHATSAPP_CONFIG = {
    phoneNumberId: '574744175733556',  // ✅ This is correct
    bearerToken: 'YOUR_NEW_TOKEN_HERE', // ← Paste new token here
    apiVersion: 'v17.0'
};
```

## 🧪 Test Your Token

### Quick Test via cURL
```bash
curl -X GET \
  "https://graph.facebook.com/v17.0/574744175733556" \
  -H "Authorization: Bearer YOUR_NEW_TOKEN_HERE"
```

If successful, you'll see your phone number details.

## 🚀 Deploy to VM

After updating the token:

```bash
# 1. Update the file locally
nano send-whatsapp-now.js
# (paste new token)

# 2. Copy to VM
scp send-whatsapp-now.js root@143.110.191.97:/home/mvp/

# 3. Update VM environment
ssh root@143.110.191.97
cd /home/mvp
echo "WHATSAPP_BEARER_TOKEN=YOUR_NEW_TOKEN_HERE" >> .env
pm2 restart all

# 4. Test sending
node send-whatsapp-now.js
```

## 🔍 Verify Your Setup

Your current configuration:
- ✅ Phone Number ID: `574744175733556`
- ✅ Business Account ID: `1861646317956355`
- ✅ Webhook URL: `https://softball-one-realtor-telecom.trycloudflare.com/webhook`
- ✅ Verify Token: `jarvish_webhook_2024`
- ❌ Bearer Token: Needs to be regenerated

## 📱 Alternative: Test Mode

If you want to proceed without real sending while getting the token:

```bash
# Enable test mode on VM
ssh root@143.110.191.97
echo "WHATSAPP_TEST_MODE=true" >> /home/mvp/.env
pm2 restart all

# Messages will be logged but not sent
pm2 logs whatsapp-webhook
```

## 🆘 Common Token Issues & Solutions

| Issue | Solution |
|-------|----------|
| Token expired | Generate new permanent token |
| Token truncated | Ensure you copy the ENTIRE token (can be 200+ characters) |
| Wrong permissions | Ensure `whatsapp_business_messaging` permission is granted |
| Wrong API version | Try `v18.0` or `v19.0` instead of `v17.0` |

## 📞 Your Advisors Ready to Receive

Once token is fixed, messages will be sent to:
1. **Shruti Petkar** - 9673758777 (Family Planning)
2. **Shri Avalok Petkar** - 9765071249 (Business Investment)
3. **Vidyadhar Petkar** - 8975758513 (Retirement Planning)

---

**Next Step**: Please generate a new permanent token from Meta Business Platform and provide it, or let me know if you need help with the token generation process.