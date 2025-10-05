# Webhook Solution: Bypass AiSensy Enterprise Plan

## ❌ The Problem You Identified

**AiSensy Webhook Access:**
- Free Plan: NO webhook access
- Basic/Pro Plan: LIMITED webhook access
- Enterprise Plan: FULL webhook access (expensive, sales team required)

**Your Question:**
> "Can we implement webhook WITHOUT using AiSensy?"

---

## ✅ THE ANSWER: YES! Use Meta Cloud API Directly

### **The Solution:**

```
Current Setup:
AiSensy (for sending messages) → WhatsApp

New Setup:
AiSensy (for sending) + Meta Cloud API (for webhooks) → WhatsApp
```

**Key Insight:**
- Keep using AiSensy for SENDING templates (cheap, easy)
- Use Meta's FREE direct webhook API for RECEIVING messages
- They work together on the SAME WhatsApp number!

---

## 🎯 HOW IT WORKS

### **Architecture:**

```
                    SENDING MESSAGES
                          ↓
Your Script → AiSensy API → WhatsApp Number → User
                                    ↑
                                    |
                          RECEIVING MESSAGES
                                    |
                                    ↓
                          Meta Webhook API
                                    ↓
                          Your Vercel Server
                                    ↓
                      Process & Send Free-Flow
```

### **Two Separate Connections:**

**Connection 1: Sending (via AiSensy)**
- Use AiSensy's API to send template messages
- Pay only for messages sent (₹0.88 per message)
- No webhook access needed from AiSensy

**Connection 2: Receiving (via Meta Cloud API)**
- Register SAME WhatsApp number with Meta
- Setup FREE webhook endpoint
- Receive all inbound messages, button clicks, etc.
- Send free-flow messages directly via Meta API

---

## 🔧 STEP-BY-STEP IMPLEMENTATION

### **Step 1: Get Your WhatsApp Phone Number ID**

From AiSensy dashboard:
1. Go to Settings → WhatsApp Number
2. Copy your WhatsApp Business Phone Number ID
3. Example: `574744175733556`

You already have this in your `.env`:
```
WHATSAPP_PHONE_NUMBER_ID=574744175733556
```

---

### **Step 2: Create Meta Business App**

1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Fill in details:
   - App Name: "JarvisDaily Webhook"
   - Contact Email: your email
5. Click "Create App"

---

### **Step 3: Add WhatsApp Product**

1. In your new app dashboard
2. Click "Add Product"
3. Find "WhatsApp" → Click "Set Up"
4. You'll see WhatsApp Configuration panel

---

### **Step 4: Get Your Access Token**

In WhatsApp Configuration:
1. Go to "API Setup" section
2. Find "Temporary Access Token" (24 hours)
3. OR Generate "Permanent Access Token":
   - Go to Settings → Basic
   - Click "Generate Token"
   - Save this token securely

Add to `.env`:
```
META_WHATSAPP_ACCESS_TOKEN=<your_permanent_token>
```

---

### **Step 5: Setup Webhook Endpoint**

**Option A: Vercel (RECOMMENDED - Already Deployed!)**

You already have Vercel deployed at: `https://your-app.vercel.app`

Update `/api/webhook.js`:

```javascript
// api/webhook.js
export default function handler(req, res) {
  // Handle verification (Meta checks your webhook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  // Handle incoming messages
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          const message = change.value?.messages?.[0];

          if (message) {
            console.log('📩 Received message:', message);

            // Check if Quick Reply button clicked
            if (message.type === 'button' && message.button?.text === '📱 Send Content') {
              handleContentRequest(message.from);
            }
          }
        });
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
  }
}

async function handleContentRequest(phoneNumber) {
  // Load advisor content
  const content = loadAdvisorContent(phoneNumber);

  // Send free-flow messages via Meta API
  await sendFreeFlowText(phoneNumber, content.whatsappMsg);
  await sendFreeFlowText(phoneNumber, content.linkedinPost);
  await sendFreeFlowImage(phoneNumber, content.imageUrl);
}

async function sendFreeFlowText(to, text) {
  await fetch(
    `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    }
  );
}

async function sendFreeFlowImage(to, imageUrl) {
  await fetch(
    `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: { link: imageUrl }
      })
    }
  );
}
```

---

### **Step 6: Register Webhook in Meta Dashboard**

1. In Meta App → WhatsApp → Configuration
2. Find "Webhook" section
3. Click "Edit"
4. Enter:
   - **Callback URL:** `https://your-app.vercel.app/api/webhook`
   - **Verify Token:** Any random string (e.g., "jarvisdaily_webhook_2025")
5. Add to `.env`:
   ```
   WEBHOOK_VERIFY_TOKEN=jarvisdaily_webhook_2025
   ```
6. Click "Verify and Save"

If successful, you'll see ✅ "Verified"

---

### **Step 7: Subscribe to Webhook Fields**

In the same Webhook section:
1. Click "Manage"
2. Subscribe to:
   - ✅ messages
   - ✅ message_status (optional - for delivery confirmation)
3. Click "Save"

---

### **Step 8: Link Your WhatsApp Number**

**CRITICAL STEP:**

You need to tell Meta which WhatsApp number to forward webhooks for.

In Meta App → WhatsApp → API Setup:
1. Find "Phone Numbers" section
2. Your number should already be listed (from AiSensy setup)
3. If NOT listed:
   - You may need to contact AiSensy support
   - Ask: "How do I access my WABA ID for Meta Cloud API direct webhook setup?"

**Alternative:** Check if AiSensy provides API credentials that include:
- WABA ID (WhatsApp Business Account ID)
- Phone Number ID

These should work with Meta's direct API.

---

## 📊 FINAL SETUP SUMMARY

### **Environment Variables (.env):**

```bash
# AiSensy (for SENDING templates)
AISENSY_API_KEY=your_aisensy_key

# Meta Cloud API (for WEBHOOKS & free-flow)
WHATSAPP_PHONE_NUMBER_ID=574744175733556
META_WHATSAPP_ACCESS_TOKEN=your_meta_token
WEBHOOK_VERIFY_TOKEN=jarvisdaily_webhook_2025
```

### **Two APIs Working Together:**

**1. Sending Daily Notification (AiSensy):**
```javascript
// Send utility template via AiSensy
await axios.post('https://backend.aisensy.com/campaign/t1/api/v2', {
  apiKey: AISENSY_API_KEY,
  campaignName: 'Daily_Content_Ready',
  destination: '919765071249',
  templateParams: ['Shriya', 'October 3']
});
```

**2. Receiving Button Click (Meta Webhook):**
```javascript
// Webhook receives button click
// → 24-hour window opens
// → Send free-flow content via Meta API
```

**3. Sending Free-Flow Content (Meta Direct):**
```javascript
// Send via Meta API (FREE within 24-hour window)
await sendFreeFlowText('919765071249', whatsappMessage);
await sendFreeFlowImage('919765071249', imageUrl);
```

---

## ✅ BENEFITS

| Feature | AiSensy Only | AiSensy + Meta Webhook |
|---------|--------------|------------------------|
| **Send Templates** | ✅ Easy | ✅ Easy (via AiSensy) |
| **Receive Messages** | ❌ Enterprise only | ✅ FREE (via Meta) |
| **Free-Flow Messages** | ❌ No | ✅ YES (via Meta) |
| **Button Click Events** | ❌ Enterprise only | ✅ FREE (via Meta) |
| **Cost** | ₹317/month | ₹106/month + FREE webhooks |
| **24-Hour Window** | ❌ No access | ✅ Full access |
| **Webhook Setup** | ❌ Complex/expensive | ✅ FREE & easy |

---

## 🚀 COMPLETE WORKFLOW

```
Day 1, 9 AM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Cron triggers: node send-daily-notification.js
   ↓
2. Send utility template via AiSensy API
   ↓
   Template: "Hi Shriya, your content for Oct 3 is ready"
   Button: [Quick Reply: "📱 Send Content"]
   ↓
3. Advisor receives notification on WhatsApp
   ↓
4. Advisor clicks "📱 Send Content"
   ↓
5. WhatsApp sends message to Meta webhook
   ↓
6. Meta forwards to: https://your-app.vercel.app/api/webhook
   ↓
7. Your webhook handler receives:
   {
     "type": "button",
     "from": "919765071249",
     "button": { "text": "📱 Send Content" }
   }
   ↓
8. 24-HOUR WINDOW OPENS! ✅
   ↓
9. Your handler sends 3 free-flow messages via Meta API:
   • WhatsApp message (text)
   • LinkedIn post (text)
   • Status image (image)
   ↓
10. Advisor receives all content instantly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost: ₹0.88 (one utility template)
Free-flow messages: FREE
Total: ₹0.88/advisor/day = ₹26/month per advisor
```

---

## ⚠️ POTENTIAL ISSUE & SOLUTION

### **Issue: AiSensy May Not Share WABA Credentials**

Some BSPs (like AiSensy) don't give direct access to underlying WABA (WhatsApp Business Account) credentials.

**Solution 1: Ask AiSensy Support**
Contact: support@aisensy.com
Ask: "I need WABA ID and Phone Number ID for Meta Cloud API webhook integration. Can you provide these?"

**Solution 2: Create Your Own WABA (FREE)**
1. Go to Meta Business Manager
2. Create new WhatsApp Business Account (FREE)
3. Register a NEW phone number
4. Use this for webhooks
5. Keep AiSensy for template sending on ORIGINAL number

**Solution 3: Migrate to Meta Direct (Long-term)**
- Move completely off AiSensy
- Use Meta Cloud API for everything
- More control, same cost, better features
- But requires more technical setup

---

## 🎯 RECOMMENDED APPROACH

### **Phase 1: Test with Meta Webhooks (This Week)**

1. ✅ Create Meta Business App
2. ✅ Setup webhook endpoint (Vercel - already have!)
3. ✅ Request WABA credentials from AiSensy
4. ✅ Test with your number (919765071249)

### **Phase 2: Production (Next Week)**

1. ✅ Create utility template with Quick Reply button
2. ✅ Send via AiSensy API
3. ✅ Receive button clicks via Meta webhook
4. ✅ Send free-flow content via Meta API

### **Phase 3: Scale (Future)**

1. ✅ Works for 1000s of advisors
2. ✅ No additional webhook costs
3. ✅ Full control over message flow

---

## 💡 ANSWER TO YOUR QUESTION

**"Can we implement webhook without AiSensy?"**

**YES! Use Meta Cloud API Direct Webhooks:**

✅ **FREE** (no AiSensy Enterprise plan needed)
✅ **Easy** (Vercel endpoint already deployed)
✅ **Works with AiSensy** (use both together)
✅ **Full control** (access all webhook events)
✅ **Scalable** (handles unlimited advisors)

**Next Step:**
Contact AiSensy support for WABA credentials, OR create a test Meta WABA to start experimenting today.

---

**Want me to help you set this up?** 🚀
