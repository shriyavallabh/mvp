# AiSensy API Campaign Setup Guide

## ❌ Current Error:
```
{ message: 'Campaign does not exist.' }
```

## ✅ Solution: Create API Campaigns in AiSensy Dashboard

You've created and approved the **templates**, but now you need to create **API campaigns** that use these templates.

---

## 📋 Step-by-Step Instructions

### **Step 1: Login to AiSensy Dashboard**
Go to: https://app.aisensy.com

### **Step 2: Navigate to Campaigns**
- Click **"Campaigns"** in left sidebar
- Click **"Create Campaign"** button
- Select **"API Campaign"**

### **Step 3: Create Campaign 1 - Daily Content Package**

Fill in the form:

**Campaign Name:** `Daily_Package` (EXACTLY this - script uses this name)

**Select Template:**
- Choose `daily_content_package_v2` from dropdown

**Campaign Type:** API Campaign

**Status:** Active

Click **"Create"** or **"Save"**

---

### **Step 4: Create Campaign 2 - Status Image**

**Campaign Name:** `Status_Image` (EXACTLY this)

**Select Template:**
- Choose `daily_status_image` from dropdown

**Campaign Type:** API Campaign

**Status:** Active

Click **"Create"** or **"Save"**

---

### **Step 5: Create Campaign 3 - LinkedIn Post**

**Campaign Name:** `LinkedIn_Post` (EXACTLY this)

**Select Template:**
- Choose `daily_linkedin_post` from dropdown

**Campaign Type:** API Campaign

**Status:** Active

Click **"Create"** or **"Save"**

---

## 🔧 Update Script with Correct Campaign Names

After creating campaigns, I need to update the script to use the **exact campaign names** you created in AiSensy.

Currently the script uses dynamic names like:
```javascript
campaignName: `Daily_Package_${advisor.id}_${dateStr}`
```

But AiSensy requires **static campaign names** that exist in dashboard.

---

## ⚠️ Important Notes

1. **Campaign Name MUST match exactly** (case-sensitive)
2. Each API campaign can only use **one template**
3. Campaigns can send to **multiple recipients** (that's why we only need 3 campaigns total)
4. Make sure campaign status is **"Active"**

---

## 🚀 After Creating Campaigns

Once you've created all 3 API campaigns in AiSensy dashboard:

1. **Tell me the exact campaign names** you used
2. I'll update the script to use those names
3. Run: `node send-daily-templates.js`
4. Check Avalok's WhatsApp for 3 messages!

---

## 📸 What You Should See in AiSensy

After creating campaigns, in the Campaigns section you should see:

```
Campaign Name          Template                    Type        Status
─────────────────────  ──────────────────────────  ──────────  ────────
Daily_Package          daily_content_package_v2    API         Active
Status_Image           daily_status_image          API         Active
LinkedIn_Post          daily_linkedin_post         API         Active
```

---

## ❓ Can't Find "API Campaign" Option?

If you don't see "API Campaign" option, try:
- Look for "WhatsApp API" or "Send via API"
- Contact AiSensy support: support@aisensy.com
- Check if your plan includes API access (Pro plan should include it)

---

Let me know once you've created the campaigns! 🚀
