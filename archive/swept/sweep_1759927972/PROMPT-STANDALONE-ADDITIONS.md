# STANDALONE CONTEXT ADDITIONS FOR EACH PROMPT

**Purpose:** This document contains the context that should be prepended to EACH prompt when running in isolation (different terminal/session).

---

## **UNIVERSAL CONTEXT (Add to EVERY prompt)**

```
═══════════════════════════════════════════════════════════════
UNIVERSAL CONTEXT - READ THIS FIRST BEFORE EVERY PROMPT
═══════════════════════════════════════════════════════════════

PROJECT: JarvisDaily - Grammy-Level Viral WhatsApp Content for Financial Advisors
DOMAIN: https://jarvisdaily.com
TECH STACK: Next.js 15.5.4, Clerk Auth, Supabase, Razorpay, AiSensy, Gemini AI

CURRENT PROJECT STATE:
- Framework: Next.js 15.5.4 with App Router
- Styling: Tailwind CSS + Shadcn UI
- Color Scheme: Black (#0A0A0A) + Gold (#D4AF37)
- Deployment: Vercel with auto-deploy on main branch push
- Repository: Git initialized, connected to GitHub

CRITICAL FILES THAT ALREADY EXIST:
- `/app/page.tsx` - Landing page (v0.dev black/gold design)
- `/middleware.ts` - Clerk route protection
- `/tailwind.config.ts` - Custom gold theme
- `/.env` - All API credentials (see below)
- `/package.json` - Dependencies installed
- `/CLAUDE.md` - Project rules and architecture
- `/COMPLETE-SYSTEM-ARCHITECTURE.md` - Full system design
- `/ULTRA-DETAILED-IMPLEMENTATION-PROMPTS.md` - This file

ENVIRONMENT VARIABLES (Already in .env):
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Twilio SMS (for OTP)
TWILIO_ACCOUNT_SID=AC0a517932a52c35df762a04b521579079
TWILIO_AUTH_TOKEN=75f7c20bc6f18e2a6161541b3a4cc6f3
TWILIO_PHONE_NUMBER=+14155238886

# Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_SOLO_PLAN_ID=plan_...
RAZORPAY_PROFESSIONAL_PLAN_ID=plan_...
RAZORPAY_WEBHOOK_SECRET=whsec_...

# AiSensy WhatsApp
AISENSY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AISENSY_WHATSAPP_NUMBER=918062524496

# Gemini AI (Image Generation)
GEMINI_API_KEY=AIzaSyCUG910mCEcoY8sRZMvu4JGie925KZxRqY

# Cloudinary (Image Hosting)
CLOUDINARY_CLOUD_NAME=dun0gt2bc
CLOUDINARY_API_KEY=812182821573181
CLOUDINARY_API_SECRET=JVrtiKtKTPy9NHbtF2GSI1keKi8

# Vercel Deployment
VERCEL_PROJECT_ID=prj_QQAial59AHSd44kXyY1fGkPk3rkA
VERCEL_ORG_ID=team_kgmzsZJ64NGLaTPyLRBWV3vz

# Cron Jobs
CRON_SECRET=your_generated_secret_here
```

DESIGN SYSTEM:
- Background: #0A0A0A (deep black)
- Primary Accent: #D4AF37 (gold)
- Text: #FFFFFF (white)
- Cards: Black with gold borders (#D4AF37/20)
- Buttons: Gold background (#D4AF37), black text
- Success: Green accent
- Error: Red/destructive variant

BUSINESS LOGIC:
- Trial Period: 14 days (no credit card required)
- Payment Timing: AFTER trial expires
- Content Delivery: Daily at 6 AM IST via WhatsApp
- Content Standard: Grammy-level (9.0+ virality score minimum)
- Plans: Solo (₹1,799/month), Professional (₹4,499/month), Enterprise (Custom)
- Solo Plan: 1 WhatsApp message/day
- Professional Plan: 3 assets/day (LinkedIn + WhatsApp + Status)
- Signup Flow: Phone → OTP → Name/Email → Onboarding → Dashboard

ARCHITECTURE DECISIONS:
- Authentication: Hybrid (Twilio SMS for OTP + Clerk for session + Google OAuth fallback)
- WhatsApp Delivery: AiSensy utility messages (NOT marketing - higher delivery)
- Content Delivery: Manual copy/paste from dashboard (NOT auto-send)
- Payment: Razorpay subscriptions
- Database: Supabase PostgreSQL
- Content Generation: 14-agent Python pipeline with Gemini AI

CRITICAL RULES:
1. NEVER ask user to manually deploy - use git push (auto-deploys via Vercel)
2. NEVER ask for environment variables - they're already in .env
3. ALWAYS maintain black/gold color scheme
4. ALWAYS use Grammy-level standard (9.0+ virality)
5. ALWAYS test locally before deploying
6. ALWAYS commit with detailed messages

DIRECTORY STRUCTURE:
```
/Users/shriyavallabh/Desktop/mvp/
├── app/
│   ├── page.tsx (Landing page - v0.dev design)
│   ├── layout.tsx (Root layout with Clerk)
│   ├── globals.css (Tailwind styles)
│   ├── signup/ (Will create in Phase 1)
│   ├── sign-in/ (Will create in Phase 1)
│   ├── onboarding/ (Will create in Phase 2)
│   ├── dashboard/ (Will create in Phase 3)
│   └── api/ (API routes)
├── components/
│   └── ui/ (Shadcn UI components)
├── lib/
│   └── utils.ts (Utility functions)
├── middleware.ts (Clerk route protection)
├── .env (Environment variables - DO NOT COMMIT)
├── package.json
├── tailwind.config.ts
└── next.config.js
```

═══════════════════════════════════════════════════════════════
END OF UNIVERSAL CONTEXT
═══════════════════════════════════════════════════════════════
```

---

## **PHASE-SPECIFIC CONTEXT ADDITIONS**

### **PHASE 0 CONTEXT (Add before any Phase 0 prompt)**

```
PHASE 0 PREREQUISITES:
- ✅ Landing page already exists at /app/page.tsx
- ✅ v0.dev design already integrated (black/gold theme)
- ✅ Old landing-v1 through landing-v6 already deleted
- ✅ Clerk authentication already configured
- ✅ Tailwind + Shadcn UI already set up

WHAT YOU'RE FIXING IN PHASE 0:
Based on website analysis (screenshots in /website-analysis/), we found 7 clarity gaps:
1. Headline says "WhatsApp Content" but product includes LinkedIn
2. Content quantity mystery (how many assets per day?)
3. Asset type confusion (LinkedIn integration unclear)
4. Grammy-level needs quantifiable backing (9.0+ virality score)
5. Virality score needs explanation
6. Trial transparency missing on pricing cards
7. LinkedIn integration ambiguous

CURRENT LANDING PAGE STATE:
- Hero: "Grammy-Level Viral WhatsApp Content for Financial Advisors"
- Pricing: 3 tiers (Starter ₹1,799, Professional ₹4,499, Enterprise Custom)
- Only 1 testimonial
- No WhatsApp message preview mockup
- Trial badges not prominent enough

FILES YOU'LL MODIFY IN PHASE 0:
- /app/page.tsx (main landing page)
- Possibly /components/landing/* (new components)
```

---

### **PHASE 1 CONTEXT (Add before any Phase 1 prompt)**

```
PHASE 1 PREREQUISITES:
- ✅ Clerk account created (keys in .env)
- ✅ Twilio account created (keys in .env)
- ✅ Vercel KV available (or can use in-memory for testing)
- ✅ Landing page complete (Phase 0)

ARCHITECTURE DECISION (WHY HYBRID):
- Twilio SMS for OTP: 95% delivery rate, ₹0.18/SMS (most reliable in India)
- Clerk for session management: Best-in-class auth UX
- Google OAuth as fallback: For users who prefer social login

AUTHENTICATION FLOW:
1. User enters phone number (+919876543210)
2. Twilio sends SMS with 6-digit OTP
3. User enters OTP (stored in Vercel KV, 5-min expiry)
4. After verification, Clerk creates session
5. User provides name/email
6. Redirect to onboarding

FILES YOU'LL CREATE IN PHASE 1:
- /app/api/auth/send-otp/route.ts (Twilio SMS sender)
- /app/api/auth/verify-otp/route.ts (OTP verifier)
- /app/signup/page.tsx (3-step signup flow)
- /app/sign-in/page.tsx (2-step sign-in flow)
- /app/sso-callback/page.tsx (OAuth callback handler)

CLERK CONFIGURATION:
- Test Mode: Active (no email verification required)
- Production URL: https://finadvise-webhook.vercel.app/signup
- Auth Methods: Email/password, Google OAuth, LinkedIn OAuth (future)
```

---

### **PHASE 2 CONTEXT (Add before any Phase 2 prompt)**

```
PHASE 2 PREREQUISITES:
- ✅ Authentication working (Phase 1 complete)
- ✅ Supabase account created
- ✅ Cloudinary account created (for logo uploads)
- ✅ User can sign up and sign in

SUPABASE DATABASE SCHEMA (Will create in 2.1):
```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  plan TEXT CHECK (plan IN ('solo', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_status TEXT DEFAULT 'trial'
);

-- advisor_profiles table
CREATE TABLE advisor_profiles (
  user_id UUID REFERENCES users(id),
  advisor_type TEXT CHECK (advisor_type IN ('mfd', 'ria', 'insurance')),
  client_count TEXT,
  language_preference TEXT,
  logo_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- content table (for daily generated content)
CREATE TABLE content (
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  linkedin_post TEXT,
  whatsapp_message TEXT,
  status_image_url TEXT,
  virality_score DECIMAL(3,1),
  UNIQUE(user_id, date)
);

-- subscriptions table (Razorpay data)
CREATE TABLE subscriptions (
  user_id UUID REFERENCES users(id),
  razorpay_subscription_id TEXT,
  status TEXT,
  current_start TIMESTAMP,
  current_end TIMESTAMP
);
```

ONBOARDING FLOW (5 STEPS):
1. Advisor type selection (MFD/RIA/Insurance)
2. Client count (0-50, 51-200, 201-500, 500+)
3. Language preference (English, Hindi, Hinglish)
4. Logo upload (optional, to Cloudinary)
5. Plan selection (Solo, Professional, Enterprise)

FILES YOU'LL CREATE IN PHASE 2:
- /lib/supabase.ts (Supabase client)
- /lib/cloudinary.ts (Logo upload utility)
- /app/actions/onboarding.ts (Server actions)
- /app/onboarding/page.tsx (5-step wizard)
- /lib/check-onboarding.ts (Status checker)
- /app/check-redirect/page.tsx (Post-signin routing)

POST-SIGNUP FLOW:
- New user → Signup → Onboarding → Dashboard
- Existing user → Sign-in → Check onboarding status → Dashboard (skip onboarding if already completed)
```

---

### **PHASE 3 CONTEXT (Add before any Phase 3 prompt)**

```
PHASE 3 PREREQUISITES:
- ✅ Authentication working (Phase 1)
- ✅ Onboarding complete (Phase 2)
- ✅ Supabase tables exist (users, advisor_profiles, content)
- ✅ User can complete onboarding and be redirected to dashboard

DASHBOARD PURPOSE:
The dashboard is where advisors:
1. View today's generated content
2. Copy LinkedIn post, WhatsApp message
3. Download WhatsApp Status image
4. Access content history (last 30 days)
5. Manage settings and subscription

PLAN-BASED CONTENT DISPLAY:
- Solo Plan: Shows only 1 WhatsApp message card
- Professional Plan: Shows all 3 cards (LinkedIn + WhatsApp + Status)
- Enterprise Plan: Shows all 3 cards + additional features

DASHBOARD STRUCTURE:
/dashboard/
├── page.tsx (Home - Today's content)
├── layout.tsx (Nav, header, footer)
├── history/
│   └── page.tsx (Past content with date navigation)
├── settings/
│   └── page.tsx (Profile management)
├── upgrade/
│   └── page.tsx (Pricing comparison)
└── checkout/
    └── page.tsx (Razorpay payment - Phase 4)

FILES YOU'LL CREATE IN PHASE 3:
- /app/dashboard/layout.tsx (Header, nav, footer)
- /app/dashboard/page.tsx (Home page)
- /components/dashboard/TrialBanner.tsx (Trial countdown)
- /components/dashboard/ContentCards.tsx (Content display)
- /components/dashboard/HistoryCards.tsx (Past content)
- /components/dashboard/DateNavigator.tsx (Calendar navigation)
- /components/dashboard/SettingsForm.tsx (Profile form)
- /app/dashboard/history/page.tsx (History view)
- /app/dashboard/settings/page.tsx (Settings)
- /app/dashboard/upgrade/page.tsx (Pricing)
- /app/api/settings/update/route.ts (Settings API)

COPY-TO-CLIPBOARD FLOW:
1. User clicks "Copy Post" button
2. Navigator.clipboard.writeText() copies content
3. Toast notification shows "Copied! ✓"
4. Button changes to "Copied!" with checkmark for 2 seconds
5. User pastes in WhatsApp/LinkedIn

TRIAL BANNER LOGIC:
- Show if subscription_status = 'trial'
- Display days left until trial_ends_at
- Hide if subscription_status = 'active' or 'cancelled'
```

---

### **PHASE 4 CONTEXT (Add before any Phase 4 prompt)**

```
PHASE 4 PREREQUISITES:
- ✅ Dashboard complete (Phase 3)
- ✅ Razorpay account created
- ✅ Supabase subscriptions table exists
- ✅ User can access dashboard and see upgrade page

WHY RAZORPAY:
- #1 payment gateway in India (60% market share)
- Supports UPI, cards, net banking, wallets
- Built-in subscription management
- Automatic retry for failed payments
- Regulatory compliant (RBI guidelines)
- Cost: 2% transaction fee (industry standard)

RAZORPAY SUBSCRIPTION PLANS:
- Solo Plan: ₹1,799/month (plan_id: RAZORPAY_SOLO_PLAN_ID)
- Professional Plan: ₹4,499/month (plan_id: RAZORPAY_PROFESSIONAL_PLAN_ID)
- Billing Cycle: Monthly
- Trial: 14 days (handled in app, not Razorpay)

PAYMENT FLOW:
1. User clicks "Upgrade to Professional" on /dashboard/upgrade
2. Redirect to /dashboard/checkout?plan=professional
3. User clicks "Pay ₹4,499/month"
4. Razorpay modal opens (branded with JarvisDaily gold theme)
5. User enters card details (test or real)
6. Payment processed
7. Webhook fired: subscription.activated
8. Supabase updated: subscription_status = 'active'
9. User redirected to dashboard (trial banner removed)

WEBHOOK EVENTS TO HANDLE:
- subscription.activated (first payment successful)
- subscription.charged (recurring payment successful)
- subscription.completed (subscription ended normally)
- subscription.cancelled (user cancelled)
- subscription.paused (payment failed, will retry)
- subscription.halted (payment failed repeatedly)
- payment.failed (single payment attempt failed)

FILES YOU'LL CREATE IN PHASE 4:
- /lib/razorpay.ts (Razorpay client utility)
- /app/api/checkout/create-subscription/route.ts (Create subscription)
- /app/dashboard/checkout/page.tsx (Checkout page)
- /components/checkout/CheckoutForm.tsx (Payment form)
- /app/api/webhooks/razorpay/route.ts (Webhook handler)

WEBHOOK SIGNATURE VERIFICATION:
- CRITICAL: Always verify webhook signature to prevent fraud
- Use crypto.createHmac() with RAZORPAY_WEBHOOK_SECRET
- Reject if signature doesn't match

TEST CARDS (Razorpay Test Mode):
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- Insufficient funds: 4000 0000 0000 9995
- CVV: Any 3 digits
- Expiry: Any future date
```

---

### **PHASE 5 CONTEXT (Add before any Phase 5 prompt)**

```
PHASE 5 PREREQUISITES:
- ✅ Payment integration complete (Phase 4)
- ✅ Users can subscribe and access dashboard
- ✅ AiSensy account created and approved
- ✅ Gemini API key obtained
- ✅ Python 3.x installed
- ✅ 14-agent content generation pipeline exists

DAILY AUTOMATION FLOW:
1. **5:00 AM IST**: Vercel Cron runs /api/cron/generate-content
   - Queries all active subscribers (trial or paid)
   - For each user:
     - Calls 14-agent Python pipeline
     - Generates Grammy-level content (9.0+ virality)
     - Saves to Supabase content table
   - Duration: ~2-3 minutes per user (parallel processing)

2. **6:00 AM IST**: Vercel Cron runs /api/cron/send-notifications
   - Queries users who have content generated today
   - For each user:
     - Sends AiSensy utility message
     - Message: "Your content is ready! Score: 9.2/10"
     - Button: "View Content" → https://jarvisdaily.com/dashboard
   - Duration: ~1 second per user (rate-limited)

3. **6:01-8:00 AM**: Advisors receive WhatsApp notifications
   - Click "View Content" button
   - Redirected to dashboard with welcome banner
   - Copy content and paste in WhatsApp groups/LinkedIn

14-AGENT CONTENT GENERATION PIPELINE:
Existing files (already in project):
- /orchestrate-finadvise.py (Python orchestrator)
- /agents/*.js (14 individual agents)
- /.claude/commands/o.md (Orchestration command)

Agents:
1. Infrastructure: mcp-coordinator, state-manager, communication-bus
2. Data: advisor-data-manager, market-intelligence
3. Analysis: segment-analyzer
4. Content: linkedin-post-generator-enhanced, whatsapp-message-creator, status-image-designer
5. Enhancement: gemini-image-generator, brand-customizer
6. Validation: compliance-validator, quality-scorer, fatigue-checker
7. Distribution: distribution-controller
8. Monitoring: analytics-tracker, feedback-processor

CONTENT QUALITY REQUIREMENTS:
- Minimum virality score: 9.0/10
- If score < 9.0: Auto-regenerate (max 2 attempts)
- If regeneration fails: Use emergency template (9.5+ score)
- Emergency template: Pre-curated high-quality content

AISENSY UTILITY MESSAGE TEMPLATE:
Template Name: daily_content_ready
Category: Utility (NOT Marketing - higher delivery rate)
Header: "Content Ready! 🎯"
Body:
```
Your Grammy-level content for {{1}} is ready!

Today's virality score: {{2}}/10

Click below to view and copy your content.
```
Footer: "JarvisDaily - Viral Content Daily"
Button: "View Content" → https://jarvisdaily.com/dashboard?notification=whatsapp

VERCEL CRON CONFIGURATION:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-content",
      "schedule": "30 23 * * *"  // 11:30 PM UTC = 5:00 AM IST
    },
    {
      "path": "/api/cron/send-notifications",
      "schedule": "30 0 * * *"   // 12:30 AM UTC = 6:00 AM IST
    }
  ]
}
```

FILES YOU'LL CREATE IN PHASE 5:
- /vercel.json (Cron configuration)
- /app/api/cron/generate-content/route.ts (Content generation cron)
- /app/api/cron/send-notifications/route.ts (WhatsApp notification cron)
- /lib/content-generator.ts (Calls Python pipeline)
- /lib/aisensy.ts (AiSensy API client)
- /requirements.txt (Python dependencies for Vercel)

CRON JOB SECURITY:
- CRITICAL: Verify CRON_SECRET in Authorization header
- Prevents unauthorized cron execution
- Vercel adds this header automatically
```

---

## **CONTINUITY FIXES NEEDED**

### **Fix 1: Add Missing Context to Prompt 1.1**

In Prompt 1.1 (Twilio OTP), add this before STEP 1:

```
BEFORE STARTING:
Ensure you have:
1. Twilio account created (free trial is fine)
2. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
3. Vercel KV instance (or use in-memory Map for testing)
4. Clerk account configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)

If you don't have Twilio account yet:
1. Go to https://www.twilio.com/try-twilio
2. Sign up (free $15 credit)
3. Get a phone number (US number is fine for testing)
4. Copy Account SID, Auth Token from Console
5. Add to .env file
```

---

### **Fix 2: Add Missing Context to Prompt 2.1**

In Prompt 2.1 (Supabase DB), add this before STEP 1:

```
BEFORE STARTING:
If you don't have Supabase account yet:
1. Go to https://supabase.com/
2. Sign up (free tier is fine)
3. Create new project (choose region close to your users)
4. Wait 2-3 minutes for project to initialize
5. Go to Settings → API
6. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon/Public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
7. Add to .env file

Database location: Settings → Database → Connection string
SQL Editor: Left sidebar → SQL Editor (to run queries)
```

---

### **Fix 3: Add Missing Context to Prompt 3.3**

In Prompt 3.3 (Toast Notifications), add this before STEP 1:

```
PREREQUISITE CHECK:
This prompt depends on:
- ✅ Prompt 3.1 (Dashboard Layout) completed
- ✅ Prompt 3.2 (Content Cards) completed
- ✅ Shadcn UI toast component installed

If toast component not installed, run:
```bash
npx shadcn-ui@latest add toast
```

This will create:
- /components/ui/toast.tsx
- /components/ui/toaster.tsx
- /components/ui/use-toast.ts
```

---

### **Fix 4: Add Missing Context to Prompt 4.1**

In Prompt 4.1 (Razorpay Setup), add this before STEP 1:

```
RAZORPAY ACCOUNT CREATION TIMELINE:
- Sign up: 5 minutes
- Submit KYC: 10 minutes
- Wait for approval: 2-4 hours (business days)
- Total: ~4 hours

While waiting for approval:
- ✅ You can use Test Mode immediately
- ✅ Generate Test API keys
- ✅ Create test subscription plans
- ✅ Build and test payment flow
- ❌ Cannot accept real payments until KYC approved

KYC REQUIREMENTS (India):
- PAN card
- Bank account details (for settlements)
- Business details (Individual/Sole Proprietorship is fine)
- GST number (optional, but recommended)

If KYC is taking too long:
- Email: support@razorpay.com
- Usually approved within 4 hours during business hours
```

---

### **Fix 5: Add Missing Context to Prompt 5.2**

In Prompt 5.2 (14-Agent Pipeline), add this before STEP 1:

```
PREREQUISITE: PYTHON PIPELINE EXISTS

This prompt assumes you have the 14-agent Python content generation pipeline.

If you DON'T have the pipeline yet:
1. The pipeline files should be in your project root:
   - /orchestrate-finadvise.py
   - /agents/*.js (14 agent files)
   - /.claude/commands/o.md

2. If missing, you have two options:

   OPTION A: Build the pipeline (separate project)
   - See CLAUDE.md for agent details
   - Use the /o slash command to test agents
   - This is a separate 1-week project

   OPTION B: Use simplified mock generator (recommended for MVP)
   - Skip Python integration for now
   - Use GPT/Claude API directly from Node.js
   - See mock implementation in this prompt

For MVP testing, we'll provide a simplified Node.js version that:
- Calls Gemini AI directly for content
- Uses proven viral templates
- Guarantees 9.0+ virality score
- Works without Python
```

---

## **MISSING PROMPTS IDENTIFIED**

### **Missing Prompt: Initial Project Setup**

Should be added as **PROMPT 0.0** (before Phase 0):

```
PROMPT 0.0: Initial Project Setup and Environment Configuration

CONTEXT:
You're starting the JarvisDaily project from scratch. This prompt sets up the entire development environment.

TASK:
Set up Next.js project, install dependencies, configure environment, and verify everything works.

[... detailed steps for project initialization ...]
```

---

### **Missing Prompt: Deployment Configuration**

Should be added as **PROMPT 0.8** (after Phase 0, before Phase 1):

```
PROMPT 0.8: Configure Vercel Deployment and Domain

CONTEXT:
Landing page is complete. Now configure Vercel for auto-deployment and connect custom domain.

TASK:
- Connect GitHub repository to Vercel
- Configure jarvisdaily.com domain
- Set up preview deployments
- Configure environment variables in Vercel

[... detailed steps ...]
```

---

### **Missing Prompt: Error Monitoring Setup**

Should be added as optional **PROMPT 6.1**:

```
PROMPT 6.1: Set Up Error Monitoring and Logging (Optional)

CONTEXT:
System is deployed. Add error monitoring to catch issues before users report them.

OPTIONS:
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (performance monitoring)

[... detailed steps ...]
```

---

## **SUMMARY OF IMPROVEMENTS NEEDED**

1. ✅ **Created PROMPT-EXECUTION-GUIDE.md** (Parallel vs Sequential)
2. ✅ **Created PROMPT-STANDALONE-ADDITIONS.md** (This file)
3. ⚠️ **Need to add context blocks to actual prompts** (see fixes above)
4. ⚠️ **Need to add Prompt 0.0** (Initial Setup)
5. ⚠️ **Need to add Prompt 0.8** (Vercel Configuration)
6. ⚠️ **Need to add simplified Node.js content generator** (Alternative to Python)

---

## **NEXT STEPS FOR YOU**

1. **Read PROMPT-EXECUTION-GUIDE.md** - Understand parallel execution strategy
2. **Read this file (PROMPT-STANDALONE-ADDITIONS.md)** - Understand context needed
3. **Decide**: Will you run prompts sequentially or in parallel?
4. **Verify**: Do you have all required accounts? (Twilio, Supabase, Razorpay, AiSensy)
5. **Start**: Begin with Phase 0 (you mentioned you already started)

---

## **QUESTIONS TO ANSWER**

Before starting, please confirm:

1. **Do you have all API accounts created?**
   - [ ] Twilio (for SMS OTP)
   - [ ] Supabase (for database)
   - [ ] Razorpay (for payments)
   - [ ] AiSensy (for WhatsApp)
   - [ ] Gemini AI (for image generation)
   - [ ] Cloudinary (for image hosting)

2. **Do you have the 14-agent Python pipeline?**
   - [ ] Yes, I have all the agent files
   - [ ] No, I need the simplified Node.js version

3. **How many developers/terminals will you use?**
   - [ ] 1 terminal (sequential execution)
   - [ ] Multiple terminals (parallel execution)
   - [ ] Team of 2-3 developers

4. **Which phases are you prioritizing?**
   - [ ] All phases (complete system)
   - [ ] MVP only (Phases 0-3, basic dashboard)
   - [ ] Custom priority order

Let me know your answers and I'll create the missing prompts and finalize the documentation!
