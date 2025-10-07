# 🔧 Vercel Environment Variables Setup

## ⚠️ CRITICAL: Production Signup Not Working Without These

Your local dev works, but **production (jarvisdaily.com) won't work** until you add Clerk keys to Vercel.

---

## 🚀 Quick Fix (5 minutes)

### **Step 1: Go to Vercel Dashboard**

1. Visit: https://vercel.com/dashboard
2. Select your project: **finadvise-webhook**
3. Click **Settings** → **Environment Variables**

### **Step 2: Add Clerk Keys**

Add these **TWO** environment variables:

#### **Variable 1:**
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_dG91Y2hlZC1hZGRlci03Mi5jbGVyay5hY2NvdW50cy5kZXYk
Environment: Production, Preview, Development (select all)
```

#### **Variable 2:**
```
Name: CLERK_SECRET_KEY
Value: sk_test_NSI6Ch5M4SvObAMkj4rNpQwjSbc23XN8tG1zY0LFiC
Environment: Production, Preview, Development (select all)
```

### **Step 3: Redeploy**

After adding environment variables:

**Option A: Via Dashboard**
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **Redeploy** button

**Option B: Via Git Push**
```bash
git add .env.production
git commit -m "Add Clerk environment variables"
git push origin clean-gemini-implementation
```

Vercel will auto-deploy with new environment variables.

---

## ✅ Verification

After redeployment (2-3 minutes):

1. Visit: https://jarvisdaily.com/signup
2. Fill in signup form:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Password: TestPassword123!
   - Check terms box
3. Click **Create Account**

**Expected:**
- ✅ "Account created! Please check your email for verification code."
- ✅ Redirects to `/verify-email`
- ✅ Email sent from Clerk

**If Still Failing:**
- Check browser console for errors
- Verify Clerk keys are correct in Vercel dashboard
- Make sure deployment completed successfully

---

## 🔍 Troubleshooting

### Issue: "Failed to create account"

**Possible Causes:**
1. ❌ Environment variables not set in Vercel
2. ❌ Deployment didn't include new environment variables
3. ❌ Clerk publishable key domain mismatch

**Solution:**
1. Verify env vars in Vercel dashboard
2. Force redeploy
3. Check Clerk dashboard allowed domains include `jarvisdaily.com`

### Issue: "publishableKey is required"

**Solution:**
- Environment variable name must be **exactly**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Must start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding

### Issue: Signup works locally but not in production

**Solution:**
- This is **exactly** the environment variable issue
- Local uses `.env.local`
- Production uses Vercel environment variables
- **Must** add keys to Vercel dashboard

---

## 📋 Vercel Environment Variables Checklist

After adding environment variables in Vercel:

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` added
- [ ] `CLERK_SECRET_KEY` added
- [ ] Both set for: Production, Preview, Development
- [ ] Redeployed the application
- [ ] Deployment completed successfully
- [ ] Tested signup on https://jarvisdaily.com/signup
- [ ] Account creation works
- [ ] Email verification sent

---

## 🎯 Expected Behavior After Fix

### **Before Fix (Current):**
❌ Visit jarvisdaily.com/signup
❌ Fill form and click "Create Account"
❌ Error: "Failed to create account. Please try again."
❌ Console: "publishableKey is required" or Clerk initialization error

### **After Fix:**
✅ Visit jarvisdaily.com/signup
✅ Fill form and click "Create Account"
✅ Success: "Account created! Please check your email..."
✅ Redirects to verification page
✅ Email sent from Clerk with verification code

---

## 🔐 Security Note

**DO NOT** commit `.env.local` or `.env.production` to Git if they contain sensitive keys.

Current `.gitignore` should already exclude:
```
.env*.local
.env.production
```

Vercel environment variables are **secure** and **encrypted**.

---

## 📞 Need Help?

If signup still doesn't work after adding Vercel env vars:

1. Check Vercel deployment logs:
   ```bash
   vercel logs --follow
   ```

2. Check browser console on production site

3. Verify Clerk Dashboard settings:
   - Go to https://dashboard.clerk.com/
   - Check **Allowed Redirect URLs**
   - Check **Allowed Origins**
   - Make sure `jarvisdaily.com` is listed

---

**Status:** ⏳ Awaiting Vercel Environment Variable Setup
**Time Required:** 5 minutes
**Priority:** 🔴 CRITICAL - Production signup broken without this
