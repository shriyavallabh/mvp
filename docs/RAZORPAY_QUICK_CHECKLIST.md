# ⚡ Razorpay Quick Setup Checklist

**Goal:** Add JarvisDaily to your existing Razorpay account
**Time:** 15-20 minutes

---

## 🎯 What You Need to Get (Copy These)

### 1️⃣ API Credentials
Go to: **Settings** → **API Keys**

```
✍️ Key ID (Test):     rzp_test_____________________
✍️ Key Secret (Test): ________________________________
```

---

### 2️⃣ Create Plans
Go to: **Subscriptions** → **Plans** → **Create Plan**

**Plan 1: Solo (₹499/month)**
```
Plan Name: JarvisDaily Solo Plan
Amount: ₹499
Billing: Monthly
✍️ Plan ID: plan_____________________
```

**Plan 2: Professional (₹999/month)**
```
Plan Name: JarvisDaily Professional Plan
Amount: ₹999
Billing: Monthly
✍️ Plan ID: plan_____________________
```

---

### 3️⃣ Add Website
Go to: **Settings** → **Website and App Settings**

Add these domains:
- ✅ https://jarvisdaily.com
- ✅ https://finadvise-webhook.vercel.app
- ✅ http://localhost:3000

---

### 4️⃣ Create Webhook
Go to: **Settings** → **Webhooks** → **Add Webhook URL**

```
Webhook URL: https://jarvisdaily.com/api/razorpay/webhook

Select Events:
✅ subscription.activated
✅ subscription.charged
✅ subscription.cancelled
✅ payment.authorized
✅ payment.captured
✅ payment.failed

✍️ Webhook Secret: whsec_____________________
```

---

## ✅ Final Checklist

- [ ] Got API Key ID (Test)
- [ ] Got API Key Secret (Test)
- [ ] Created Solo Plan (₹499) - Got Plan ID
- [ ] Created Professional Plan (₹999) - Got Plan ID
- [ ] Added jarvisdaily.com to whitelisted domains
- [ ] Created webhook
- [ ] Got Webhook Secret

---

## 📤 Share These With Me

Once you have all 5 items, share them here:

```bash
1. Razorpay Key ID (Test): rzp_test_________________
2. Razorpay Key Secret (Test): ____________________
3. Solo Plan ID: plan_________________
4. Professional Plan ID: plan_________________
5. Webhook Secret: whsec_________________
```

**I'll then automatically:**
✅ Update your .env file
✅ Create API routes for Razorpay
✅ Integrate with pricing page
✅ Create webhook handler
✅ Test the connection

---

**Need Help?** Follow the detailed guide in `RAZORPAY_SETUP.md`
