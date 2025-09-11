# Production Setup Guide for shriyavallabh.ap@gmail.com

## Overview
This guide walks through setting up the FinAdvise MVP with your Google account that has purchased Google Drive storage.

## Current Architecture
```
[Google Sheets & Apps Script]
    (shriyavallabh.ap@gmail.com)
            ↓
    [Webhook Server]
    (Port 5001 - Local/VM)
            ↓
    [PM2 Process Manager]
    (Managing webhook-server & claude-session)
```

## Step-by-Step Setup

### Part A: Google Sheets Setup (Your Account)

1. **Login to Google**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Sign in with `shriyavallabh.ap@gmail.com`

2. **Create the FinAdvise Sheet**
   - Click "Blank" to create new spreadsheet
   - Name it: "FinAdvise MVP Data"
   - Keep this tab open

3. **Open Apps Script Editor**
   - In the sheet, click `Extensions` → `Apps Script`
   - Delete any default code

4. **Setup Sheet Structure**
   - Copy all code from `/scripts/setup_google_sheets.js`
   - Paste into Apps Script editor
   - Click Save (💾)
   - Select function: `setupFinAdviseSheets`
   - Click Run (▶️)
   - Authorize when prompted:
     - Review permissions
     - Select your account
     - Click Allow

5. **Verify Sheet Structure**
   - Return to your Google Sheet
   - You should see 5 tabs:
     - Advisors (blue)
     - Content (green)
     - Templates (yellow)
     - Analytics (red)
     - Settings (purple)

6. **Note Your Sheet ID**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the SHEET_ID part
   - Save it for next steps

### Part B: Apps Script Webhook Integration

1. **Add Webhook Code**
   - Still in Apps Script editor
   - Click `+` next to Files
   - Add new script file named "WebhookIntegration"
   - Copy code from `/scripts/google_apps_webhook.js`
   - Paste into new file

2. **Update Configuration**
   Replace the CONFIG section with your details:
   ```javascript
   const CONFIG = {
     WEBHOOK_URL: 'http://localhost:5001/trigger', // For testing
     WEBHOOK_SECRET: 'dev_secret_key_2024',
     SHEET_ID: 'YOUR_ACTUAL_SHEET_ID', // Paste your Sheet ID here
     MAX_RETRIES: 3,
     RETRY_DELAY: 2000
   };
   ```

3. **Test the Connection**
   - Save the script
   - Select function: `testWebhookConnection`
   - Make sure webhook server is running locally
   - Click Run
   - Should see "Success" message

4. **Deploy for Production** (Optional)
   - Click Deploy → New Deployment
   - Type: Web app
   - Execute as: Me (shriyavallabh.ap@gmail.com)
   - Access: Anyone/Only myself (your choice)
   - Click Deploy
   - Copy the Web App URL

### Part C: Local Testing Setup

1. **Start Local Webhook Server**
   ```bash
   cd /Users/shriyavallabh/Desktop/mvp
   source venv/bin/activate
   pm2 start config/ecosystem.config.js
   ```

2. **Verify Services Running**
   ```bash
   pm2 status
   curl http://localhost:5001/health
   ```

3. **Add Test Data to Sheet**
   In the Advisors tab, add a test row:
   - arn: TEST001
   - name: Test Advisor
   - whatsapp: +919876543210
   - email: test@example.com
   - subscription_status: active
   - review_mode: manual
   - auto_send: ✓ (checked)

4. **Test Integration**
   ```bash
   source venv/bin/activate
   python scripts/test_google_integration.py
   ```

### Part D: Production VM Setup

When ready to deploy to VM (143.110.191.97):

1. **Update Apps Script CONFIG**
   ```javascript
   WEBHOOK_URL: 'http://143.110.191.97:5001/trigger',
   WEBHOOK_SECRET: 'prod_secret_key_change_this', // Use strong secret
   ```

2. **Deploy to VM**
   ```bash
   # On the VM
   cd /home/mvp
   git pull origin main
   pm2 start config/ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Configure Firewall**
   ```bash
   sudo ufw allow 5001/tcp
   sudo ufw reload
   ```

## How It Works in Production

### Content Generation Flow
1. **Trigger**: Daily at 9 AM (or manual trigger)
2. **Apps Script**: Reads active advisors from sheet
3. **Webhook Call**: Sends advisor data to webhook server
4. **Content Generation**: Server triggers AI content creation
5. **Update Sheet**: Generated content saved back to Content tab
6. **Review**: Manual/auto approval based on settings
7. **Delivery**: Approved content sent via WhatsApp/LinkedIn

### Data Flow Example
```
Google Sheets (Advisors Tab)
    ↓
Apps Script reads advisor data
    ↓
POST to webhook server with advisor info
    ↓
Webhook server processes request
    ↓
Content generated (future: Claude API)
    ↓
Results written back to Sheets (Content Tab)
    ↓
Approval workflow triggered
    ↓
Approved content delivered
```

## Security Considerations

1. **Webhook Secret**
   - Change default secret in production
   - Use environment variables
   - Rotate regularly

2. **Google Account Security**
   - Enable 2FA on shriyavallabh.ap@gmail.com
   - Review Apps Script permissions regularly
   - Monitor access logs

3. **Data Privacy**
   - Sheet permissions: Only share with necessary users
   - Sensitive data: Consider encryption
   - Regular backups of Google Sheet

## Next Steps

### Immediate Actions
1. ✅ Create Google Sheet with your account
2. ✅ Run setup scripts
3. ✅ Test locally with webhook server
4. ⏳ Add real advisor data
5. ⏳ Configure production secrets

### Future Enhancements (Story 1.4+)
1. Claude API integration for content generation
2. WhatsApp Business API setup
3. LinkedIn API integration
4. Automated content scheduling
5. Analytics dashboard

## Troubleshooting

### Common Issues

**Sheet Not Updating**
- Check Sheet ID is correct
- Verify Apps Script is authorized
- Check webhook server logs

**Webhook Connection Failed**
- Ensure server is running: `pm2 status`
- Check firewall rules
- Verify secret matches

**Permission Errors**
- Re-authorize Apps Script
- Check Google account permissions
- Verify sheet sharing settings

## Support Commands

```bash
# Check webhook server
pm2 logs webhook-server

# Test integration
curl -X POST http://localhost:5001/trigger \
  -H "X-Webhook-Secret: dev_secret_key_2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# View recent logs
tail -f logs/webhook.log
```

## Important URLs
- Your Sheet: [Create at sheets.new](https://sheets.new)
- Apps Script: [script.google.com](https://script.google.com)
- Google Drive: [drive.google.com](https://drive.google.com)

## Contact for Issues
- Primary Account: shriyavallabh.ap@gmail.com
- VM Access: 143.110.191.97
- Local Dev: /Users/shriyavallabh/Desktop/mvp