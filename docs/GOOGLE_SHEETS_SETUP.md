# Google Sheets Setup Guide for FinAdvise MVP

## Prerequisites
- Google account with access to Google Sheets
- Google Apps Script editor access

## Setup Instructions

### Step 1: Create a New Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "FinAdvise MVP Data"

### Step 2: Open Apps Script Editor
1. In the Google Sheet, click on `Extensions` → `Apps Script`
2. This will open the Apps Script editor in a new tab

### Step 3: Setup the Sheet Structure
1. Delete any default code in the Apps Script editor
2. Copy the entire contents of `/scripts/setup_google_sheets.js`
3. Paste it into the Apps Script editor
4. Click the `Save` button (💾 icon)
5. Name the project "FinAdvise Sheet Setup"

### Step 4: Run the Setup Script
1. In the Apps Script editor, select `setupFinAdviseSheets` from the function dropdown
2. Click the `Run` button (▶️ icon)
3. You will be prompted to authorize the script:
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" if you see a warning
   - Click "Go to FinAdvise Sheet Setup (unsafe)"
   - Click "Allow"
4. The script will create all 5 required tabs with proper structure

### Step 5: Verify the Setup
After the script runs, your Google Sheet should have:
- **Advisors** tab (blue headers) - Financial advisor profiles
- **Content** tab (green headers) - Generated content tracking
- **Templates** tab (yellow headers) - Content templates
- **Analytics** tab (red headers) - Performance metrics
- **Settings** tab (purple headers) - System configuration

### Step 6: Note the Sheet ID
1. Look at the Google Sheet URL
2. The Sheet ID is the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Save this ID for the Apps Script webhook configuration

## Sheet Structure Details

### Advisors Tab
Stores advisor profiles with:
- ARN (Unique identifier)
- Contact information
- Branding details
- Content preferences
- Subscription status

### Content Tab
Tracks all generated content with:
- Unique content IDs
- Generated text for WhatsApp and LinkedIn
- Quality scores
- Approval status
- Delivery tracking

### Templates Tab
Manages content templates with:
- Template categories
- Variable placeholders
- Compatibility settings
- Usage statistics

### Analytics Tab
Records performance metrics:
- Engagement data
- Platform-specific metrics
- Time-based analytics
- Sentiment analysis

### Settings Tab
System configuration including:
- Webhook URL (pre-filled with VM address)
- Authentication secrets
- Generation limits
- Notification settings

## Data Validation Rules

The setup script automatically configures:
- Dropdown lists for categorical fields
- Checkboxes for boolean fields
- Date validation for date fields
- Number validation for numeric fields

## Permissions

Ensure the Google Sheet has appropriate sharing settings:
1. Click the `Share` button in the top-right
2. Set permissions based on your needs:
   - View-only for most users
   - Edit access for administrators
   - Restricted access for sensitive data

## Troubleshooting

### Script Authorization Issues
- Ensure you're logged in with the correct Google account
- Accept all required permissions
- If blocked by organization, contact your Google Workspace admin

### Missing Tabs
- Run the setup script again
- Or use individual setup functions from the FinAdvise Setup menu

### Data Validation Not Working
- Check that you're entering data in row 2 or below
- Row 1 is reserved for headers
- Ensure values match the validation lists exactly

## Next Steps
After setting up the Google Sheet:
1. Proceed to configure Google Apps Script webhook triggers
2. Update the webhook URL in the Settings tab if needed
3. Add test advisor data in the Advisors tab
4. Test the integration with the webhook server