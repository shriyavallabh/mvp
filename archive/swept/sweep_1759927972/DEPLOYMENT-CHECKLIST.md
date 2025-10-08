# 🚀 Deployment Checklist - Ship TODAY

## Pre-Deployment (5 minutes)

- [ ] Test content generated successfully
  ```bash
  npm run test-content
  ```

- [ ] Test dashboard loads locally
  ```bash
  npm run dev
  # Visit: http://localhost:3000/dashboard?phone=919765071249
  ```

- [ ] Verify all 4 advisors have content
  - [ ] Shruti Petkar (919673758777)
  - [ ] Vidyadhar Petkar (918975758513)
  - [ ] Shriya Vallabh Petkar (919765071249)
  - [ ] Avalok Langer (919022810769)

## Vercel Deployment (10 minutes)

- [ ] **Deploy to Vercel**
  ```bash
  npm run deploy
  ```

- [ ] **Set Environment Variables** (Vercel Dashboard → Settings → Environment Variables)
  ```
  AISENSY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  CLOUDINARY_CLOUD_NAME=dun0gt2bc
  CLOUDINARY_API_KEY=812182821573181
  CLOUDINARY_API_SECRET=JVrtiKtKTPy9NHbtF2GSI1keKi8
  DASHBOARD_URL=https://jarvisdaily.vercel.app
  ```

- [ ] **Verify Routes Working**
  - [ ] `https://jarvisdaily.vercel.app/dashboard`
  - [ ] `https://jarvisdaily.vercel.app/api/dashboard?phone=919765071249`
  - [ ] `https://jarvisdaily.vercel.app/api/image?session=...` (use real session)

## AiSensy Setup (15 minutes)

### Option A: Quick Test (Use existing template)

- [ ] **Test with existing template**
  ```bash
  # Modify scripts/send-aisensy.js to use your template name
  npm run send-notifications
  ```

### Option B: Create Custom Template (Recommended)

- [ ] **Login to AiSensy Dashboard**
  - URL: https://app.aisensy.com
  - Account: Free Forever plan

- [ ] **Create Utility Template**
  1. Go to: Templates → Create Template
  2. Template Type: **Utility**
  3. Template Name: `daily_content_ready`
  4. Language: **English**
  5. Category: **UTILITY**

- [ ] **Template Content**
  ```
  Header: NONE

  Body:
  Hi {{1}}! 👋

  Your daily content for {{2}} is ready!

  Click below to view and share with your clients.

  Footer:
  JarvisDaily - Your Content Partner

  Buttons:
  [Button 1]
  Type: URL
  Text: View Content
  URL: https://jarvisdaily.vercel.app/dashboard
  Dynamic URL Suffix: {{1}}
  ```

- [ ] **Submit for Approval** (Utility templates auto-approved in 5 min)

- [ ] **Update send-aisensy.js with template name**
  ```javascript
  // Change line with templateParams
  campaignName: 'daily_content_ready',
  ```

## Domain Setup (Optional - 10 minutes)

### If you want jarvisdaily.com instead of Vercel subdomain:

- [ ] **Add Domain in Vercel**
  1. Vercel Dashboard → Project → Settings → Domains
  2. Add: `jarvisdaily.com`

- [ ] **Update DNS** (Your domain registrar)
  ```
  Type: CNAME
  Name: @
  Value: cname.vercel-dns.com
  ```

- [ ] **Update DASHBOARD_URL** in Vercel env vars
  ```
  DASHBOARD_URL=https://jarvisdaily.com
  ```

## Testing (15 minutes)

### Test 1: Manual Dashboard Access

- [ ] Open: `https://jarvisdaily.vercel.app/dashboard`
- [ ] Enter phone: `919765071249`
- [ ] Verify content loads:
  - [ ] WhatsApp message visible
  - [ ] LinkedIn post visible
  - [ ] Status image (placeholder text for now)
- [ ] Test copy buttons work
- [ ] Test on mobile device

### Test 2: API Endpoint

- [ ] Test API directly:
  ```bash
  curl "https://jarvisdaily.vercel.app/api/dashboard?phone=919765071249"
  ```
- [ ] Should return JSON with content

### Test 3: Send Notification (ONE advisor first)

- [ ] **Modify send-aisensy.js** to send to only yourself first:
  ```javascript
  // Comment out the loop, hardcode one phone number
  const result = await sendUtilityMessage('919765071249', 'Shriya');
  ```

- [ ] **Send test message**
  ```bash
  node scripts/send-aisensy.js
  ```

- [ ] **Check WhatsApp**
  - [ ] Message received
  - [ ] Click button
  - [ ] Dashboard opens
  - [ ] Content displays correctly

### Test 4: Full Workflow

- [ ] **Uncomment all advisors** in send-aisensy.js

- [ ] **Send to all 4 advisors**
  ```bash
  npm run send-notifications
  ```

- [ ] **Verify logs**
  ```bash
  cat data/send-logs.json
  ```

- [ ] **Check success rate** (Should be 4/4)

## Production Automation (10 minutes)

### Option A: GitHub Actions (Recommended)

- [ ] Create `.github/workflows/daily-content.yml`:
  ```yaml
  name: Daily Content Generation
  on:
    schedule:
      - cron: '30 3 * * *'  # 9:00 AM IST daily
    workflow_dispatch:  # Manual trigger

  jobs:
    generate-and-send:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: '22'
        - uses: actions/setup-python@v4
          with:
            python-version: '3.11'
        - run: npm install
        - run: npm run daily-workflow
          env:
            AISENSY_API_KEY: ${{ secrets.AISENSY_API_KEY }}
            CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
            CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
            CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
            GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  ```

- [ ] Add secrets to GitHub repo

### Option B: Cron Job on Server

- [ ] SSH to your server

- [ ] Add to crontab:
  ```bash
  crontab -e
  # Add:
  30 3 * * * cd /path/to/mvp && npm run daily-workflow >> logs/daily-$(date +\%Y-\%m-\%d).log 2>&1
  ```

### Option C: Manual Daily Run

- [ ] Just run manually each day:
  ```bash
  npm run daily-workflow
  ```

## Monitoring Setup (5 minutes)

- [ ] **Create logs directory**
  ```bash
  mkdir -p logs
  ```

- [ ] **Set up log rotation** (Optional)
  ```bash
  # Keep only last 7 days
  find logs/ -name "daily-*.log" -mtime +7 -delete
  ```

- [ ] **Monitor Vercel logs**
  ```bash
  vercel logs --follow
  ```

- [ ] **Check workflow logs**
  ```bash
  cat data/workflow-log.json | jq '.[-5:]'  # Last 5 runs
  ```

## Success Criteria ✅

- [ ] Dashboard accessible from any device
- [ ] All 4 advisors can access their content
- [ ] WhatsApp notifications delivered successfully
- [ ] Copy buttons work on mobile
- [ ] Images display correctly (or placeholder text)
- [ ] API responds in <200ms
- [ ] Logs show successful delivery

## Post-Launch (Next 24 hours)

- [ ] **Monitor first delivery**
  - Check send-logs.json after first daily run
  - Verify all 4 advisors received messages
  - Ask for feedback on dashboard UX

- [ ] **Collect Usage Data**
  - How many clicks on WhatsApp button?
  - Any errors in Vercel logs?
  - Advisor feedback on content quality?

- [ ] **Optimize Based on Feedback**
  - Add missing features
  - Fix UI issues on specific devices
  - Improve content generation prompts

## Rollback Plan

If something breaks:

1. **Dashboard not loading**
   ```bash
   # Redeploy previous version
   vercel --prod
   ```

2. **AiSensy not sending**
   - Check API key in Vercel env vars
   - Verify template is approved
   - Check send-logs.json for errors

3. **Content not generating**
   - Run locally first: `python3 orchestrate-finadvise.py`
   - Check agent outputs
   - Verify Gemini API key

## Cost Monitoring

### Current (FREE)
- AiSensy: 120 messages/month (FREE_FOREVER)
- Cloudinary: ~5MB/month (FREE tier)
- Vercel: 4 advisors (FREE hobby)

### At 100 Advisors
- AiSensy: ₹999/month (Pro plan)
- Cloudinary: FREE (still under limits)
- Vercel: ₹1,500/month (Pro plan)

**Set budget alert at ₹3,000/month**

---

## Final Checklist Before Going Live

- [ ] All tests passed ✅
- [ ] Vercel deployed successfully ✅
- [ ] Environment variables set ✅
- [ ] AiSensy template approved ✅
- [ ] Test message received on WhatsApp ✅
- [ ] Dashboard works on mobile ✅
- [ ] Daily automation scheduled ✅
- [ ] Logs directory created ✅
- [ ] Rollback plan ready ✅

**Time to ship: ~1 hour**

**🎉 YOU'RE LIVE! 🎉**

Next: Monitor for 24 hours, collect feedback, iterate based on real usage.
