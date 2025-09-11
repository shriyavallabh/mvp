# Google Apps Script Webhook Setup Guide

## Overview
This guide walks through setting up Google Apps Script to communicate with the FinAdvise webhook server.

## Prerequisites
- Google Sheet already set up with 5 tabs (see GOOGLE_SHEETS_SETUP.md)
- Webhook server running on port 5001
- Google Apps Script editor access

## Setup Instructions

### Step 1: Create Apps Script Project

#### Option A: Add to Existing Sheet Project
1. Open your FinAdvise Google Sheet
2. Go to `Extensions` → `Apps Script`
3. Click on `+` to add a new file
4. Name it `WebhookIntegration.gs`

#### Option B: Create Standalone Project
1. Go to [script.google.com](https://script.google.com)
2. Click `New project`
3. Name it "FinAdvise Webhook Integration"

### Step 2: Add Webhook Code
1. Copy the entire contents of `/scripts/google_apps_webhook.js`
2. Paste into the Apps Script editor
3. Update the configuration at the top of the script:
   ```javascript
   const CONFIG = {
     WEBHOOK_URL: 'http://143.110.191.97:5001/trigger',  // Update with your server IP
     WEBHOOK_SECRET: 'default_secret_change_me',          // Match your server secret
     SHEET_ID: 'YOUR_SHEET_ID_HERE',                     // Your Google Sheet ID
     MAX_RETRIES: 3,
     RETRY_DELAY: 2000
   };
   ```

### Step 3: Save and Authorize
1. Click `Save` (💾 icon)
2. Click `Run` → Select `testWebhookConnection`
3. Authorize the script:
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Review permissions and click "Allow"

### Step 4: Test the Connection
1. Run `testWebhookConnection` function
2. You should see a success message if the webhook server is reachable
3. If it fails, check:
   - Webhook server is running (`pm2 status`)
   - Correct IP address and port
   - Firewall rules allow incoming connections

### Step 5: Set Up Triggers

#### Manual Setup (Recommended for Testing)
1. In Apps Script editor, run `setupTriggers` function
2. This creates a daily trigger at 9 AM for content generation

#### Custom Trigger Setup
1. Click on `Triggers` (⏰ icon) in the left sidebar
2. Click `+ Add Trigger`
3. Configure:
   - Function: `generateDailyContent`
   - Event source: `Time-driven`
   - Type: `Day timer`
   - Time: `9am-10am`
4. Click `Save`

### Step 6: Deploy as Web App (Optional)
If you want to receive webhooks FROM external services:

1. Click `Deploy` → `New Deployment`
2. Configuration:
   - Type: `Web app`
   - Description: "FinAdvise Webhook Receiver"
   - Execute as: `Me`
   - Who has access: `Anyone` (or restrict as needed)
3. Click `Deploy`
4. Copy the Web app URL for external services

## Available Functions

### Core Functions

#### `sendWebhook(payload)`
Sends data to the webhook server with retry logic.

#### `triggerContentGeneration(advisorArn, topic)`
Triggers content generation for a specific advisor.

#### `handleContentApproval(contentId, action, feedback)`
Approves or rejects content with optional feedback.

#### `requestRevision(contentId, revisionNotes)`
Requests revision for existing content.

#### `generateDailyContent()`
Automated function to generate daily content for all active advisors.

### Test Functions

#### `testWebhookConnection()`
Tests connection to the webhook server.

#### `testContentGeneration()`
Manually triggers content generation for testing.

## Menu Options
When you open the Google Sheet, you'll see a "FinAdvise Webhooks" menu with:
- **Test Webhook Connection** - Verify server connectivity
- **Generate Content (Test)** - Manually trigger content generation
- **Setup Daily Triggers** - Configure automated tasks
- **Update Configuration** - View current configuration

## Webhook Payload Examples

### Content Generation Request
```javascript
{
  "action": "generate",
  "timestamp": "2025-09-08T10:00:00.000Z",
  "advisor": {
    "arn": "ARN123456",
    "name": "John Doe",
    "tone": "professional",
    "client_segment": "middle",
    // ... other advisor fields
  },
  "topic": "Retirement Planning",
  "requestId": "uuid-here"
}
```

### Content Approval
```javascript
{
  "action": "approve",
  "timestamp": "2025-09-08T10:00:00.000Z",
  "contentId": "CONTENT123",
  "feedback": "Looks good!",
  "approvedBy": "admin@finadvise.com"
}
```

### Revision Request
```javascript
{
  "action": "revise",
  "timestamp": "2025-09-08T10:00:00.000Z",
  "contentId": "CONTENT123",
  "revisionNotes": "Please make the tone more friendly",
  "requestedBy": "admin@finadvise.com"
}
```

## Security Considerations

### Authentication
- Webhook requests include `X-Webhook-Secret` header
- Update the secret in both server and Apps Script configuration
- Use environment variables for production secrets

### Permissions
- Apps Script runs with the permissions of the authorizing user
- Be cautious with "Anyone" access for web apps
- Review OAuth scopes during authorization

### Rate Limiting
- Google Apps Script has quotas and limitations
- URL Fetch: 20,000 calls/day for consumer accounts
- Script runtime: 6 minutes max per execution
- Triggers: 20 per user per script

## Troubleshooting

### Connection Errors
1. Check webhook server is running: `pm2 status`
2. Verify IP address and port are correct
3. Test with curl from local machine:
   ```bash
   curl -X POST http://143.110.191.97:5001/trigger \
     -H "X-Webhook-Secret: default_secret_change_me" \
     -H "Content-Type: application/json" \
     -d '{"action": "test"}'
   ```

### Authorization Issues
1. Clear browser cache and cookies
2. Remove and re-add script authorization
3. Check Google Workspace admin settings if applicable

### Trigger Not Running
1. Check trigger list in Apps Script editor
2. Verify time zone settings
3. Check execution transcript for errors
4. Ensure quotas haven't been exceeded

### Data Not Updating
1. Verify Sheet ID is correct
2. Check sheet/tab names match exactly
3. Ensure proper permissions on the Sheet
4. Review Apps Script execution logs

## Monitoring

### Execution Logs
1. In Apps Script editor, click `Execution log` (📋 icon)
2. View recent executions and any errors
3. Click on an execution for detailed logs

### Email Notifications
Configure in Settings tab of Google Sheet:
- `enable_notifications`: true
- `notification_email`: your-email@example.com

### Analytics
Check the Analytics tab in Google Sheet for:
- Content generation history
- Success/failure rates
- Performance metrics

## Best Practices

1. **Test in Development First**
   - Use a test Sheet and test webhook server
   - Verify all functions work before production

2. **Monitor Quotas**
   - Track API usage in Google Cloud Console
   - Implement rate limiting if needed

3. **Error Handling**
   - Always wrap API calls in try-catch blocks
   - Log errors for debugging
   - Send notifications for critical failures

4. **Version Control**
   - Keep copies of working scripts
   - Document any customizations
   - Use deployment versions for production

5. **Security**
   - Rotate webhook secrets regularly
   - Limit access to sensitive functions
   - Audit script permissions periodically