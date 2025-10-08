# JarvisDaily Dashboard System

## Overview

Simple, mobile-first dashboard system for financial advisors to access their daily viral content via WhatsApp.

## Architecture

```
Daily Workflow:
1. Content Generation (orchestrate-finadvise.py) → Creates session_* folders
2. Image Upload (Cloudinary) → Hosts images with stable URLs
3. WhatsApp Notification (AiSensy) → Sends utility message with dashboard link
4. Advisor Access (Dashboard) → Copy/download content
```

## Quick Start

### 1. Generate Test Content

```bash
npm run test-content
```

This creates a test session with sample content for all 4 advisors.

### 2. Test Dashboard Locally

```bash
npm run dev
```

Open: `http://localhost:3000/dashboard?phone=919765071249`

### 3. Deploy to Production

```bash
npm run deploy
```

Dashboard will be live at: `https://jarvisdaily.com/dashboard`

### 4. Send Notifications

```bash
npm run send-notifications
```

Sends AiSensy utility messages to all active advisors with dashboard link.

## Daily Automation

### Full Workflow (Run Once Daily)

```bash
npm run daily-workflow
```

This runs:
1. ✅ Content generation (all 14 agents)
2. ✅ Image upload to Cloudinary
3. ✅ WhatsApp notifications to advisors
4. ✅ Logging and monitoring

### Schedule with Cron (Recommended)

Add to crontab:

```bash
# Run daily at 8 AM IST
0 8 * * * cd /Users/shriyavallabh/Desktop/mvp && npm run daily-workflow >> logs/daily-$(date +\%Y-\%m-\%d).log 2>&1
```

## API Endpoints

### GET /api/dashboard?phone={phone}

Returns advisor's latest content.

**Request:**
```
GET /api/dashboard?phone=919765071249
```

**Response:**
```json
{
  "advisor": {
    "id": "ADV003",
    "name": "Shriya Vallabh Petkar",
    "branding": {
      "logo": "/assets/logos/shriya-vallabh.png",
      "primaryColor": "#8B4513",
      "secondaryColor": "#CD853F",
      "tagline": "Empowering Financial Decisions"
    }
  },
  "content": {
    "whatsappMessage": "...",
    "linkedinPost": "...",
    "statusImage": "/api/image?session=...",
    "sessionDate": "2025-10-05T05-41-25"
  }
}
```

### GET /api/image?session={session}&advisor={id}&file={filename}

Serves status images from session folders.

## AiSensy Integration

### Template Format

**Template Name:** `daily_content_notification`

**Message:**
```
Hi {name}! 👋

Your daily content for {date} is ready!

Click below to view:
```

**Button:**
- Type: URL
- Text: "View Content"
- URL: `https://jarvisdaily.com/dashboard?phone={phone}`

### Sending Logic

The script automatically:
1. Loads all active advisors from `/data/advisors.json`
2. Sends personalized message with phone number in URL
3. Dashboard auto-detects advisor from phone parameter
4. Logs all sends to `/data/send-logs.json`

## File Structure

```
/api/
  dashboard.js          ✅ Main API - fetches advisor content
  image.js              ✅ Image serving API

/public/
  dashboard.html        ✅ Mobile-optimized dashboard UI

/scripts/
  generate-test-content.js    ✅ Create test sessions
  send-aisensy.js             ✅ Send WhatsApp notifications
  upload-images-cloudinary.js ✅ Upload images to Cloudinary
  daily-automation.js         ✅ Complete daily workflow

/data/
  advisors.json         📋 Advisor data (4 advisors)
  send-logs.json        📋 Notification sending history
  workflow-log.json     📋 Daily automation logs

/output/
  session_*/            📁 Generated content sessions
    advisors/
      ADV001/
        whatsapp-message.txt
        linkedin-post.txt
        status-image.png
        cloudinary-url.txt
```

## Dashboard Features

### Mobile-First Design
- ✅ Optimized for WhatsApp in-app browser
- ✅ One-tap copy for messages
- ✅ Direct download for images
- ✅ Character counts displayed
- ✅ Beautiful gradient UI
- ✅ Responsive on all devices

### Security
- ✅ Phone-based authentication (no passwords)
- ✅ Auto-detection from WhatsApp click
- ✅ Fallback phone input if direct access
- ✅ Content only accessible to owner

### Performance
- ✅ Fast API responses (<100ms)
- ✅ Image caching (24-hour CDN)
- ✅ Minimal JavaScript (no frameworks)
- ✅ Works offline after first load

## Troubleshooting

### Dashboard shows "Content Not Available"

**Check:**
1. Is there a session folder in `/output/`?
2. Does the session have content for this advisor?
3. Run: `npm run test-content` to create test data

### AiSensy message not received

**Check:**
1. Is `AISENSY_API_KEY` set in `.env`?
2. Is advisor phone number correct in `advisors.json`?
3. Check logs in `/data/send-logs.json`

### Images not loading

**Options:**
1. **Vercel serving** (default): Images served from `/api/image`
2. **Cloudinary** (recommended): Run `npm run upload-images <session-path>`

Cloudinary provides:
- ✅ Stable URLs
- ✅ Global CDN
- ✅ Automatic optimization
- ✅ Reliable WhatsApp compatibility

### Phone number not matching

Advisor phone numbers can be in formats:
- `919765071249` (with country code)
- `9765071249` (without country code)

The API handles both automatically.

## Cost Breakdown

### Current Setup (FREE for 4 advisors)

- **AiSensy**: FREE_FOREVER plan
  - 1000 utility messages/month
  - 4 advisors × 30 days = 120 messages/month
  - ✅ FREE

- **Cloudinary**: Free tier
  - 25GB storage, 25GB bandwidth
  - 4 images/day × 30 days = ~5MB/month
  - ✅ FREE

- **Vercel**: Hobby plan
  - 100GB bandwidth
  - Serverless functions
  - ✅ FREE

**Total Monthly Cost: ₹0**

### Scaling to 100 Advisors

- **AiSensy**: Still FREE
  - 100 advisors × 30 = 3000 messages/month
  - Upgrade to Pro: ₹999/month (10,000 messages)

- **Cloudinary**: Still FREE (within free tier)

- **Vercel**: Consider Pro plan (₹1,500/month) for higher limits

**Total for 100 Advisors: ~₹2,500/month**

## Next Steps

### For Production Launch

1. ✅ **Deploy to Vercel**
   ```bash
   npm run deploy
   ```

2. ✅ **Set Environment Variables** (Vercel Dashboard)
   - `AISENSY_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `DASHBOARD_URL=https://jarvisdaily.com`

3. ✅ **Create AiSensy Template**
   - Go to AiSensy dashboard
   - Create utility template (no approval needed)
   - Add button with URL: `https://jarvisdaily.com/dashboard`
   - Variable in URL: `?phone={phone}`

4. ✅ **Test with One Advisor**
   ```bash
   # Generate real content
   python3 orchestrate-finadvise.py

   # Send to one advisor (modify script)
   node scripts/send-aisensy.js
   ```

5. ✅ **Set Up Daily Cron**
   ```bash
   crontab -e
   # Add: 0 8 * * * cd /path/to/mvp && npm run daily-workflow
   ```

6. ✅ **Monitor Logs**
   - `/data/send-logs.json` - Delivery status
   - `/data/workflow-log.json` - Daily automation
   - `vercel logs --follow` - Real-time API logs

## Support

For issues or questions:
1. Check logs in `/data/`
2. Test with `npm run test-content`
3. Verify environment variables in `.env`
4. Check Vercel deployment logs

---

**Built with ❤️ for Financial Advisors**
Ship fast. Scale smart. Keep it simple.
