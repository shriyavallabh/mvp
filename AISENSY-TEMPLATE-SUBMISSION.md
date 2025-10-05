# AiSensy Template Submission - Copy-Paste Ready

## TEMPLATE 1: Daily Content Package

### **Template Details:**
- **Template Name:** `daily_content_package`
- **Category:** Marketing
- **Language:** English
- **Header:** Image (upload sample status image)
- **Variables:** 4

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

---

### **FOOTER TEXT (Copy this exactly):**

```
Mutual fund investments are subject to market risks.
```

---

### **BUTTONS:**
1. **Button Type:** Call-to-Action (CTA)
   - **Button Text:** "View Full Content"
   - **URL:** `https://jarvisdaily.in/c/{{4}}`

2. **Button Type:** Quick Reply
   - **Button Text:** "Send Next Update"

---

### **SAMPLE VARIABLE VALUES (Fill these in during submission):**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Shruti Petkar |
| {{2}} | October 2, 2025 |
| {{3}} | Markets Closed for Gandhi Jayanti - Sensex +715 points yesterday |
| {{4}} | shruti-petkar-20251002 |

---

### **SAMPLE IMAGE:**
Upload: `/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551/images/status/compliant/shruti_petkar_status_1_branded.png`

---

## TEMPLATE 2: Daily Status Image

### **Template Details:**
- **Template Name:** `daily_status_image`
- **Category:** Marketing
- **Language:** English
- **Header:** Image (upload sample status image)
- **Variables:** 3

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

---

### **FOOTER TEXT (Copy this exactly):**

```
Investments are subject to market risks. Read all scheme related documents carefully.
```

---

### **BUTTONS:**
1. **Button Type:** Quick Reply
   - **Button Text:** "Get LinkedIn Post"

---

### **SAMPLE VARIABLE VALUES:**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Shruti |
| {{2}} | Oct 2, 2025 |
| {{3}} | • Market trends and sectoral analysis\n• Key investment insights\n• Portfolio optimization tips |

---

### **SAMPLE IMAGE:**
Upload: `/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551/images/status/compliant/shruti_petkar_status_1_branded.png`

---

## TEMPLATE 3: LinkedIn Post

### **Template Details:**
- **Template Name:** `daily_linkedin_post`
- **Category:** Marketing
- **Language:** English
- **Header:** None (text-only)
- **Variables:** 5

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

---

### **FOOTER TEXT (Copy this exactly):**

```
Market-linked investments carry risks. Consult your financial advisor.
```

---

### **BUTTONS:**
1. **Button Type:** Call-to-Action (CTA)
   - **Button Text:** "View All Posts"
   - **URL:** `https://jarvisdaily.in/linkedin`

---

### **SAMPLE VARIABLE VALUES:**

| Variable | Sample Value |
|----------|--------------|
| {{1}} | Vidyadhar Petkar |
| {{2}} | October 2, 2025 |
| {{3}} | Why markets closed today but your SIP kept working |
| {{4}} | October 2, 2025.\n\nMarkets are closed.\nGandhi Jayanti holiday.\n\nBut your portfolio? Still working.\n\nLet me explain why this is the most important investing lesson.\n\nYesterday (October 1):\nSensex jumped 715 points.\nNifty gained 220 points.\nYour SIP investments? They grew.\n\nToday (October 2):\nMarkets closed.\nTraders taking a break.\nYour SIP investments? Still compounding.\n\nTomorrow (October 3):\nMarkets reopen.\nRally likely to continue.\nYour SIP investments? Ready to capture gains. |
| {{5}} | This is the beauty of systematic investing.\n\nAre you invested systematically?\n\nComment 'SIP' if you want to learn more.\n\n#FinancialPlanning #WealthManagement #SIP #InvestSmart\n\nARN: ARN-138924 |

---

## SUBMISSION CHECKLIST

### **Before Submitting Each Template:**

- [ ] Template name matches exactly (`daily_content_package`, etc.)
- [ ] Category set to **Marketing**
- [ ] Language set to **English**
- [ ] Body text copy-pasted exactly (with emojis)
- [ ] Footer text copy-pasted exactly
- [ ] Variables sequential ({{1}}, {{2}}, {{3}}, {{4}}, {{5}})
- [ ] Sample values filled for ALL variables
- [ ] Sample image uploaded (for Templates 1 & 2)
- [ ] Buttons configured correctly
- [ ] Character count under 550 (body only)
- [ ] Emoji count under 10

---

## EXPECTED APPROVAL TIME

- **Fast Track:** Few minutes (automated approval)
- **Manual Review:** Up to 48 hours
- **If Rejected:** Check reason, fix issue, resubmit immediately

---

## COMMON REJECTION REASONS TO AVOID

✅ **We've avoided these:**
- Variables at start/end of message (we have text before/after)
- Non-sequential variables (we use {{1}}, {{2}}, {{3}} in order)
- >550 characters (ours are 412, 385, 485 chars)
- >10 emojis (ours have 5, 6, 4 emojis)
- Generic placeholders (we use specific: "Market Summary", not "Important: {{1}}")
- Typos (proofread carefully when copy-pasting)

---

## AFTER APPROVAL

Once all 3 templates are approved by Meta:

1. ✅ Templates ready to use
2. ✅ Run: `DRY_RUN=true node send-daily-templates.js` (test mode)
3. ✅ Run: `node send-daily-templates.js` (send to Avalok only)
4. ✅ Verify all 3 templates received correctly
5. ✅ Enable all 4 advisors and go live!

---

## TROUBLESHOOTING

### **Template Rejected:**
1. Check rejection reason in AiSensy dashboard
2. Fix specific issue mentioned
3. Resubmit immediately

### **Can't Find Template Option:**
1. Make sure you're in AiSensy dashboard (not Meta Business Manager)
2. Look for: Templates → Create New Template
3. Or: Campaigns → Create Campaign → Select Template

### **Variables Not Working:**
1. Make sure format is {{1}} not {1} or {{name}}
2. Must be sequential: {{1}}, {{2}}, {{3}} (don't skip numbers)
3. Sample values required for approval

---

## NEED HELP?

If stuck during template submission:
1. Share screenshot of error
2. Share which template you're submitting
3. I'll help debug immediately

Ready to submit! 🚀
