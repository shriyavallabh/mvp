# Clerk OAuth Configuration Fix - Updated for Current Dashboard

**Date**: 2025-10-09
**Issue**: OAuth users see Clerk's signup form asking for phone/password (unnecessary rework)
**Dashboard Version**: Current Clerk dashboard (2025)

---

## The Problem

After clicking "Continue with Google/LinkedIn", users see Clerk's hosted signup form asking for:
- ❌ Phone number
- ❌ Password
- ❌ Additional fields

**This is wrong** because:
- OAuth already authenticated the user
- Google/LinkedIn already provided email and name
- Users shouldn't fill a form after OAuth

---

## EXACT Fix Steps (Current Clerk Dashboard)

### Step 1: Login to Clerk Dashboard

**URL**: https://dashboard.clerk.com

**Select your application**: `touched-adder-72` (or whichever shows "MVP App")

---

### Step 2: Configure Email Settings

**Navigate**: Left sidebar → **User & authentication** → **Email**

**Current settings you see**:
```
✓ Sign-up with email
  Require users to sign up with an email address

✓ Verify at sign-up (Recommended)
  Require users to verify their email addresses before they can sign-up

✓ Sign-in with email
  Allow users to sign in with their email address

✓ Add email to account
  Allow users to add an email to their account
  (Cannot be disabled because it's required for sign-up)
```

**For OAuth users, change**:
- Keep "Sign-up with email" ✓ (for email/password users)
- **IMPORTANT**: Under "Verify at sign-up", look for option:
  - **"Require verification for OAuth sign-ups"** or similar
  - **DISABLE this** for OAuth users (if present)

**Why**: OAuth providers (Google/LinkedIn) already verify emails. Don't ask twice.

---

### Step 3: Configure Phone Settings

**Navigate**: Left sidebar → **User & authentication** → **Phone**

**Look for**:
```
[ ] Require phone number at sign-up
[ ] Verify at sign-up
[ ] Sign-in with phone
[ ] Add phone to account
```

**Action**:
- **UNCHECK** "Require phone number at sign-up"
- **UNCHECK** "Verify at sign-up" (if checked)
- Keep others as you prefer

**Why**: Your custom `/onboarding` flow collects phone with OTP verification. Don't ask twice.

---

### Step 4: Configure Password Settings

**Navigate**: Left sidebar → **User & authentication** → **Password**

**Look for**:
```
[ ] Require password at sign-up
[ ] Sign-in with password
[ ] Add password to account
```

**Action**:
- **UNCHECK** "Require password at sign-up" (if checked)
- OR find option: "Require password for OAuth users" → **DISABLE**

**Why**: OAuth users don't need passwords (they use Google/LinkedIn to sign in)

---

### Step 5: Check Social Connections (OAuth Providers)

**Navigate**: Left sidebar → **User & authentication** → Look for **"Social connections"** or **"OAuth"**

**Verify**:
- ✓ Google: **ENABLED**
- ✓ LinkedIn: **ENABLED**

**Click "Configure" for each** and check:
- ✓ "Automatically create account" or "Auto-join": **ENABLED**
- [ ] "Require additional fields": **DISABLED** (if present)

---

### Step 6: Configure Sign-Up Mode

**Navigate**: Left sidebar → **User & authentication** → Look for **"Settings"** or main User & authentication page

**Look for sign-up mode setting**:
- Option 1: "Progressive sign-up" vs "Instant sign-up"
  - **SELECT**: "Instant sign-up"

- Option 2: "Collect user profile during sign-up"
  - **DISABLE** for OAuth users

**Why**: Instant mode skips Clerk's additional forms for OAuth users

---

### Step 7: Configure Paths (Redirects)

**Navigate**: Left sidebar → **Customization** → **Paths**

**Find "Sign-up" section**:

**Look for**:
```
After sign-up
○ Homepage
○ Sign-in page
● Custom page
  URL: /onboarding
```

**Action**:
- **SELECT**: "Custom page"
- **ENTER**: `/onboarding`

**Save changes**

**Why**: After OAuth completes, redirect directly to your onboarding wizard

---

### Step 8: Add Allowed Domains (CORS Fix)

**Navigate**: Left sidebar → **Developers** → **Domains**

**Current domains**: (probably shows `localhost` only)

**Click "Add domain" and add**:
```
https://jarvisdaily.com
```

**Then add another**:
```
https://finadvise-webhook.vercel.app
```

**Why**: Fixes CORS errors and removes "Development mode" banner

---

### Step 9: Check Session Settings (Optional)

**Navigate**: Left sidebar → **User & authentication** → **Sessions**

**Verify**:
- Session duration: 7 days (or your preference)
- Multi-session handling: Enabled (allows users to be signed in on multiple devices)

---

## What Each Setting Does

### Email Settings
- **"Verify at sign-up"**: Forces email verification for email/password users
- **For OAuth**: Google/LinkedIn already verified email, skip this

### Phone Settings
- **"Require phone at sign-up"**: Forces phone collection before account creation
- **For OAuth**: You're collecting phone in `/onboarding` with OTP, don't collect twice

### Password Settings
- **"Require password at sign-up"**: Forces password creation
- **For OAuth**: Users authenticate with Google/LinkedIn, don't need password

### Social Connections
- **"Auto-join"**: Creates account automatically after OAuth
- **Without this**: Shows Clerk's signup form (the problem!)

---

## Expected Behavior After Fix

### Before (Current - Broken)
```
1. User clicks "Continue with Google"
2. Google OAuth popup → User authenticates ✓
3. ❌ Clerk shows signup form (phone, password, etc.)
4. User fills form (REWORK!)
5. Finally redirected to /onboarding
```

### After (Fixed)
```
1. User clicks "Continue with Google"
2. Google OAuth popup → User authenticates ✓
3. ✅ Account created automatically
4. ✅ DIRECT redirect to /onboarding
5. User fills YOUR custom wizard (business, segments, phone OTP)
```

---

## Alternative: If Settings Don't Exist

If you **don't see** the exact settings mentioned above, Clerk may have changed the UI. Look for:

### Alternative Names
- "Progressive sign-up" might be called: "Multi-step sign-up", "Staged sign-up", "Account completion"
- "Require phone" might be under: "User profile", "Required fields", "Sign-up fields"
- "OAuth settings" might be under: "Social connections", "External accounts", "SSO"

### If You Can't Find It
Look in these sections:
1. **User & authentication** → Main page (top-level settings)
2. **User & authentication** → **User model** (field requirements)
3. **Customization** → **Account Portal** (user profile fields)

---

## How to Test After Configuration

### Test 1: OAuth Flow

```bash
# Open your signup page
open https://jarvisdaily.com/signup

# Click "Continue with Google"
# Expected:
# - Google OAuth popup appears ✓
# - User authenticates ✓
# - Popup closes ✓
# - IMMEDIATELY redirected to /onboarding ✓
# - NO Clerk signup form shown ✗
```

### Test 2: Check User Data

After OAuth completes, verify in Clerk Dashboard → Users:
- ✓ User created with email from Google
- ✓ User has name from Google profile
- ✓ User has metadata: `onboardingCompleted: false`
- ❌ User does NOT have phone yet (will be collected in onboarding)

---

## Troubleshooting

### If OAuth still shows Clerk's form:

**Check**:
1. Cleared browser cache? (Cmd+Shift+R / Ctrl+Shift+R)
2. Saved all settings in Clerk dashboard?
3. Waited 1-2 minutes for changes to propagate?
4. Using correct Clerk instance (`touched-adder-72`)?

**Debug**:
```javascript
// In browser console after OAuth redirect
console.log(window.location.href)
// Should show: /onboarding
// If shows Clerk domain: Configuration not applied yet
```

---

## Quick Checklist

- [ ] Navigate to User & authentication → Phone
- [ ] **UNCHECK** "Require phone number at sign-up"
- [ ] Navigate to User & authentication → Password
- [ ] **UNCHECK** "Require password at sign-up" (or for OAuth users)
- [ ] Navigate to User & authentication → Social connections
- [ ] Verify Google/LinkedIn enabled with auto-join
- [ ] Navigate to Customization → Paths → Sign-up
- [ ] Set "After sign-up" to custom page: `/onboarding`
- [ ] Navigate to Developers → Domains
- [ ] Add `https://jarvisdaily.com`
- [ ] Save all changes
- [ ] Wait 2 minutes
- [ ] Test OAuth flow

---

## Summary

**The Issue**: Clerk configured to collect phone/password from OAuth users (unnecessary rework)

**The Fix**:
1. Disable "Require phone at sign-up"
2. Disable "Require password for OAuth users"
3. Enable instant/auto-join for OAuth
4. Set redirect to `/onboarding`
5. Add domain for CORS

**Expected Result**: OAuth users skip Clerk's form and go straight to your custom onboarding

**Time Required**: 5-10 minutes in Clerk dashboard

---

**Generated**: 2025-10-09
**For**: Current Clerk dashboard (2025 UI)
**Priority**: HIGH (Critical UX issue)
