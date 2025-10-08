# Pre-Launch Checklist - Before Running /o Command

**Date**: October 7, 2025
**Purpose**: Verify complete end-to-end flow before content generation

---

## Current Setup Summary

### WhatsApp Delivery Flow
```
Content Generated → AiSensy Utility Message → Dashboard URL → Advisor Logs In → Content Displayed
```

### Key URLs
- **Dashboard**: `https://jarvisdaily.com/dashboard`
- **URL Format**: `https://jarvisdaily.com/dashboard?phone=919765071249`
- **AiSensy API**: `https://api.aisensy.com`

---

## ✅ Verification Checklist

### 1. AiSensy Setup
- [ ] **API Key Valid**: Check if AISENSY_API_KEY in `.env` is working
- [ ] **WhatsApp Number**: 918062524496 (configured)
- [ ] **Template Approved**: Utility template must be approved by Meta
- [ ] **Template Name**: What is the approved template name?
- [ ] **Test Send**: Send 1 test message to verify delivery

**Current Status**: ❌ API calls failing ("fetch failed")

**Action Needed**:
```bash
# Test AiSensy API connection
node scripts/test-aisensy-connection.js

# Check template status
node scripts/check-aisensy-templates.js
```

---

### 2. Dashboard/Login Flow
- [ ] **Domain Live**: Is jarvisdaily.com deployed?
- [ ] **Dashboard Route**: Does `/dashboard` route exist?
- [ ] **Login System**: Clerk authentication working?
- [ ] **Phone Auth**: Can advisors login with phone number?
- [ ] **Content Display**: Does dashboard show generated content?

**Current Status**: ⚠️ Unknown - needs testing

**Action Needed**:
```bash
# Check if site is live
curl -I https://jarvisdaily.com/dashboard

# Or visit in browser:
open https://jarvisdaily.com/dashboard?phone=919765071249
```

---

### 3. Content Storage/Retrieval
- [ ] **Content Database**: Where is generated content stored?
  - Option A: Local files in `output/session_*/`
  - Option B: Database (which one?)
  - Option C: Cloud storage (S3/Vercel Blob?)

- [ ] **Dashboard Access**: How does dashboard fetch content?
  - Option A: API endpoint (`/api/content?phone=XXX`)
  - Option B: Direct database query
  - Option C: Webhook triggers

**Current Status**: ⚠️ Unknown - needs clarification

---

### 4. Complete End-to-End Flow

**Step-by-Step Verification**:

#### Step 1: Content Generation (Local)
```bash
# Run /o command
/o

# Expected output:
output/session_XXXXX/
├── linkedin/text/ADV001_post.txt
├── whatsapp/text/ADV001_msg.txt
└── images/status/ADV001_image.png
```

#### Step 2: Content Upload (if needed)
```bash
# If using cloud storage
node scripts/upload-to-storage.js session_XXXXX

# Or if using database
node scripts/save-to-database.js session_XXXXX
```

#### Step 3: Send WhatsApp Notification
```bash
# Send AiSensy utility message
node scripts/send-aisensy.js

# Expected: Advisor receives WhatsApp with URL
# Message: "Hi {name}, your content for {date} is ready! View Now"
# Button: "View Content" → https://jarvisdaily.com/dashboard?phone=XXX
```

#### Step 4: Advisor Clicks URL
```
1. Opens https://jarvisdaily.com/dashboard?phone=919765071249
2. If not logged in → Redirects to /sign-in
3. After login → Back to /dashboard
4. Dashboard shows:
   - LinkedIn post (copy button)
   - WhatsApp message (copy button)
   - Status image (download button)
```

#### Step 5: Advisor Copies Content
```
- Click "Copy LinkedIn Post" → Copies to clipboard
- Click "Copy WhatsApp Message" → Copies to clipboard
- Click "Download Image" → Saves ADV001_image.png
```

---

## 🔧 What Needs to Be Fixed

### Issue 1: AiSensy API Failing
**Error**: `fetch failed`

**Possible Causes**:
1. API key expired
2. Template not approved
3. Network/firewall issue
4. Wrong API endpoint

**Solution**:
```bash
# Test with curl
curl -X POST https://api.aisensy.com/campaign-manager/api/v1/campaign/t1/api/v2 \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "YOUR_API_KEY", "destination": "919765071249"}'

# Check response
```

### Issue 2: Dashboard Not Verified
**Unknown**: Is the dashboard live and working?

**Solution**:
```bash
# Check if deployed
vercel ls

# Check logs
vercel logs

# Visit dashboard
open https://jarvisdaily.com/dashboard
```

### Issue 3: Content Flow Unclear
**Unknown**: How does content get from `output/` to dashboard?

**Solution**: Need to clarify:
1. Is there an upload script?
2. Is there a database integration?
3. Is content stored locally or remotely?

---

## 📋 Testing Protocol

### Test 1: Manual AiSensy Send (Single Advisor)
```bash
# Create test script
cat > scripts/test-single-send.js << 'EOF'
const { sendUtilityMessage } = require('./send-aisensy');

// Test with your own number
sendUtilityMessage('919765071249', 'Test Advisor')
  .then(result => console.log('Result:', result))
  .catch(err => console.error('Error:', err));
EOF

# Run test
node scripts/test-single-send.js
```

**Expected**: WhatsApp message received with dashboard link

### Test 2: Dashboard Login
```bash
# Visit dashboard
open https://jarvisdaily.com/dashboard?phone=919765071249

# Check:
1. Does it load?
2. Does it redirect to login?
3. Can you login with phone?
4. Does dashboard show anything?
```

### Test 3: End-to-End (With 1 Advisor)
```bash
# 1. Generate content for 1 advisor only
# (modify data/advisors.json to have only 1 active advisor)

# 2. Run /o command
/o

# 3. Send WhatsApp notification
node scripts/send-aisensy.js

# 4. Check WhatsApp (use your phone)
# 5. Click link
# 6. Verify content displays
```

---

## ✅ Recommended Actions (In Order)

### Priority 1: Fix AiSensy Connection
1. Check API key validity
2. Verify template approval status
3. Test single message send
4. Fix any API errors

### Priority 2: Verify Dashboard
1. Confirm jarvisdaily.com is live
2. Test `/dashboard` route
3. Test login flow (Clerk)
4. Verify content can be displayed

### Priority 3: Test Storage Flow
1. Clarify where content is stored
2. Implement upload script if needed
3. Create API endpoint for dashboard to fetch content
4. Test retrieval

### Priority 4: End-to-End Test
1. Run `/o` with 1 advisor
2. Send AiSensy notification
3. Click link on phone
4. Verify content display
5. Test copy/download buttons

### Priority 5: Scale to All Advisors
1. Once tested with 1 advisor, enable all 4
2. Run full `/o` pipeline
3. Send to all active advisors
4. Monitor delivery success rate

---

## 🚨 Blockers Before Running /o

**MUST FIX BEFORE RUNNING /O**:

1. ❌ **AiSensy API not working** - Cannot send notifications
2. ⚠️ **Dashboard not verified** - Advisors may get broken link
3. ⚠️ **Content storage unclear** - Generated content may not reach dashboard

**RECOMMENDATION**:
**DO NOT run `/o` yet**. First:
1. Fix AiSensy connection
2. Test dashboard manually
3. Verify content flow
4. Test with 1 advisor end-to-end
5. THEN scale to all advisors

---

## 💡 Quick Fixes

### Fix 1: Test Dashboard Now
```bash
# Open in browser
open https://jarvisdaily.com/dashboard?phone=919765071249

# What should you see?
- Login page (if not logged in)
- Dashboard (if logged in)
- Error page (if broken)
```

### Fix 2: Check AiSensy Template
```bash
# List templates
node scripts/check-aisensy-templates.js

# Or check in AiSensy dashboard:
# https://app.aisensy.com/templates
```

### Fix 3: Test with Test Advisor
```json
// data/test-advisor.json
[
  {
    "id": "TEST001",
    "name": "Your Name",
    "phone": "YOUR_PHONE_NUMBER",
    "activeSubscription": true
  }
]
```

```bash
# Modify send-aisensy.js to use test-advisor.json
# Send to yourself first
node scripts/send-aisensy.js --test
```

---

## Summary

**Current Status**: 🔴 **NOT READY**

**Issues**:
- AiSensy API failing
- Dashboard not verified
- Content flow unclear

**Next Step**:
1. **Test dashboard manually first** (visit https://jarvisdaily.com/dashboard)
2. **Fix AiSensy connection**
3. **Test with 1 advisor end-to-end**
4. **THEN run `/o` for all advisors**

**DO NOT PROCEED WITH `/o` UNTIL ABOVE ISSUES RESOLVED**

---

**Questions to Answer**:
1. Is jarvisdaily.com/dashboard live? ✅/❌
2. Can you login with phone number? ✅/❌
3. Is AiSensy template approved? ✅/❌
4. Where is content stored? Local/DB/Cloud?
5. How does dashboard get content? API/Query/Webhook?
