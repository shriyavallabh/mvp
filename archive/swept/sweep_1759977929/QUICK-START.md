# ⚡ Quick Start - Ship Dashboard TODAY

## What We Built

✅ **Mobile Dashboard** - Advisors access their daily content via WhatsApp link  
✅ **AiSensy Integration** - Automated WhatsApp notifications  
✅ **Image Hosting** - Cloudinary for reliable image delivery  
✅ **Daily Automation** - One command generates & distributes content

---

## 🚀 Deploy in 3 Steps (10 minutes)

### Step 1: Deploy to Vercel

```bash
npm run deploy
```

Copy your deployment URL: `https://your-project.vercel.app`

### Step 2: Set Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables

```
AISENSY_API_KEY=(from .env)
CLOUDINARY_CLOUD_NAME=dun0gt2bc
CLOUDINARY_API_KEY=812182821573181
CLOUDINARY_API_SECRET=(from .env)
GEMINI_API_KEY=(from .env)
DASHBOARD_URL=https://your-project.vercel.app
```

Redeploy: `vercel --prod`

### Step 3: Test the System

```bash
# Generate test content
npm run test-content

# Visit dashboard
open https://your-project.vercel.app/dashboard?phone=919765071249
```

---

## 📱 How It Works

### For Advisors
1. Receive WhatsApp message (9 AM daily)
2. Click "View Content" button
3. Dashboard opens automatically
4. Copy/download content
5. Share with clients

### For You
```bash
# Run once per day
npm run daily-workflow
```

This generates content, uploads images, sends notifications.

---

## 🔧 Commands

```bash
npm run test-content        # Generate test session
npm run deploy              # Deploy to Vercel
npm run send-notifications  # Send to all advisors
npm run daily-workflow      # Complete automation
```

---

## 💰 Costs: ₹0/month (FREE for 4 advisors!)

- AiSensy: FREE (120/1000 messages used)
- Cloudinary: FREE (5MB/25GB used)
- Vercel: FREE (hobby plan)

---

## 📚 Full Docs

- DASHBOARD-GUIDE.md - Complete technical guide
- DEPLOYMENT-CHECKLIST.md - Step-by-step deployment
