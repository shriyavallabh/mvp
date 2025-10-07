# 🚀 STEP-BY-STEP: Meta WhatsApp API Setup & Testing

## Complete guide from scratch to working WhatsApp delivery (30-45 minutes)

---

## 📋 PREREQUISITES

Before starting, have ready:
- ✅ Facebook account (personal)
- ✅ Valid email address
- ✅ Phone number for verification
- ✅ Vercel deployment URL (your webhook endpoint)
- ✅ 1 test phone number (your own WhatsApp)

---

# PART 1: CREATE META BUSINESS ACCOUNT (5 minutes)

## Step 1.1: Go to Meta Business Suite

1. Open browser
2. Go to: **https://business.facebook.com**
3. Click **"Create Account"** (blue button, top right)

## Step 1.2: Fill Business Details

You'll see a form with 3 fields:

**Field 1: Business name**
```
Enter: JarvisDaily
```

**Field 2: Your name**
```
Enter: [Your full name]
```

**Field 3: Work email**
```
Enter: [Your business email]
```

4. Click **"Next"**

## Step 1.3: Add Business Details

**Business address:**
```
Enter your business address or home address
(doesn't need to be registered office)
```

**Business phone number:**
```
Enter: [Your phone number with country code]
Example: +919765071249
```

**Website (optional):**
```
Enter: jarvisdaily.com
(or leave blank if you don't have)
```

5. Click **"Submit"**

## Step 1.4: Verify Email

1. Check your email inbox
2. Find email from "Meta Business Suite"
3. Click **"Verify Email"** button
4. You'll be redirected back to Meta Business Suite

✅ **Business Account Created!**

You should now see Meta Business Suite dashboard with:
- Business name "JarvisDaily" at top
- Left sidebar with menu items
- Main area showing "Get Started" guides

---

# PART 2: CREATE META APP (10 minutes)

## Step 2.1: Go to Meta for Developers

1. Open new tab
2. Go to: **https://developers.facebook.com/apps**
3. Click **"Create App"** (green button, top right)

## Step 2.2: Choose App Type

You'll see 4 options:

1. **Consumer** - for social experiences
2. **Business** - for business tools ← **CHOOSE THIS**
3. **Gaming** - for games
4. **None** - for testing

✅ Click **"Business"** → Click **"Next"**

## Step 2.3: Add App Details

**Display name:**
```
Enter: JarvisDaily WhatsApp
```

**App contact email:**
```
Enter: [Your email]
```

**Business Account:**
```
Select: JarvisDaily
(This is the business you created in Part 1)
```

**Do not** check "I don't have a Business Manager account"

Click **"Create App"**

## Step 2.4: Security Check

Meta might ask you to verify your Facebook password:
1. Enter your Facebook password
2. Click **"Submit"**

⏳ Wait 5-10 seconds while app is created...

✅ **App Created!**

You should now see:
- App Dashboard
- App ID displayed at top
- Empty dashboard with "Add products to get started"

---

# PART 3: ADD WHATSAPP PRODUCT (5 minutes)

## Step 3.1: Add WhatsApp Product

On App Dashboard, you'll see product cards:

1. Scroll down or search for **"WhatsApp"** card
2. Click **"Set Up"** button on WhatsApp card

⏳ Wait while WhatsApp product is added...

You'll be redirected to **"WhatsApp Getting Started"** page

## Step 3.2: Choose Phone Number Option

You'll see two options:

**Option A: Use a test number (Meta provides)**
- ✅ FREE
- ✅ Instant setup
- ✅ Good for testing
- ❌ Shows "Test" badge in WhatsApp
- ❌ Can only send to 5 verified numbers

**Option B: Add your business phone**
- ✅ Professional (no test badge)
- ⚠️ Need to verify ownership
- ⚠️ Number can't be used on WhatsApp Business app

### For Testing: Choose Option A (Test Number)

1. Click **"Use the test number provided by Meta"**
2. Click **"Continue"**

You'll see:
```
Test number assigned: +1 555 XXX XXXX
Phone number ID: 123456789012345
```

✅ **Copy this Phone Number ID** - you'll need it later!

## Step 3.3: Add Test Recipient (Your WhatsApp Number)

In the "Send and receive messages" section:

1. Find **"To:"** field
2. Enter your WhatsApp number with country code:
   ```
   Example: +919765071249
   ```
3. Click **"Send message"** button

You should receive a test message on your WhatsApp!

✅ If you got the message, your setup is working!

---

# PART 4: GET ACCESS TOKEN (5 minutes)

## Step 4.1: Generate Temporary Token

Still on the "WhatsApp Getting Started" page:

1. Scroll down to **"Temporary access token"** section
2. Click **"Generate token"** button (if not already visible)

You'll see a long token displayed:
```
EAAO6D1N... [long string of characters]
```

⚠️ **IMPORTANT**: This token expires in 24 hours!

3. Click **"Copy"** button next to token
4. Save this token somewhere safe temporarily

## Step 4.2: Generate Permanent Token (RECOMMENDED)

For production, you need a permanent token:

1. In left sidebar, click **"Business Settings"** (or go to https://business.facebook.com/settings)
2. In left menu, scroll down to **"Users"** section
3. Click **"System Users"**
4. Click **"Add"** button (blue, top right)

**Create System User:**
```
System user name: JarvisDaily System User
System user role: Admin
```

5. Click **"Create system user"**

**Generate Token:**

6. Find your new system user in the list
7. Click **"Generate New Token"** button
8. In popup:
   - App: Select **"JarvisDaily WhatsApp"**
   - Token Expiration: Select **"Never"**
   - Permissions: Check these boxes:
     ☑️ whatsapp_business_messaging
     ☑️ whatsapp_business_management

9. Click **"Generate Token"**
10. **COPY THIS TOKEN** and save it securely!

⚠️ **You won't see this token again!** Store it safely.

✅ **Permanent Access Token Generated!**

---

# PART 5: GET APP SECRET (2 minutes)

## Step 5.1: Find App Secret

1. Go back to your App Dashboard: https://developers.facebook.com/apps
2. Select **"JarvisDaily WhatsApp"** app
3. In left sidebar, click **"Settings"** → **"Basic"**

You'll see:
```
App ID: 123456789012345
App Secret: [Hidden - Click "Show"]
```

4. Click **"Show"** button next to App Secret
5. Enter your Facebook password if prompted
6. **Copy the App Secret** and save it

✅ **App Secret Retrieved!**

---

# PART 6: CONFIGURE WEBHOOK (10 minutes)

## Step 6.1: Deploy Webhook to Vercel (if not done)

Your webhook is already at `/api/webhook.js`

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Copy your Vercel URL:
```
Example: https://your-app-name.vercel.app
```

## Step 6.2: Set Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left menu
5. Add these variables:

**Variable 1:**
```
Name: WHATSAPP_PHONE_NUMBER_ID
Value: [Phone Number ID from Step 3.2]
```

**Variable 2:**
```
Name: WHATSAPP_ACCESS_TOKEN
Value: [Permanent token from Step 4.2]
```

**Variable 3:**
```
Name: WHATSAPP_WEBHOOK_VERIFY_TOKEN
Value: finadvise-webhook-2024
(You can choose any string - just remember it!)
```

**Variable 4:**
```
Name: WHATSAPP_APP_SECRET
Value: [App Secret from Step 5.1]
```

6. Click **"Save"** for each variable

7. Redeploy:
```bash
vercel --prod
```

✅ **Environment Variables Set!**

## Step 6.3: Configure Webhook in Meta

1. Go to App Dashboard: https://developers.facebook.com/apps
2. Select **"JarvisDaily WhatsApp"** app
3. In left sidebar: **WhatsApp** → **Configuration**

You'll see **"Webhook"** section:

4. Click **"Edit"** button

**Configure Webhook:**

**Callback URL:**
```
https://your-app-name.vercel.app/api/webhook
```

**Verify Token:**
```
finadvise-webhook-2024
(Must match what you set in Vercel env vars!)
```

5. Click **"Verify and Save"**

⏳ Meta will send a GET request to verify your webhook...

✅ **If successful, you'll see**: "Webhook verified" with green checkmark

❌ **If failed**: Check that:
- Callback URL is correct (no trailing slash)
- Verify token matches exactly
- Vercel deployment is live
- Environment variables are set

## Step 6.4: Subscribe to Messages

Still in Configuration page, under **"Webhook fields"**:

1. Find **"messages"** field
2. Click **"Subscribe"** button

✅ **Webhook Configured!**

---

# PART 7: UPDATE LOCAL .env FILE (2 minutes)

## Step 7.1: Edit .env File

Open `/Users/shriyavallabh/Desktop/mvp/.env` and update:

```bash
# Meta WhatsApp Cloud API (Direct)
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_ACCESS_TOKEN=EAAO6D1N...your_permanent_token...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=finadvise-webhook-2024
WHATSAPP_APP_SECRET=abc123def456...your_app_secret...
```

**Where to find each value:**
- Phone Number ID: Step 3.2 (WhatsApp Getting Started page)
- Business Account ID: In Meta Business Suite → Business Settings → WhatsApp Accounts
- Access Token: Step 4.2 (permanent token you generated)
- Webhook Verify Token: What you chose in Step 6.2 (e.g., finadvise-webhook-2024)
- App Secret: Step 5.1 (App Settings → Basic)

✅ **.env File Updated!**

---

# PART 8: CREATE WHATSAPP TEMPLATE (15 minutes)

## Step 8.1: Run Template Creation Script

```bash
cd /Users/shriyavallabh/Desktop/mvp
node create-template-meta-direct.js
```

**Expected Output:**
```
🚀 Creating template via Meta Cloud API (no AiSensy)
============================================================

📋 Template Details:
Name: daily_content_unlock_v5_meta
Category: UTILITY
Language: en
Variables: {{1}} = name, {{2}} = date
Button: Quick Reply (opens 24-hour window)

⏳ Submitting to Meta...

✅ Template created successfully!

Template ID: 1234567890
Status: PENDING

⏰ Approval Timeline:
   • Usually approved in 1-2 hours
   • Check status: https://business.facebook.com
   • You'll receive email when approved
```

✅ **Template Submitted!**

## Step 8.2: Wait for Approval

⏳ **Typical approval time: 1-2 hours**

You'll receive email from Meta:
```
Subject: Your WhatsApp message template has been approved
```

**While waiting**, you can:
- Take a break ☕
- Continue with webhook testing (Part 9)
- Check status at: https://business.facebook.com → WhatsApp → Message Templates

---

# PART 9: TEST WEBHOOK (5 minutes)

## Step 9.1: Test Webhook Verification

Open terminal and run:

```bash
curl "https://your-app-name.vercel.app/api/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=finadvise-webhook-2024"
```

**Expected Response:**
```
test123
```

✅ **If you see "test123"**: Webhook verification works!
❌ **If you see error**: Check Vercel env vars and redeploy

## Step 9.2: Test Webhook is Receiving Events

Send a test message from Meta:

1. Go to App Dashboard → WhatsApp → Getting Started
2. In "Send and receive messages" section
3. Click **"Send message"** to your test number

Then check Vercel logs:

```bash
vercel logs --follow
```

**Expected Logs:**
```
🎯 Webhook POST request received at /webhook
📱 POST received at webhook
📱 Message from: +919765071249
```

✅ **If you see logs**: Webhook is receiving events!

---

# PART 10: TEST SENDING MESSAGE (After Template Approved)

⏳ **WAIT** until template is approved (check email)

## Step 10.1: Update Advisor Phone in Script

Edit `send-via-meta-direct.js`:

```javascript
const advisors = [
    // Test with just YOUR number first
    { name: 'Your Name', phone: '919765071249' }  // Your WhatsApp number
];
```

## Step 10.2: Send Test Message

```bash
node send-via-meta-direct.js
```

**Expected Output:**
```
🚀 JarvisDaily - Send via Meta Cloud API Direct
============================================================
📅 Date: Oct 4, 2024
📱 Template: daily_content_unlock_v5_meta
👥 Recipients: 1 advisors
============================================================

📤 Sending to Your Name (919765071249)...
✅ Success! Message ID: wamid.HBgLO...

============================================================
📊 DELIVERY SUMMARY
============================================================
✅ Successful: 1/1
❌ Failed: 0/1
```

✅ **Check your WhatsApp** - you should receive:

```
Hi [Your Name], your JarvisDaily content for Oct 4, 2024 is ready!

Tap below to receive:
✅ WhatsApp message (share with clients)
✅ LinkedIn post (copy-paste ready)
✅ Status image (download & post)

[Button: 📱 Send Content]

JarvisDaily - AI-powered content
```

---

# PART 11: TEST BUTTON CLICK & WEBHOOK DELIVERY (Final Test!)

## Step 11.1: Click the Button

In your WhatsApp, click the **"📱 Send Content"** button

## Step 11.2: Watch Webhook Logs

In terminal, monitor Vercel logs:

```bash
vercel logs --follow
```

**Expected Logs:**
```
🎯 Webhook POST request received at /webhook
📱 Message from: Your Name (919765071249)
📝 Message type: interactive
🔘 BUTTON CLICKED - Sending content!
🎯 sendContentPackage called for: Your Name
🚀 Sending content package to Your Name
📦 Messages to send: 2
✅ whatsapp_message sent: Success
✅ linkedin_post sent: Success
📦 Content package delivered to Your Name!
```

## Step 11.3: Check WhatsApp

You should receive 2-3 messages:

**Message 1: WhatsApp Message**
```
📱 WhatsApp Message (ready to forward):

[Your generated WhatsApp message content from latest session]
```

**Message 2: LinkedIn Post**
```
💼 LinkedIn Post (copy-paste ready):

[Your generated LinkedIn post content from latest session]
```

**Message 3: Status Image Info**
```
📸 WhatsApp Status Image:

Your branded status image is ready!

📁 Session: session_1234567890
💾 Download from dashboard or contact admin for delivery.

✅ All content generated with Grammy-level virality standards.
```

✅ **SUCCESS!** Your complete flow is working:

1. ✅ Template sent via Meta API
2. ✅ User receives template in WhatsApp
3. ✅ User clicks button
4. ✅ Webhook receives click event
5. ✅ Free-flow messages sent automatically
6. ✅ User receives all content in WhatsApp

---

# 🎉 CONGRATULATIONS!

You've successfully set up:
- ✅ Meta Business Account
- ✅ Meta App with WhatsApp
- ✅ Permanent Access Token
- ✅ Webhook on Vercel
- ✅ WhatsApp Template (approved)
- ✅ Complete message flow

**Cost: ₹0/month (vs ₹2,399 with AiSensy)** 🎉

---

# PART 12: PRODUCTION DEPLOYMENT

## Step 12.1: Add All 4 Advisors

Edit `send-via-meta-direct.js`:

```javascript
const advisors = [
    { name: 'Shruti Petkar', phone: '919673758777' },
    { name: 'Vidyadhar Petkar', phone: '918975758513' },
    { name: 'Shriya Vallabh Petkar', phone: '919765071249' },
    { name: 'Mr. Tranquil Veda', phone: '919022810769' }
];
```

## Step 12.2: Verify All Numbers Can Receive (Test Number Limitation)

⚠️ **If using Meta Test Number**: You can only send to 5 verified phone numbers.

**To add more recipients:**

1. Go to App Dashboard → WhatsApp → Getting Started
2. Find "To:" field
3. Enter each advisor's number
4. Click "Send message"
5. This verifies the number

OR

**Switch to Production Number** (see Step 3.2 Option B)

## Step 12.3: Schedule Daily Automation

Add to PM2 or crontab:

```bash
# PM2 (recommended)
pm2 start ecosystem.config.js

# Or crontab
0 9 * * * cd /path/to/mvp && node send-via-meta-direct.js
```

## Step 12.4: Monitor for 1 Week

```bash
# Check delivery daily
vercel logs --follow

# Track costs
# Each send = ₹0.22 × 4 advisors = ₹0.88/day = ₹26/month
```

---

# TROUBLESHOOTING

## Template Creation Failed

**Error: "Invalid access token"**
```
Fix: Regenerate token in Step 4.2
Update .env and Vercel env vars
```

**Error: "Template name already exists"**
```
Fix: Change template name to v6, v7, etc.
Edit create-template-meta-direct.js
```

## Message Sending Failed

**Error: "(#131030) Recipient phone number not in allowed list"**
```
Fix: Using test number - add recipient in Meta Dashboard
Go to WhatsApp → Getting Started → "To:" field → Add number
```

**Error: "Template not found"**
```
Fix: Wait for template approval
Check email or business.facebook.com
```

## Webhook Not Receiving

**Error: Webhook verification failed**
```
Fix: Check verify token matches in:
- Meta App webhook configuration
- Vercel environment variable
- Local .env file
```

**Webhook receives but no messages sent**
```
Fix: Check webhook.js has correct advisors
Check ACCESS_TOKEN is valid
Check Vercel logs for errors
```

---

# NEXT STEPS

1. ✅ Test complete flow with all 4 advisors
2. ✅ Monitor for 1 week
3. ✅ If everything works: Cancel AiSensy subscription
4. ✅ Save ₹2,399/month = ₹28,788/year
5. ✅ Scale to 100+ advisors as needed

---

# USEFUL COMMANDS

```bash
# Create template
node create-template-meta-direct.js

# Send to advisors
node send-via-meta-direct.js

# Check Meta limits
node check-meta-limits.js

# Monitor webhook
vercel logs --follow

# Redeploy webhook
vercel --prod

# Test webhook verification
curl "https://your-app.vercel.app/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=YOUR_TOKEN"
```

---

# SUPPORT RESOURCES

- Meta WhatsApp Docs: https://developers.facebook.com/docs/whatsapp
- Meta Business Help: https://business.facebook.com/help
- Vercel Docs: https://vercel.com/docs
- Your webhook code: `/api/webhook.js`

---

**Total Setup Time: 30-45 minutes**
**Cost: ₹0/month + ₹0.22/message**
**Savings vs AiSensy: ₹28,788/year**

🎯 **You did it!** No more AiSensy needed!
