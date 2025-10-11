# Google Cloud Setup for Gmail MCP

This guide will help you set up Google Cloud credentials for the Gmail MCP server.

## 🎯 Quick Links

- **Google Cloud Console:** https://console.cloud.google.com
- **Gmail API Library:** https://console.cloud.google.com/apis/library/gmail.googleapis.com
- **Credentials Page:** https://console.cloud.google.com/apis/credentials

---

## Step 1: Create Google Cloud Project

1. **Go to:** https://console.cloud.google.com
2. **Click:** "Select a project" dropdown (top left, next to Google Cloud logo)
3. **Click:** "NEW PROJECT" button (top right)
4. **Fill in:**
   - Project name: `JarvisDaily Gmail MCP`
   - Organization: Leave default
5. **Click:** "CREATE"
6. **Wait** 10-20 seconds
7. **Select the new project** from dropdown (make sure it's active)

---

## Step 2: Enable Gmail API

1. **Go to:** https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. **Make sure** "JarvisDaily Gmail MCP" is selected (top bar)
3. **Click:** "ENABLE" button
4. **Wait** for confirmation (5-10 seconds)
5. ✅ You'll see "API enabled" message

---

## Step 3: Configure OAuth Consent Screen

1. **Go to:** https://console.cloud.google.com/apis/credentials/consent
2. **User Type:** Select **"External"** (unless you have Google Workspace)
3. **Click:** "CREATE"

### OAuth Consent Screen - Page 1: App Information
- **App name:** `JarvisDaily Gmail Manager`
- **User support email:** `crm.jarvisdaily@gmail.com`
- **App logo:** Skip (optional)
- **Developer contact information:** `crm.jarvisdaily@gmail.com`
- **Click:** "SAVE AND CONTINUE"

### OAuth Consent Screen - Page 2: Scopes
- **Click:** "ADD OR REMOVE SCOPES"
- **Filter for:** `gmail`
- **Check these boxes:**
  - ✅ `.../auth/gmail.modify` - View and modify but not delete your email
  - ✅ `.../auth/gmail.send` - Send email on your behalf
  - ✅ `.../auth/gmail.settings.basic` - Manage your basic mail settings
- **Click:** "UPDATE"
- **Click:** "SAVE AND CONTINUE"

### OAuth Consent Screen - Page 3: Test Users
- **Click:** "+ ADD USERS"
- **Enter:** `crm.jarvisdaily@gmail.com`
- **Click:** "ADD"
- **Click:** "SAVE AND CONTINUE"

### OAuth Consent Screen - Page 4: Summary
- **Review** settings
- **Click:** "BACK TO DASHBOARD"

---

## Step 4: Create OAuth 2.0 Credentials

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Click:** "CREATE CREDENTIALS" → "OAuth client ID"
3. **Application type:** Select **"Desktop app"**
4. **Name:** `JarvisDaily MCP Client`
5. **Click:** "CREATE"

### Download Credentials
- A popup appears: "OAuth client created"
- **Click:** "DOWNLOAD JSON" button (download icon)
- The file will download with a name like: `client_secret_XXXXX.json`

---

## Step 5: Save Credentials to Project

1. **Locate** the downloaded JSON file (usually in ~/Downloads)
2. **Rename** it to: `gmail-credentials.json`
3. **Move** it to: `/Users/shriyavallabh/Desktop/mvp/mcp-config/gmail-credentials.json`

**Using Terminal:**
```bash
# Example (adjust the actual filename):
mv ~/Downloads/client_secret_*.json /Users/shriyavallabh/Desktop/mvp/mcp-config/gmail-credentials.json
```

---

## ✅ Verification Checklist

Before proceeding, make sure:

- [ ] Google Cloud Project created: `JarvisDaily Gmail MCP`
- [ ] Gmail API enabled
- [ ] OAuth Consent Screen configured (External, test user added)
- [ ] OAuth 2.0 Desktop Client created
- [ ] Credentials JSON downloaded and saved to: `mcp-config/gmail-credentials.json`

---

## 🚀 Next Steps

Once you've completed all steps above, run:

```bash
# Install the MCP server
./mcp-config/setup-gmail-mcp.sh

# Authenticate with Gmail (this will open your browser)
cd mcp-config/mcp-gmail
uv run python -m mcp_gmail.auth
```

---

## 🔍 Troubleshooting

### "Access blocked: Authorization Error"
- Make sure you added `crm.jarvisdaily@gmail.com` as a test user in OAuth Consent Screen
- App is in "Testing" mode, which is correct for now

### "API has not been used in project"
- Wait 1-2 minutes after enabling Gmail API
- Refresh the credentials page

### "Credentials file not found"
- Make sure the file is named exactly: `gmail-credentials.json`
- Check it's in the correct path: `mcp-config/gmail-credentials.json`
- Run: `ls -la /Users/shriyavallabh/Desktop/mvp/mcp-config/gmail-credentials.json`

---

## 📚 References

- **Gmail API Documentation:** https://developers.google.com/gmail/api
- **OAuth 2.0 Scopes:** https://developers.google.com/identity/protocols/oauth2/scopes#gmail
- **MCP Gmail Repository:** https://github.com/jeremyjordan/mcp-gmail
