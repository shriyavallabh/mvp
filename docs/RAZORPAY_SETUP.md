# 🔐 Razorpay Setup Guide - Adding JarvisDaily to Existing Account

## Overview

You already have a Razorpay account. This guide shows you how to add JarvisDaily.com to your existing account and configure subscription plans.

**Total Time:** 15-20 minutes
**Difficulty:** Easy

---

## 📋 Step-by-Step Setup

### Step 1: Login to Razorpay Dashboard

1. Go to https://dashboard.razorpay.com/
2. Login with your existing credentials
3. You'll land on the Dashboard homepage

**Screenshot Checkpoint:** You should see your existing website's transactions

---

### Step 2: Get Your API Keys (Test & Live)

**Option A: Using Existing Keys (Recommended)**
If you want to use the same API keys across all your websites:

1. Go to **Settings** (gear icon) → **API Keys**
2. You'll see your existing keys:
   - **Test Mode:** `rzp_test_XXXXXXXXXX`
   - **Live Mode:** `rzp_live_XXXXXXXXXX` (if activated)

3. Click **Regenerate Test Key** or **Regenerate Live Key** if needed
4. Copy both:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (click "Show" to reveal)

**⚠️ Important:**
- Test keys work across all your websites on the same account
- Live keys also work across all websites
- You can use the SAME keys for multiple websites

**Option B: Creating Separate Keys (Not Recommended)**
Razorpay doesn't support separate API keys per website. One account = One set of keys for all websites.

**Action Required:** Copy your API keys now ✍️

```
Key ID: rzp_test_________________
Key Secret: _____________________
```

---

### Step 3: Create Subscription Plans

Now let's create two subscription plans for JarvisDaily:

#### Plan 1: Solo Plan (₹499/month)

1. Go to **Subscriptions** → **Plans** in left sidebar
2. Click **Create Plan** button
3. Fill in the details:

   ```
   Plan Name: JarvisDaily Solo Plan
   Plan Description: 1 daily content asset (LinkedIn + WhatsApp + Status Image)

   Billing Cycle: Monthly
   Billing Amount: ₹499

   Plan ID: jarvisdaily_solo_monthly (auto-generated, you can customize)

   Trial Period: 0 days (or add 7 days if you want)

   Plan Type: Regular
   ```

4. Click **Create Plan**
5. **Copy the Plan ID** - You'll need this!

**Plan ID:** `plan_XXXXXXXXXXXXX` (save this!) ✍️

#### Plan 2: Professional Plan (₹999/month)

1. Click **Create Plan** again
2. Fill in the details:

   ```
   Plan Name: JarvisDaily Professional Plan
   Plan Description: 3 daily content assets (3× LinkedIn + WhatsApp + Status Images)

   Billing Cycle: Monthly
   Billing Amount: ₹999

   Plan ID: jarvisdaily_professional_monthly (auto-generated, you can customize)

   Trial Period: 0 days (or add 7 days if you want)

   Plan Type: Regular
   ```

3. Click **Create Plan**
4. **Copy the Plan ID**

**Plan ID:** `plan_XXXXXXXXXXXXX` (save this!) ✍️

---

### Step 4: Add Website URL to Authorized Domains

This step ensures Razorpay accepts payment requests from jarvisdaily.com:

1. Go to **Settings** → **Website and App Settings**
2. Under **Whitelisted Domains**, add:
   ```
   https://jarvisdaily.com
   https://finadvise-webhook.vercel.app
   http://localhost:3000 (for testing)
   ```

3. Click **Save**

**Note:** This prevents payment requests from unauthorized domains.

---

### Step 5: Configure Webhooks for JarvisDaily

Webhooks notify your app when subscription events happen (payment success, failure, etc.):

1. Go to **Settings** → **Webhooks**
2. Click **Create New Webhook** or **Add Webhook URL**
3. Enter webhook details:

   ```
   Webhook URL: https://jarvisdaily.com/api/razorpay/webhook

   Active Events (select these):
   ✅ subscription.activated
   ✅ subscription.charged
   ✅ subscription.cancelled
   ✅ subscription.paused
   ✅ subscription.resumed
   ✅ subscription.pending
   ✅ subscription.halted
   ✅ payment.authorized
   ✅ payment.captured
   ✅ payment.failed

   Alert Email: your-email@domain.com
   ```

4. Click **Create Webhook**
5. **Copy the Webhook Secret** (it will be shown once)

**Webhook Secret:** `whsec_XXXXXXXXXXXXX` ✍️

**Important:** Save this secret - you can't view it again! If lost, you'll need to regenerate.

---

### Step 6: Enable Required Features

Make sure these features are enabled:

1. Go to **Settings** → **Payment Methods**
2. Ensure these are enabled:
   - ✅ Cards (Debit/Credit)
   - ✅ Netbanking
   - ✅ UPI
   - ✅ Wallets (Paytm, PhonePe, etc.)

3. Go to **Settings** → **Subscriptions**
4. Ensure:
   - ✅ Subscriptions are enabled
   - ✅ Email notifications enabled
   - ✅ SMS notifications enabled (optional)

---

### Step 7: Test Mode vs Live Mode

**Test Mode (Use This First!):**
- No real money is charged
- Use test card numbers
- Perfect for development

**Live Mode (Production):**
- Real payments
- Requires KYC completion
- Your account must be activated

**For now:** We'll use **Test Mode** for development.

---

### Step 8: Update Environment Variables

Now let's add all Razorpay credentials to your `.env` file.

**I need from you:**
1. ✅ Key ID (Test): `rzp_test_________________`
2. ✅ Key Secret (Test): `_____________________`
3. ✅ Solo Plan ID: `plan_________________`
4. ✅ Professional Plan ID: `plan_________________`
5. ✅ Webhook Secret: `whsec_________________`

**Once you provide these, I'll update your .env file automatically.**

---

### Step 9: Test Card Numbers (For Testing)

When testing in Test Mode, use these card details:

**Successful Payment:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date (e.g., 12/25)
Name: Any name
```

**Failed Payment:**
```
Card Number: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

**Other Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/

---

## 📝 Summary Checklist

Before we proceed, make sure you have:

- [ ] Logged into Razorpay Dashboard
- [ ] Copied API Key ID (Test Mode)
- [ ] Copied API Key Secret (Test Mode)
- [ ] Created "JarvisDaily Solo Plan" (₹499/month)
- [ ] Copied Solo Plan ID
- [ ] Created "JarvisDaily Professional Plan" (₹999/month)
- [ ] Copied Professional Plan ID
- [ ] Added jarvisdaily.com to whitelisted domains
- [ ] Created webhook with URL: https://jarvisdaily.com/api/razorpay/webhook
- [ ] Copied Webhook Secret
- [ ] Verified payment methods are enabled

---

## 🎯 Next Steps

Once you provide the credentials, I will:

1. ✅ Update `.env` file with Razorpay credentials
2. ✅ Create Razorpay API route (`/api/razorpay/create-subscription`)
3. ✅ Create webhook handler (`/api/razorpay/webhook`)
4. ✅ Create Razorpay client library (`lib/razorpay.js`)
5. ✅ Integrate with pricing page
6. ✅ Create test script to verify connection
7. ✅ Document the complete payment flow

---

## 📚 Razorpay Documentation Links

- **Dashboard:** https://dashboard.razorpay.com/
- **API Docs:** https://razorpay.com/docs/api/
- **Subscriptions:** https://razorpay.com/docs/payments/subscriptions/
- **Webhooks:** https://razorpay.com/docs/webhooks/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/

---

## 🔍 FAQ

**Q: Can I use the same API keys for multiple websites?**
A: Yes! Razorpay allows one set of API keys per account, which work across all your websites.

**Q: Do I need separate webhooks for each website?**
A: Yes, you should create separate webhook URLs for each website/project for better tracking.

**Q: Will this affect my existing website?**
A: No! Adding JarvisDaily won't affect your existing website. All subscriptions and payments are tracked separately by plan IDs.

**Q: Can I test without KYC?**
A: Yes! Test mode works without KYC. You only need KYC for Live mode (real payments).

**Q: How do I switch from Test to Live mode?**
A: Replace `rzp_test_` keys with `rzp_live_` keys in .env file after KYC is complete.

---

**Ready to proceed?** Please provide the 5 credentials listed in Step 8, and I'll set everything up for you!
