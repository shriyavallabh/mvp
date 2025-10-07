# Clerk Authentication Setup - Complete Guide

## ✅ What's Been Configured

### 1. **Clerk SDK Installed**
```bash
npm install @clerk/clerk-sdk-node
```

### 2. **Environment Variables Added to `.env`**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG91Y2hlZC1hZGRlci03Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_NSI6Ch5M4SvObAMkj4rNpQwjSbc23XN8tG1zY0LFiC
```

### 3. **Files Created**

#### `/api/auth-dashboard.js`
- Clerk-protected API endpoint
- Authenticates users via Clerk session token
- Returns advisor-specific content

#### `/public/auth-dashboard.html`
- Beautiful authentication UI
- Clerk sign-in component
- Protected dashboard with content

### 4. **Routes Added to `vercel.json`**
```json
{
  "src": "/auth-dashboard",
  "dest": "/public/auth-dashboard.html"
},
{
  "src": "/api/auth-dashboard",
  "dest": "/api/auth-dashboard"
}
```

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables in Vercel

**Go to:** https://vercel.com/shriyavallabhs-projects/your-project/settings/environment-variables

**Add these variables:**

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   ```
   pk_test_dG91Y2hlZC1hZGRlci03Mi5jbGVyay5hY2NvdW50cy5kZXYk
   ```
   - Type: Plain Text
   - Environments: Production, Preview, Development

2. **CLERK_SECRET_KEY**
   ```
   sk_test_NSI6Ch5M4SvObAMkj4rNpQwjSbc23XN8tG1zY0LFiC
   ```
   - Type: Sensitive (encrypted)
   - Environments: Production, Preview, Development

### Step 2: Deploy to Vercel

```bash
git add .
git commit -m "Add Clerk authentication to dashboard"
git push
```

Vercel will auto-deploy.

---

## 🔧 How It Works

### Authentication Flow

1. **User visits:** `https://jarvisdaily.com/auth-dashboard?phone=919765071249`

2. **Clerk checks authentication:**
   - If signed in → Load dashboard
   - If not signed in → Show sign-in form

3. **After sign-in:**
   - Clerk issues session token
   - Dashboard fetches content from `/api/auth-dashboard`
   - API validates token and returns personalized content

4. **User sees:**
   - WhatsApp message (copy button)
   - LinkedIn post (copy button)
   - Status image (download button)
   - Sign out button

---

## 📱 User Management

### Adding Advisors as Users

**Option 1: Manual Invitation (Recommended)**

1. Go to: https://dashboard.clerk.com/apps/app_33dt7MAuJcNxu5QlJICAJM0TYxO/instances/ins_33dt7P2XuG6MT2gR9jdz2yqvxQy/users

2. Click "Create User"

3. Enter advisor details:
   ```
   Email: shriya@example.com
   Phone: +919765071249
   First Name: Shriya
   Last Name: Petkar
   ```

4. Click "Create" → User receives invite email

**Option 2: Self Sign-Up**

1. Enable in Clerk dashboard:
   - Go to: User & Authentication → Email/Phone/Username
   - Enable desired sign-up methods

2. Advisors visit: `https://jarvisdaily.com/auth-dashboard`

3. They sign up with their phone/email

### Linking Phone Numbers

To map Clerk users to advisors in `/data/advisors.json`:

**Method 1: User Metadata (Recommended)**

In Clerk dashboard, add custom metadata:
```json
{
  "phone": "919765071249",
  "advisorId": "shriya_vallabh_petkar"
}
```

**Method 2: Use Primary Phone**

API automatically checks:
- User's public metadata phone
- User's primary phone number
- Query parameter phone

---

## 🔐 Security Features

### What's Protected
✅ Dashboard content access (auth required)
✅ API endpoints (Clerk session validation)
✅ User-specific content (phone number matching)

### What's Public
✅ Webhook (`/api/webhook`) - Meta needs access
✅ Privacy/Terms pages
✅ Health check endpoint

---

## 📊 URLs Overview

### Public URLs (No Auth)
```
https://jarvisdaily.com/dashboard - Old public dashboard
https://jarvisdaily.com/webhook - WhatsApp webhook
https://jarvisdaily.com/privacy - Privacy policy
https://jarvisdaily.com/terms - Terms of service
```

### Protected URLs (Clerk Auth Required)
```
https://jarvisdaily.com/auth-dashboard - New protected dashboard
https://jarvisdaily.com/api/auth-dashboard - Protected API
```

---

## 🧪 Testing

### Test Locally

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:**
   ```
   http://localhost:3000/auth-dashboard?phone=919765071249
   ```

3. **Sign in** with test account (create in Clerk dashboard first)

4. **Should see:**
   - Personalized greeting
   - WhatsApp message
   - LinkedIn post
   - Status image

### Test on Production

1. **Deploy to Vercel** (environment variables set)

2. **Visit:**
   ```
   https://jarvisdaily.com/auth-dashboard?phone=919765071249
   ```

3. **Sign in** and verify content loads

---

## 🔄 Switching Between Dashboards

### Public Dashboard (No Auth)
**Use when:** You want quick access without login
**URL:** `https://jarvisdaily.com/dashboard?phone=919765071249`

### Authenticated Dashboard (Clerk)
**Use when:** You want secure, user-based access
**URL:** `https://jarvisdaily.com/auth-dashboard?phone=919765071249`

You can use **both** simultaneously!

---

## 🎨 Customization

### Clerk UI Theming

In `auth-dashboard.html`, update Clerk appearance:

```javascript
clerkInstance.mountSignIn(document.getElementById('clerk-sign-in'), {
  appearance: {
    elements: {
      rootBox: 'w-full',
      card: 'bg-white shadow-xl rounded-2xl',
      formButtonPrimary: 'bg-gradient-to-r from-purple-500 to-indigo-600'
    }
  }
});
```

### Sign-In Methods

Enable/disable in Clerk dashboard:
- Email + Password
- Email OTP
- Phone (SMS)
- Google OAuth
- More...

---

## 🐛 Troubleshooting

### Issue: "Unauthorized - Please sign in"
**Solution:**
- Check environment variables are set in Vercel
- Verify Clerk keys are correct
- Ensure user is signed in

### Issue: "Advisor not found"
**Solution:**
- Check phone number format (should be 919765071249)
- Verify advisor exists in `/data/advisors.json`
- Check user metadata has correct phone

### Issue: Sign-in button not showing
**Solution:**
- Check browser console for Clerk JS errors
- Verify publishable key is correct
- Check network tab for blocked requests

---

## 📈 Next Steps

### 1. **Add More Sign-In Methods**
Go to Clerk dashboard → User & Authentication → Enable OAuth providers

### 2. **Set Up Email Notifications**
Configure Clerk emails for password reset, verification, etc.

### 3. **Add Multi-Factor Authentication (MFA)**
Enable in Clerk dashboard for extra security

### 4. **Custom User Roles**
Create roles like "advisor", "admin", "viewer" using Clerk metadata

### 5. **Analytics Integration**
Track sign-ins, dashboard views with Clerk webhooks

---

## 📞 Support

**Clerk Dashboard:** https://dashboard.clerk.com/apps/app_33dt7MAuJcNxu5QlJICAJM0TYxO

**Clerk Docs:** https://clerk.com/docs

**Your Instance:** Test environment (use production keys for live)

---

## ✅ Summary

**What You Have:**
- ✅ Clerk authentication fully integrated
- ✅ Protected dashboard at `/auth-dashboard`
- ✅ Public dashboard still available at `/dashboard`
- ✅ Environment variables configured locally
- ✅ Ready to deploy to Vercel

**What You Need to Do:**
1. Set environment variables in Vercel dashboard
2. Deploy to production
3. Add users in Clerk dashboard
4. Share protected dashboard link with advisors

**Result:**
Secure, beautiful authentication for your advisor dashboard! 🎉
