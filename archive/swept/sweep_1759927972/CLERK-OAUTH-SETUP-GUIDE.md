# 🔧 Clerk OAuth Setup Guide - Fix Google & LinkedIn Login

## ❌ Current Issue

The Google and LinkedIn login buttons are **not working** because:

1. ✅ Code implementation is correct
2. ❌ Clerk OAuth providers are not configured in Clerk Dashboard
3. ❌ Missing proper Clerk API keys in environment variables

---

## ✅ Solution: 3-Step Fix (15 minutes)

### **Step 1: Get Real Clerk API Keys (5 min)**

1. Go to: https://dashboard.clerk.com/
2. Sign in to your Clerk account
3. Select your application (or create new one)
4. Go to **API Keys** section
5. Copy these keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_` or `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_` or `sk_test_`)

6. **Update `.env.local` file:**

```bash
# Replace these with your REAL Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_HERE
```

---

### **Step 2: Enable OAuth Providers in Clerk Dashboard (5 min)**

#### **Enable Google OAuth:**

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Find **Google** and click **Enable**
3. Configure Google OAuth:
   - **Option A (Recommended):** Use Clerk's development credentials (for testing)
   - **Option B:** Add your own Google OAuth credentials:
     - Go to https://console.cloud.google.com/
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URI: `https://YOUR_DOMAIN.clerk.accounts.dev/v1/oauth_callback`
4. Click **Save**

#### **Enable LinkedIn OAuth:**

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Find **LinkedIn** and click **Enable**
3. Configure LinkedIn OAuth:
   - **Option A (Recommended):** Use Clerk's development credentials (for testing)
   - **Option B:** Add your own LinkedIn OAuth credentials:
     - Go to https://www.linkedin.com/developers/
     - Create OAuth 2.0 Application
     - Add redirect URL: `https://YOUR_DOMAIN.clerk.accounts.dev/v1/oauth_callback`
4. Click **Save**

---

### **Step 3: Add Allowed Redirect URLs (5 min)**

1. In Clerk Dashboard, go to **Paths**
2. Add these redirect URLs:
   - After sign-up: `/dashboard`
   - After sign-in: `/dashboard`
   - After SSO callback: `/sso-callback`

3. In **Allowed origins**, add:
   - `http://localhost:3001` (for development)
   - `https://jarvisdaily.com` (for production)
   - `https://finadvise-webhook.vercel.app` (Vercel deployment)

---

## 🧪 Testing OAuth After Setup

### **Test 1: Local Development**

```bash
# Restart the dev server to load new env variables
npm run dev
```

1. Visit: http://localhost:3001/signup
2. Click **Google** button
3. Should open Google login popup
4. After login, should redirect to `/dashboard`

### **Test 2: Production**

1. Deploy to Vercel:
```bash
git add .env.local
git commit -m "Add Clerk OAuth configuration"
git push origin clean-gemini-implementation
```

2. **Set environment variables in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
   - **Redeploy** the application

3. Visit: https://jarvisdaily.com/signup
4. Test Google and LinkedIn login

---

## 🔍 Troubleshooting

### Issue: "OAuth provider not configured"

**Solution:**
- Make sure you enabled Google/LinkedIn in Clerk Dashboard
- Check that Social Connections are **active** (toggle switch is ON)

### Issue: "Invalid redirect URI"

**Solution:**
- In Clerk Dashboard → **Paths**, add `/sso-callback`
- In Google/LinkedIn OAuth app, add Clerk's callback URL

### Issue: Popup blocked

**Solution:**
- Allow popups for jarvisdaily.com in browser settings
- Or use redirect flow instead of popup

### Issue: "publishableKey is required"

**Solution:**
- Check `.env.local` file has correct Clerk keys
- Restart dev server after updating `.env.local`
- In Vercel, check Environment Variables are set

---

## 📝 Updated Code Implementation

The code has been updated with proper error handling:

```typescript
const handleGoogleSignIn = async () => {
  try {
    if (!signUp) {
      console.error('SignUp not initialized');
      return;
    }
    await signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard'
    });
  } catch (err: any) {
    console.error('Google sign in error:', err);
    setError(err.errors?.[0]?.message || 'Failed to authenticate with Google');
  }
};
```

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] Clerk API keys added to `.env.local`
- [ ] Dev server restarted
- [ ] Google enabled in Clerk Dashboard
- [ ] LinkedIn enabled in Clerk Dashboard
- [ ] Allowed redirect URLs configured
- [ ] Allowed origins include your domains
- [ ] Environment variables set in Vercel
- [ ] Local test: Google login works
- [ ] Local test: LinkedIn login works
- [ ] Production test: Google login works
- [ ] Production test: LinkedIn login works

---

## 🎯 Expected Behavior After Fix

### **Before Fix:**
❌ Click Google button → Nothing happens
❌ Click LinkedIn button → Nothing happens
❌ Console shows: "SignUp not initialized" or "OAuth provider not configured"

### **After Fix:**
✅ Click Google button → Opens Google login popup
✅ Click LinkedIn button → Opens LinkedIn login popup
✅ After successful login → Redirects to `/dashboard`
✅ User account created in Clerk
✅ Can sign in again using same provider

---

## 🚀 Quick Test Command

Run integration tests to verify:

```bash
npm run dev

# In another terminal:
npx playwright test tests/signup-integration.spec.js
```

Expected results after fix:
- Test 007: Google button visible ✅
- Test 008: Google OAuth triggers ✅
- Test 009: LinkedIn button visible ✅
- Test 010: LinkedIn OAuth triggers ✅

---

## 📞 Need Help?

If OAuth still doesn't work after following this guide:

1. Check Clerk Dashboard logs for OAuth errors
2. Check browser console for JavaScript errors
3. Verify environment variables are loaded:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
   ```
4. Make sure Clerk SDK is loaded:
   ```javascript
   console.log(window.Clerk)
   ```

---

## 📚 Additional Resources

- [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections/overview)
- [Google OAuth Setup](https://clerk.com/docs/authentication/social-connections/google)
- [LinkedIn OAuth Setup](https://clerk.com/docs/authentication/social-connections/linkedin)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)

---

**Status:** ⏳ Awaiting Clerk Dashboard Configuration
**Priority:** 🔴 HIGH - Required for OAuth functionality
**Time Required:** ~15 minutes
**Difficulty:** ⭐⭐ Easy (just configuration, no coding)
