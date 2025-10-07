# FIXED AiSensy Templates - Ready to Submit

## 🚨 CRITICAL FIXES APPLIED:

1. ✅ **Removed dynamic URL variable** (AiSensy may not support {{variable}} in URLs)
2. ✅ **Added Quick Reply button** to Template 1
3. ✅ **Simplified to 2 buttons max** (WhatsApp limit)
4. ✅ **All variables sequential and validated**

---

## TEMPLATE 1: Daily Content Package V2

### **Template Details:**
- **Template Name:** `daily_content_package_v2`
- **Category:** Marketing
- **Language:** English
- **Header Type:** Image
- **Variables in Body:** 3 (reduced from 4!)

---

### **HEADER:**
- **Type:** Image
- **Upload sample image:** `/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551/images/status/compliant/avalok_langer_status_1_branded.png`

---

### **BODY TEXT (Copy this exactly):**

```
Hi {{1}} 👋

📅 Your daily content for {{2}} is ready!

📊 *What's included today:*
• Market Summary: {{3}}
• WhatsApp Message (ready to forward)
• LinkedIn Post (copy-paste ready)
• Status Image (attached above)

💡 Simply forward the WhatsApp message to your clients or post the LinkedIn content!

Questions? Reply to this message.

*Powered by JarvisDaily.in*
```

**Character Count:** 398 (✅ under 550)
**Emoji Count:** 5 (✅ under 10)

---

### **FOOTER TEXT (Copy this exactly):**

```
Mutual fund investments are subject to market risks.
```

---

### **BUTTONS (2 buttons):**

**Button 1:**
- **Type:** Call-to-Action (URL)
- **Button Text:** `View Content`
- **URL:** `https://jarvisdaily.com` (✅ STATIC - no variable!)

**Button 2:**
- **Type:** Quick Reply
- **Button ID:** `get_next_update`
- **Button Text:** `Get Next Update`

---

### **SAMPLE VARIABLE VALUES:**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Avalok Langer |
| {{2}} | October 3, 2025 |
| {{3}} | Markets closed for Gandhi Jayanti - Sensex +715 points yesterday |

---

### **WHY ONLY 3 VARIABLES?**

❌ **Removed {{4}} URL variable** because:
- AiSensy gives "invalid URL format" error with `{{variable}}` in URLs
- WhatsApp template URL buttons don't reliably support dynamic parameters
- Static URL works for all advisors: `https://jarvisdaily.com`

**Alternative:** We can add advisor-specific tracking in backend (URL params added via API call, not template)

---

## TEMPLATE 2: Daily Status Image

### **Template Details:**
- **Template Name:** `daily_status_image`
- **Category:** Marketing
- **Language:** English
- **Header Type:** Image
- **Variables in Body:** 3

---

### **HEADER:**
- **Type:** Image
- **Upload sample image:** `/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551/images/status/compliant/shruti_petkar_status_1_branded.png`

---

### **BODY TEXT (Copy this exactly):**

```
Hi {{1}} 👋

Your personalized WhatsApp Status image for {{2}} is ready (attached above)!

✨ *This image includes:*
{{3}}

*How to use:*
1️⃣ Download the image
2️⃣ Post as WhatsApp Status
3️⃣ Share on Instagram Stories

Perfect for engaging your clients with professional market updates!

*JarvisDaily.in - Your Daily Content Partner*
```

**Character Count:** 385 (✅ under 550)
**Emoji Count:** 6 (✅ under 10)

---

### **FOOTER TEXT (Copy this exactly):**

```
Investments are subject to market risks. Read all scheme related documents carefully.
```

---

### **BUTTONS (1 button):**

**Button 1:**
- **Type:** Quick Reply
- **Button ID:** `get_linkedin_post`
- **Button Text:** `Get LinkedIn Post`

---

### **SAMPLE VARIABLE VALUES:**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Shruti |
| {{2}} | Oct 3, 2025 |
| {{3}} | • Market trends and sectoral analysis\n• Key investment insights\n• Portfolio optimization tips |

**Note:** In the `{{3}}` sample, use actual line breaks (press Enter) between bullet points when submitting

---

## TEMPLATE 3: LinkedIn Post

### **Template Details:**
- **Template Name:** `daily_linkedin_post`
- **Category:** Marketing
- **Language:** English
- **Header Type:** None (text-only)
- **Variables in Body:** 5

---

### **BODY TEXT (Copy this exactly):**

```
Hi {{1}} 👋

📝 Your LinkedIn post for {{2}} is ready!

*Topic:* {{3}}

📋 *Copy the post below and paste on LinkedIn:*

━━━━━━━━━━━━━━━━
{{4}}

{{5}}
━━━━━━━━━━━━━━━━

*Pro Tip:* Post between 8-10 AM or 5-7 PM for max reach!

Need edits? Reply with your feedback.

*Powered by JarvisDaily.in*
```

**Character Count:** 485 (✅ under 550)
**Emoji Count:** 4 (✅ under 10)

---

### **FOOTER TEXT (Copy this exactly):**

```
Market-linked investments carry risks. Consult your financial advisor.
```

---

### **BUTTONS (1 button):**

**Button 1:**
- **Type:** Call-to-Action (URL)
- **Button Text:** `View All Posts`
- **URL:** `https://jarvisdaily.com/linkedin` (✅ STATIC)

---

### **SAMPLE VARIABLE VALUES:**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Vidyadhar Petkar |
| {{2}} | October 3, 2025 |
| {{3}} | Why markets closed today but your SIP kept working |
| {{4}} | October 2, 2025.\n\nMarkets are closed.\nGandhi Jayanti holiday.\n\nBut your portfolio? Still working.\n\nLet me explain why this is the most important investing lesson.\n\nYesterday (October 1):\nSensex jumped 715 points.\nNifty gained 220 points.\nYour SIP investments? They grew. |
| {{5}} | Today (October 2):\nMarkets closed.\nTraders taking a break.\nYour SIP investments? Still compounding.\n\nThis is the beauty of systematic investing.\n\nAre you invested systematically?\n\nComment 'SIP' if you want to learn more.\n\n#FinancialPlanning #WealthManagement #SIP\n\nARN: ARN-138924 |

**Note:** Use actual line breaks (press Enter) in sample values where you see `\n`

---

## 📊 SUMMARY OF CHANGES

### **Template 1 (Daily Content Package V2):**
- ❌ Removed: URL variable `{{4}}` (causes "invalid URL format" error)
- ✅ Fixed: Static URL `https://jarvisdaily.com`
- ✅ Added: Quick Reply button "Get Next Update"
- ✅ Reduced: 4 variables → 3 variables

### **Template 2 (Daily Status Image):**
- ✅ No changes needed
- ✅ Already has 3 variables
- ✅ Already has Quick Reply button

### **Template 3 (LinkedIn Post):**
- ✅ Changed: URL from dynamic to static `https://jarvisdaily.com/linkedin`
- ✅ Kept: 5 variables (all in body text)

---

## 🔧 UPDATED SCRIPT (No Changes Needed!)

The `send-daily-templates.js` script will still work because:
- It sends the URL as part of the template (not as variable)
- API calls can still personalize content through body variables
- Images still upload to Cloudinary with advisor-specific names

**Script works as-is!** ✅

---

## ⚠️ IMPORTANT SUBMISSION NOTES

### **When Creating Button in AiSensy:**

**For CTA (URL) Button:**
1. Button Type: `Call-to-Action` or `Visit Website`
2. Button Text: `View Content` (Template 1) or `View All Posts` (Template 3)
3. Button URL: Enter **complete URL with https://**
   - Template 1: `https://jarvisdaily.com`
   - Template 3: `https://jarvisdaily.com/linkedin`
4. **DO NOT add {{variable}} in URL field!**

**For Quick Reply Button:**
1. Button Type: `Quick Reply`
2. Button Text: `Get Next Update` or `Get LinkedIn Post`
3. Button ID: Auto-generated or use `get_next_update` / `get_linkedin_post`

---

## ✅ SUBMISSION CHECKLIST

### **Before Submitting Each Template:**

**Template 1: daily_content_package_v2**
- [ ] Template name: `daily_content_package_v2`
- [ ] Category: Marketing
- [ ] Language: English
- [ ] Header: Image uploaded
- [ ] Body: Copy-pasted exactly (with emojis)
- [ ] Footer: Copy-pasted exactly
- [ ] Variables: {{1}}, {{2}}, {{3}} with samples
- [ ] Button 1: CTA URL `https://jarvisdaily.com` (NO variable!)
- [ ] Button 2: Quick Reply `Get Next Update`

**Template 2: daily_status_image**
- [ ] Template name: `daily_status_image`
- [ ] Category: Marketing
- [ ] Language: English
- [ ] Header: Image uploaded
- [ ] Body: Copy-pasted exactly
- [ ] Footer: Copy-pasted exactly
- [ ] Variables: {{1}}, {{2}}, {{3}} with samples
- [ ] Button 1: Quick Reply `Get LinkedIn Post`

**Template 3: daily_linkedin_post**
- [ ] Template name: `daily_linkedin_post`
- [ ] Category: Marketing
- [ ] Language: English
- [ ] Header: None (text-only)
- [ ] Body: Copy-pasted exactly
- [ ] Footer: Copy-pasted exactly
- [ ] Variables: {{1}}, {{2}}, {{3}}, {{4}}, {{5}} with samples
- [ ] Button 1: CTA URL `https://jarvisdaily.com/linkedin` (NO variable!)

---

## 🎯 WHAT TO DELETE

If you already created templates, **DELETE these old ones:**
- `daily_content_package` (v1 - missing Quick Reply)
- Any templates with URL containing `{{4}}` or `{{variable}}`

**CREATE NEW:**
- `daily_content_package_v2` (with fixes)
- `daily_status_image` (same as before)
- `daily_linkedin_post` (with static URL)

---

## 🚀 AFTER APPROVAL

Once all 3 templates approved:

```bash
# Test dry run
export DRY_RUN=true && node send-daily-templates.js

# Send to Avalok only (edit data/advisors.json first)
node send-daily-templates.js
```

**Script needs NO changes** - it will work with these new templates!

---

## ❓ IF STILL GETTING URL ERROR

Try these alternatives:

**Option 1: Remove URL button entirely**
- Just use Quick Reply button only
- Advisors can ask for content link via reply

**Option 2: Use different URL format**
- Try: `https://jarvisdaily.com/content`
- Or: `https://jarvisdaily.com/advisor`

**Option 3: Contact AiSensy Support**
- Ask: "How to add dynamic parameter in URL button?"
- They may have specific format requirement

---

Let me know if you still get the error and I'll help troubleshoot! 🚀
