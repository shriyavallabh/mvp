# ✅ QUICK SETUP CHECKLIST

## Pre-Flight Check
- [ ] Facebook account ready
- [ ] Email address ready
- [ ] Phone number for verification
- [ ] Vercel account ready
- [ ] Your WhatsApp number for testing

---

## STEP 1: Meta Business Account (5 min)
- [ ] Go to https://business.facebook.com
- [ ] Click "Create Account"
- [ ] Enter business name: **JarvisDaily**
- [ ] Enter your name and email
- [ ] Verify email
- [ ] ✅ Business account created

---

## STEP 2: Meta App (10 min)
- [ ] Go to https://developers.facebook.com/apps
- [ ] Click "Create App"
- [ ] Choose "Business" type
- [ ] App name: **JarvisDaily WhatsApp**
- [ ] Select your business account
- [ ] ✅ App created

---

## STEP 3: Add WhatsApp Product (5 min)
- [ ] In App Dashboard, find "WhatsApp" product
- [ ] Click "Set Up"
- [ ] Choose "Use test number" (for testing)
- [ ] Copy **Phone Number ID**: `_________________`
- [ ] Add your WhatsApp number as test recipient
- [ ] Send test message to verify
- [ ] ✅ Received test message on WhatsApp

---

## STEP 4: Get Access Token (5 min)

### Temporary Token (expires in 24h):
- [ ] On "Getting Started" page
- [ ] Copy temporary token: `_________________`

### Permanent Token (RECOMMENDED):
- [ ] Go to Business Settings → System Users
- [ ] Click "Add" → Create "JarvisDaily System User"
- [ ] Click "Generate New Token"
- [ ] Select app: JarvisDaily WhatsApp
- [ ] Expiration: Never
- [ ] Permissions: ☑️ whatsapp_business_messaging, ☑️ whatsapp_business_management
- [ ] Copy permanent token: `_________________`
- [ ] ✅ Permanent token saved securely

---

## STEP 5: Get App Secret (2 min)
- [ ] In App Dashboard → Settings → Basic
- [ ] Click "Show" next to App Secret
- [ ] Copy App Secret: `_________________`
- [ ] ✅ App Secret saved

---

## STEP 6: Configure Webhook (10 min)

### Deploy to Vercel:
- [ ] Run: `vercel --prod`
- [ ] Copy Vercel URL: `_________________`

### Set Environment Variables in Vercel:
- [ ] WHATSAPP_PHONE_NUMBER_ID = `_________________`
- [ ] WHATSAPP_ACCESS_TOKEN = `_________________`
- [ ] WHATSAPP_WEBHOOK_VERIFY_TOKEN = `finadvise-webhook-2024`
- [ ] WHATSAPP_APP_SECRET = `_________________`
- [ ] Redeploy: `vercel --prod`

### Configure in Meta App:
- [ ] Go to App → WhatsApp → Configuration
- [ ] Click "Edit" on Webhook
- [ ] Callback URL: `https://your-app.vercel.app/api/webhook`
- [ ] Verify Token: `finadvise-webhook-2024`
- [ ] Click "Verify and Save"
- [ ] ✅ Webhook verified (green checkmark)
- [ ] Subscribe to "messages" field
- [ ] ✅ Webhook configured

---

## STEP 7: Update Local .env (2 min)
- [ ] Open `.env` file
- [ ] Add/update these variables:
  ```bash
  WHATSAPP_PHONE_NUMBER_ID=_________________
  WHATSAPP_BUSINESS_ACCOUNT_ID=_________________
  WHATSAPP_ACCESS_TOKEN=_________________
  WHATSAPP_WEBHOOK_VERIFY_TOKEN=finadvise-webhook-2024
  WHATSAPP_APP_SECRET=_________________
  ```
- [ ] Save file
- [ ] ✅ .env updated

---

## STEP 8: Create WhatsApp Template (15 min)
- [ ] Run: `node create-template-meta-direct.js`
- [ ] Check output for Template ID
- [ ] ✅ Template submitted
- [ ] ⏳ Wait for approval email (1-2 hours)
- [ ] ✅ Received approval email
- [ ] Template approved and ready

---

## STEP 9: Test Webhook (5 min)
- [ ] Run: `curl "https://your-app.vercel.app/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=finadvise-webhook-2024"`
- [ ] Expected: See `test` in response
- [ ] ✅ Webhook verification works
- [ ] Run: `vercel logs --follow` (keep running)
- [ ] Send test message from Meta Dashboard
- [ ] ✅ See webhook logs appear

---

## STEP 10: Test Sending (After template approved)
- [ ] Edit `send-via-meta-direct.js` with your number only
- [ ] Run: `node send-via-meta-direct.js`
- [ ] ✅ See "Success!" in terminal
- [ ] ✅ Received message on WhatsApp
- [ ] ✅ Message has button "📱 Send Content"

---

## STEP 11: Test Button Click (Final!)
- [ ] In WhatsApp, click "📱 Send Content" button
- [ ] Watch `vercel logs --follow`
- [ ] ✅ See "BUTTON CLICKED" in logs
- [ ] ✅ See "Sending content package" in logs
- [ ] ✅ Received 2-3 follow-up messages in WhatsApp
- [ ] ✅ Messages contain your generated content

---

## STEP 12: Production Deploy
- [ ] Update `send-via-meta-direct.js` with all 4 advisors
- [ ] For test number: Add all 4 numbers in Meta Dashboard
- [ ] Run full test: `node send-via-meta-direct.js`
- [ ] ✅ All 4 advisors received messages
- [ ] ✅ All can click button successfully
- [ ] Add to PM2/cron for 9 AM daily
- [ ] Monitor for 1 week
- [ ] ✅ 95%+ success rate achieved

---

## STEP 13: Cancel AiSensy 🎉
- [ ] Log into AiSensy
- [ ] Go to Subscription/Billing
- [ ] Cancel subscription
- [ ] ✅ Save ₹2,399/month = ₹28,788/year!

---

## SUCCESS CRITERIA

✅ **Setup Complete When:**
1. Template approved by Meta
2. Webhook verified and subscribed
3. Test message sent successfully
4. Button click triggers webhook
5. Free-flow messages delivered
6. All 4 advisors working

✅ **Production Ready When:**
- 95%+ delivery success rate
- Webhook 99%+ uptime
- All advisors receiving daily
- Costs tracked correctly

---

## TROUBLESHOOTING QUICK FIXES

**Webhook verification failed:**
```bash
# Check token matches everywhere
echo $WHATSAPP_WEBHOOK_VERIFY_TOKEN
# Redeploy
vercel --prod
```

**Template not approved:**
```
# Check email for rejection reason
# Usually needs 1-2 hours
# Check at: business.facebook.com
```

**Message sending failed:**
```bash
# For test number: Add recipient in Meta Dashboard
# Check token: node check-meta-limits.js
# Check logs: vercel logs --follow
```

**Button not triggering webhook:**
```bash
# Check webhook subscribed to "messages"
# Check Vercel logs for POST requests
# Verify webhook.js has correct advisor list
```

---

## USEFUL COMMANDS

```bash
# Setup & Testing
node create-template-meta-direct.js   # Create template
node send-via-meta-direct.js          # Send messages
node check-meta-limits.js             # Check limits
vercel logs --follow                  # Monitor webhook

# Debugging
curl "https://your-app.vercel.app/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=finadvise-webhook-2024"

# Deploy
vercel --prod
```

---

## TIME ESTIMATE

- Setup (Steps 1-7): 45 minutes
- Template approval wait: 1-2 hours
- Testing (Steps 9-11): 15 minutes
- Production deploy (Step 12): 30 minutes

**Total: ~3 hours** (mostly waiting for template approval)

---

## COST TRACKING

| Item | Cost |
|------|------|
| Meta Business Account | ₹0 FREE |
| Meta App | ₹0 FREE |
| WhatsApp API | ₹0 FREE |
| Webhook | ₹0 FREE (Vercel) |
| Per message (Utility) | ₹0.22 |
| **4 advisors/day** | **₹0.88/day** |
| **Monthly (4 advisors)** | **₹26/month** |
| **vs AiSensy** | ~~₹2,425~~ → ₹26 |
| **Annual Savings** | **₹28,788** 🎉 |

---

## FINAL CHECKS BEFORE GOING LIVE

- [ ] All environment variables set correctly
- [ ] Webhook verified and subscribed
- [ ] Template approved by Meta
- [ ] Test with your own number: SUCCESS
- [ ] Test with all 4 advisors: SUCCESS
- [ ] Webhook logs show no errors
- [ ] Content generation working (/o command)
- [ ] PM2 cron scheduled for 9 AM
- [ ] Monitoring in place (Vercel logs)
- [ ] Backup plan if webhook fails

---

**🎯 Ready to go live!**

Delete this checklist once setup is complete and everything is working smoothly.
