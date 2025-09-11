# Google Sheets Setup for FinAdvise MVP

## Quick Setup Steps

### 1. Google Sheets ID
The Google Sheets ID is the part of the URL between `/d/` and `/edit`:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

### 2. Service Account Setup (For API Access)

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Name it "FinAdvise MVP"

#### Step 2: Enable Google Sheets API
1. In Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click and Enable it

#### Step 3: Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: `finadvise-agent`
4. Click "Create and Continue"
5. Skip optional roles (click "Continue")
6. Click "Done"

#### Step 4: Generate Key
1. Click on the service account you created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose JSON format
5. Download the key file (keep it secure!)

#### Step 5: Share Sheet with Service Account
1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (ends with @...iam.gserviceaccount.com)
4. Give "Editor" permission
5. Click "Send"

### 3. Deploy Credentials to VM

```bash
# On your local machine
scp -i ~/.ssh/id_ed25519_do /path/to/downloaded-key.json root@143.110.191.97:/home/mvp/config/google-credentials.json

# On VM
ssh -i ~/.ssh/id_ed25519_do root@143.110.191.97
chmod 600 /home/mvp/config/google-credentials.json
```

### 4. Update Environment Variables

On the VM:
```bash
# Edit .env file
nano /home/mvp/.env

# Add your Google Sheets ID
GOOGLE_SHEETS_ID=your_actual_sheet_id_here
GOOGLE_CREDENTIALS_PATH=/home/mvp/config/google-credentials.json

# Save and exit
```

### 5. Test the Integration

```bash
# Restart services
pm2 restart all

# Test advisor manager
cd /home/mvp
./scripts/trigger-advisor-manager.sh --test

# Check logs
pm2 logs
```

## Manual Alternative (Without Service Account)

If you don't want to set up a service account, the agents will work in mock mode with sample data. This is sufficient for testing but won't connect to real Google Sheets data.

## Current Configuration

The system is currently running in **mock mode** because:
- No Google Sheets credentials are configured
- Agents use sample data for testing
- All functionality works except real data sync

To switch to production mode:
1. Complete the service account setup above
2. Deploy credentials to VM
3. Update .env with your Sheet ID
4. Restart services