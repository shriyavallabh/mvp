# ✅ YOUR CURRENT SETUP - Summary & Next Steps

## 🎉 What You Have (VERIFIED)

### Meta WhatsApp Setup
```
✅ App Name: Jarvis_WhatsApp_Bot
✅ App ID: 100088701756168
✅ Display Name: Jarvis Daily by The Skin Rules
✅ Phone Number: +91 76666 84471
✅ Phone Number ID: 792411637295195
✅ WABA ID: 1502194177669589
✅ Permanent Token: EAAMADo1n9VM... (full token saved in .env)
⚠️  Status: Phone number "Pending review"
```

### Vercel Setup
```
✅ Project ID: prj_QQAial59AHSd44kXyY1fGkPk3rkA
✅ User ID: nlkueSK4czn3NjQoM6nwiJXV
✅ Token: jAxr7wRF6lKNvkRLCU6HPMsg
✅ Domain: jarvisdaily.com
✅ Webhook endpoint: /api/webhook.js (exists ✅)
```

### Local .env Updated
```
✅ WHATSAPP_PHONE_NUMBER_ID=792411637295195
✅ WHATSAPP_BUSINESS_ACCOUNT_ID=1502194177669589
✅ WHATSAPP_ACCESS_TOKEN=EAAMADo1n9VM...
⚠️  WHATSAPP_APP_SECRET=get_from_app_settings_basic (NEEDS UPDATE)
✅ WHATSAPP_WEBHOOK_VERIFY_TOKEN=finadvise-webhook-2024
```

---

## 🔴 WHAT'S NEEDED NOW (20 minutes)

### STEP 1: Get App Secret (2 min) - DO THIS FIRST

1. Go to: https://developers.facebook.com/apps/100088701756168/settings/basic/
   (Direct link to your app settings!)

2. Find **"App Secret"** row
3. Click **"Show"** button
4. Enter your Facebook password
5. **Copy the secret** (starts with letters/numbers, about 32 characters)

6. Update `.env` file line 46:
```bash
# Open file
nano /Users/shriyavallabh/Desktop/mvp/.env

# Or use any text editor, find line 46:
WHATSAPP_APP_SECRET=get_from_app_settings_basic

# Replace with (paste actual secret):
WHATSAPP_APP_SECRET=abc123your_actual_app_secret_here

# Save file (Ctrl+O, Enter, Ctrl+X if using nano)
```

---

### STEP 2: Set Vercel Environment Variables (5 min)

**Option A: Via Vercel Dashboard (Easier)**

1. Go to: https://vercel.com/dashboard
2. Find and click your project (should be "mvp" or similar)
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left menu
5. Add these 5 variables (click "Add" for each):

```
Name: WHATSAPP_PHONE_NUMBER_ID
Value: 792411637295195
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: WHATSAPP_BUSINESS_ACCOUNT_ID
Value: 1502194177669589
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: WHATSAPP_ACCESS_TOKEN
Value: EAAMADo1n9VMBPig8H4zoZCOvEAZAihn0RWir4QsqjaDwqwZAZC5ZCeSZBputO7BqMGmictvxsQ5lnW4WZB3fJOegaKxf3PkvcZAHcZCpKYBYaJ2KCZC57QpXwhAiZCJPJ8YZAPsq2o2LMJen32XjjeasSbLqIljgaPxkHJA8ZBUYZBoqYkcYZBELrkq5xZBZA3VjZAkZARngQZDZD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: WHATSAPP_WEBHOOK_VERIFY_TOKEN
Value: finadvise-webhook-2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: WHATSAPP_APP_SECRET
Value: [paste the secret you got in Step 1]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

6. Click "Save" for each one

**Option B: Via CLI** (if you prefer terminal)

```bash
# Set environment variables
vercel env add WHATSAPP_PHONE_NUMBER_ID production
# When prompted, paste: 792411637295195

vercel env add WHATSAPP_BUSINESS_ACCOUNT_ID production
# When prompted, paste: 1502194177669589

vercel env add WHATSAPP_ACCESS_TOKEN production
# When prompted, paste: EAAMADo1n9VMBPig8H4zoZCOvEAZAihn0RWir4QsqjaDwqwZAZC5ZCeSZBputO7BqMGmictvxsQ5lnW4WZB3fJOegaKxf3PkvcZAHcZCpKYBYaJ2KCZC57QpXwhAiZCJPJ8YZAPsq2o2LMJen32XjjeasSbLqIljgaPxkHJA8ZBUYZBoqYkcYZBELrkq5xZBZA3VjZAkZARngQZDZD

vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN production
# When prompted, paste: finadvise-webhook-2024

vercel env add WHATSAPP_APP_SECRET production
# When prompted, paste: [your app secret from Step 1]
```

---

### STEP 3: Deploy/Redeploy to Vercel (2 min)

```bash
cd /Users/shriyavallabh/Desktop/mvp
vercel --prod
```

**Expected output:**
```
🔍 Inspect: https://vercel.com/...
✅ Production: https://your-app.vercel.app [copied to clipboard]
```

**Copy the production URL!** You'll need it for webhook configuration.

**Note**: If your domain is jarvisdaily.com, the webhook URL will be:
```
https://jarvisdaily.com/api/webhook
```

---

### STEP 4: Configure Webhook in Meta (5 min)

1. Go to: https://developers.facebook.com/apps/100088701756168/whatsapp-business/wa-settings/
   (Direct link to your WhatsApp configuration!)

2. Find **"Webhook"** section
3. Click **"Edit"** button

4. Enter these values:

**Callback URL:**
```
https://jarvisdaily.com/api/webhook
```
(Or use your Vercel URL if different)

**Verify Token:**
```
finadvise-webhook-2024
```

5. Click **"Verify and Save"**

⏳ Wait 5-10 seconds while Meta verifies...

✅ **Success!** You should see: "Webhook verified" with green checkmark

❌ **If verification fails**, check:
- URL is correct (no extra spaces, ends with /api/webhook)
- Verify token matches exactly
- Vercel env vars are set
- Try redeploying: `vercel --prod`

6. **Subscribe to messages:**
   - Scroll down to **"Webhook fields"**
   - Find **"messages"** row
   - Click **"Subscribe"** button
   - ✅ Green checkmark should appear

---

### STEP 5: Verify Phone Number (IMPORTANT!)

Your phone shows **"Pending review"**. Two options:

**Option A: Wait for Auto-Approval** (1-2 hours)
- Meta will review and approve automatically
- Check email for approval notification
- Check status at: https://developers.facebook.com/apps/100088701756168/whatsapp-business/wa-dev-console/

**Option B: Verify with Certificate** (Instant - if you have access to the phone)
1. You have certificate:
```
CnsKNwjkp5K7vI6GAhIGZW50OndhIh5KYXJ2aXMgRGFpbHkgYnkgVGhlIFNraW4gUlVsZXNQnZKDxwYaQHt7JFuZyIPGDrWh98XSFmVlqSKoZfZMiajNhlzlCNyu0+0DlYxGMfi9PmBdSOU6JN/y5DvyzrbXwRlSxxaqqw8SL21LQNb4lszk8Fqyu5mray+TXOzhWMLxBdteAo+LHPy5q+toqVFok+ZsjNwkY5jr
```

2. Follow: https://developers.facebook.com/docs/whatsapp/business-management-api/guides/set-up-webhooks/#complete-registration
3. Use SMS/call method to verify

**For Now**: You can proceed with testing using test numbers while waiting for approval.

---

### STEP 6: Test Webhook (1 min)

```bash
curl "https://jarvisdaily.com/api/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=finadvise-webhook-2024"
```

**Expected response:** `test123`

✅ If you see `test123` → Webhook is working!
❌ If error → Check Vercel deployment and env vars

---

## 🚀 READY TO CREATE TEMPLATE & TEST

Once Steps 1-6 are complete, you can:

### Create WhatsApp Template:
```bash
node create-template-meta-direct.js
```

### Check Account Limits:
```bash
node check-meta-limits.js
```

### Send Test Message (after template approved):
```bash
# Edit send-via-meta-direct.js to use just your number first
node send-via-meta-direct.js
```

### Monitor Webhook:
```bash
vercel logs --follow
```

---

## ✅ COMPLETE CHECKLIST

Before proceeding to testing:

- [ ] Got App Secret from Meta dashboard
- [ ] Updated `.env` line 46 with App Secret
- [ ] Set 5 environment variables in Vercel dashboard
- [ ] Deployed/redeployed: `vercel --prod`
- [ ] Configured webhook callback URL in Meta
- [ ] Webhook verified (green checkmark) ✅
- [ ] Subscribed to "messages" field ✅
- [ ] Tested webhook: `curl` returns `test123` ✅
- [ ] Phone number approved (or using test numbers)

---

## 🆘 TROUBLESHOOTING

### Can't find App Secret
```
Direct link: https://developers.facebook.com/apps/100088701756168/settings/basic/
Look for "App Secret" row
Click "Show"
Enter password
Copy the secret
```

### Webhook verification fails
```
1. Check callback URL: https://jarvisdaily.com/api/webhook
2. Check verify token: finadvise-webhook-2024
3. Redeploy: vercel --prod
4. Wait 30 seconds, try again
5. Check Vercel logs: vercel logs --follow
```

### Phone number stuck on "Pending"
```
Option 1: Wait 1-2 hours for Meta approval
Option 2: Use test number instead (see STEP-BY-STEP-META-SETUP.md Part 3.2)
Option 3: For immediate testing: Add test recipient numbers in Meta Dashboard
```

---

## 💡 YOUR DETAILS FOR QUICK REFERENCE

```
Meta App: https://developers.facebook.com/apps/100088701756168
WhatsApp Config: https://developers.facebook.com/apps/100088701756168/whatsapp-business/wa-settings/
Phone Status: https://developers.facebook.com/apps/100088701756168/whatsapp-business/wa-dev-console/

Vercel Project: https://vercel.com/dashboard
Webhook URL: https://jarvisdaily.com/api/webhook
Verify Token: finadvise-webhook-2024

Phone Number ID: 792411637295195
WABA ID: 1502194177669589
WhatsApp Number: +91 76666 84471
```

---

## 🎯 CURRENT STATUS

**Progress**: 70% complete
**Time remaining**: ~20 minutes
**Next immediate step**: Get App Secret (2 minutes)

**You're almost there!** Just a few more steps! 💪
