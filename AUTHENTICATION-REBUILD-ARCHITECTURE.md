# 🏗️ JarvisDaily Authentication System - Complete Rebuild Architecture

**Date**: October 9, 2025
**Scope**: Complete sign-in/sign-up flow with onboarding, persistence, and testing
**Estimated Effort**: 8-10 hours
**Test Coverage**: 1000+ tests across 10 suites

---

## 📊 Current State Analysis

### ✅ What's Working
1. **Clerk Integration**: `touched-adder-72` instance correctly configured in `.env`
2. **Basic Components**: Sign-in/sign-up forms exist with proper UI
3. **OAuth Configured**: Google + LinkedIn strategies implemented
4. **Vercel KV (Redis)**: Already configured (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
5. **Supabase**: Database client ready (`lib/supabase.js`)
6. **No Code Pollution**: Zero `polite-iguana` references, `localhost` only in test files

### ❌ Critical Issues Found

#### 1. Clerk Dashboard Misconfiguration (BLOCKING)
**Problem**: CORS errors + unnecessary signup form after OAuth
**Root Cause**: Domain not whitelisted + phone/password required for OAuth users
**Impact**: Authentication completely broken on production

**Required Fixes**:
- [ ] Add `https://jarvisdaily.com` to Clerk → Developers → Domains
- [ ] Disable "Require phone at sign-up" (User & authentication → Phone)
- [ ] Disable "Require password for OAuth users" (User & authentication → Password)
- [ ] Set after sign-up redirect: `/onboarding`
- [ ] Set after sign-in redirect: `/dashboard`

#### 2. Missing Data Persistence Layer
**Problem**: No Supabase tables, no Google Sheets sync, no form caching
**Current Flow**: User completes onboarding → data stored in Clerk metadata only → never reaches database/sheets

**Required Implementation**:
- [ ] Create Supabase `users` table (extends Clerk users)
- [ ] Create Supabase `advisor_profiles` table (onboarding data)
- [ ] Create Redis form caching (persist across page refreshes)
- [ ] Create Google Sheets bidirectional sync
- [ ] Create server actions for data persistence

#### 3. Incomplete Onboarding Flow
**Current**: 4-step wizard collecting basic data (business info, segments, phone verification)
**Missing**:
- No form persistence (lose data on page refresh)
- No Supabase integration (data not saved to DB)
- No Google Sheets sync (agents can't access advisor data)
- No validation for returning users (always shows wizard)
- No edge case handling (incomplete profiles, OAuth users)

#### 4. Zero Production Testing
**Current**: 17 basic tests (only page loads)
**Required**: 1000+ tests covering:
- All 3 sign-up flows (email, Google, LinkedIn)
- All 3 sign-in flows (email, Google, LinkedIn)
- Onboarding wizard (all 4 steps + variations)
- Form persistence (Redis caching)
- Data persistence (Supabase)
- Google Sheets sync
- UI consistency
- Edge cases and error scenarios

---

## 🎯 Target Architecture

### Authentication Flow (3 Methods)

```
┌─────────────────────────────────────────────────────────────┐
│                    Sign-Up Entry Points                      │
├─────────────────────────────────────────────────────────────┤
│  1. Email/Password  │  2. Google OAuth  │  3. LinkedIn OAuth│
└──────────┬──────────┴─────────┬─────────┴──────────┬────────┘
           │                    │                     │
           ▼                    ▼                     ▼
    ┌─────────────┐      ┌──────────────┐     ┌──────────────┐
    │ Clerk Create│      │ OAuth Consent│     │ OAuth Consent│
    │   Account   │      │  (Google)    │     │  (LinkedIn)  │
    └──────┬──────┘      └──────┬───────┘     └──────┬───────┘
           │                    │                     │
           └────────────────────┼─────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ SSO Callback  │
                        │ (if OAuth)    │
                        └───────┬───────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Check Onboarding Flag │
                    │ (Clerk metadata)      │
                    └──────────┬────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
         onboardingCompleted?            onboardingCompleted?
            = false                          = true
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌──────────────┐
        │  /onboarding  │            │  /dashboard  │
        └───────┬───────┘            └──────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │ Multi-Step Onboarding     │
    │ 1. Welcome + Value Demo   │
    │ 2. Business Details       │
    │ 3. Customer Segmentation  │
    │ 4. Phone Verification     │
    └───────┬───────────────────┘
            │
            ▼
    ┌───────────────────────────┐
    │ Save to:                  │
    │ 1. Clerk (metadata)       │
    │ 2. Supabase (DB)          │
    │ 3. Google Sheets (sync)   │
    └───────┬───────────────────┘
            │
            ▼
    ┌───────────────────────────┐
    │ Redirect to /dashboard    │
    └───────────────────────────┘
```

### Sign-In Flow (Returning Users)

```
┌─────────────────────────────────────────────────────────────┐
│                    Sign-In Entry Points                      │
├─────────────────────────────────────────────────────────────┤
│  1. Email/Password  │  2. Google OAuth  │  3. LinkedIn OAuth│
└──────────┬──────────┴─────────┬─────────┴──────────┬────────┘
           │                    │                     │
           ▼                    ▼                     ▼
    ┌─────────────┐      ┌──────────────┐     ┌──────────────┐
    │ Clerk SignIn│      │ OAuth Consent│     │ OAuth Consent│
    │  Verification│     │  (Auto-link) │     │  (Auto-link) │
    └──────┬──────┘      └──────┬───────┘     └──────┬───────┘
           │                    │                     │
           └────────────────────┼─────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Check Onboarding Flag │
                    └──────────┬────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
         onboardingCompleted?            onboardingCompleted?
            = false                          = true
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌──────────────┐
        │  /onboarding  │            │  /dashboard  │
        │ (resume flow) │            └──────────────┘
        └───────────────┘
```

### Data Persistence Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Multi-Layer Persistence                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
  ┌──────────┐   ┌────────────┐   ┌────────────┐
  │  Redis   │   │  Supabase  │   │   Google   │
  │  (Cache) │   │ (Postgres) │   │   Sheets   │
  └────┬─────┘   └─────┬──────┘   └─────┬──────┘
       │               │                │
       │               │                │
  Form State     Permanent Data    Agent Access
  (5 min TTL)    (users, profiles) (SYNC'd data)
       │               │                │
       │               │                │
  ┌────┴─────────────────────────────────────┐
  │ Use Cases:                                │
  ├───────────────────────────────────────────┤
  │ Redis:                                    │
  │ - Cache form inputs during onboarding    │
  │ - Persist step progress on page refresh  │
  │ - Store uploaded logo temporarily        │
  │ - OTP verification storage               │
  ├───────────────────────────────────────────┤
  │ Supabase:                                 │
  │ - Store user profile permanently         │
  │ - Track subscription status              │
  │ - Manage advisor metadata                │
  │ - Historical content generation data     │
  ├───────────────────────────────────────────┤
  │ Google Sheets:                            │
  │ - Advisors master list (ID, name, ARN)   │
  │ - Content agent reads from this          │
  │ - Bidirectional sync (DB ↔ Sheets)       │
  │ - Manual data override capability        │
  └───────────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan

### Phase 1: Database Schema (30 min)

#### Supabase Tables

**1. `users` table** (extends Clerk users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  plan TEXT CHECK (plan IN ('trial', 'solo', 'professional', 'enterprise')) DEFAULT 'trial',
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
```

**2. `advisor_profiles` table** (onboarding data)
```sql
CREATE TABLE advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  arn TEXT, -- ARN (Advisor Registration Number)
  advisor_code TEXT,
  customer_segments TEXT[], -- ['hni', 'salaried', 'business', 'retirees', 'young']
  phone_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_advisor_profiles_user_id ON advisor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_arn ON advisor_profiles(arn);
```

**3. Auto-update trigger**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisor_profiles_updated_at BEFORE UPDATE ON advisor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Phase 2: Dependencies Installation (10 min)

```bash
npm install @vercel/kv googleapis @google-cloud/storage
npm install @supabase/supabase-js # already installed, verify version
```

### Phase 3: Utility Libraries (1 hour)

**1. `lib/form-cache.ts`** - Redis form persistence
```typescript
import { kv } from '@vercel/kv';

export interface OnboardingFormData {
  businessName?: string;
  arn?: string;
  advisorCode?: string;
  segments?: string[];
  phoneNumber?: string;
  currentStep?: number;
}

export async function cacheFormData(
  userId: string,
  data: OnboardingFormData
): Promise<void> {
  const key = `onboarding:${userId}`;
  await kv.set(key, data, { ex: 300 }); // 5 min expiry
}

export async function getFormData(
  userId: string
): Promise<OnboardingFormData | null> {
  const key = `onboarding:${userId}`;
  return await kv.get(key);
}

export async function clearFormData(userId: string): Promise<void> {
  const key = `onboarding:${userId}`;
  await kv.del(key);
}
```

**2. `lib/google-sheets.ts`** - Bidirectional Sheets sync
```typescript
import { google } from 'googleapis';

const sheets = google.sheets('v4');

interface AdvisorSheetData {
  clerkUserId: string;
  email: string;
  fullName: string;
  businessName?: string;
  arn?: string;
  phone?: string;
  plan: string;
}

export async function syncAdvisorToSheets(
  data: AdvisorSheetData
): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_DRIVE_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  // Check if advisor already exists
  const existingRow = await findAdvisorRow(auth, spreadsheetId, data.email);

  if (existingRow !== null) {
    // Update existing row
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `Sheet1!A${existingRow}:G${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data.clerkUserId,
          data.email,
          data.fullName,
          data.businessName || '',
          data.arn || '',
          data.phone || '',
          data.plan,
        ]],
      },
    });
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data.clerkUserId,
          data.email,
          data.fullName,
          data.businessName || '',
          data.arn || '',
          data.phone || '',
          data.plan,
        ]],
      },
    });
  }
}

async function findAdvisorRow(
  auth: any,
  spreadsheetId: string,
  email: string
): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Sheet1!B:B', // Email column
  });

  const rows = response.data.values || [];
  const index = rows.findIndex((row) => row[0] === email);

  return index !== -1 ? index + 1 : null;
}
```

**3. `app/actions/save-onboarding.ts`** - Server actions
```typescript
'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncAdvisorToSheets } from '@/lib/google-sheets';
import { clearFormData } from '@/lib/form-cache';
import { redirect } from 'next/navigation';

export async function saveOnboardingData(formData: {
  businessName?: string;
  arn?: string;
  advisorCode?: string;
  segments: string[];
  phone: string;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('Unauthorized');
  }

  try {
    // 1. Create or update user in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    let userDbId: string;

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: formData.phone,
        })
        .select('id')
        .single();

      if (userError) throw userError;
      userDbId = newUser.id;
    } else {
      userDbId = existingUser.id;
    }

    // 2. Create/update advisor profile
    const { error: profileError } = await supabaseAdmin
      .from('advisor_profiles')
      .upsert({
        user_id: userDbId,
        business_name: formData.businessName,
        arn: formData.arn,
        advisor_code: formData.advisorCode,
        customer_segments: formData.segments,
        phone_verified: true,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (profileError) throw profileError;

    // 3. Update Clerk metadata
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        onboardingCompleted: true,
        phoneVerified: true,
        phone: formData.phone,
      },
    });

    // 4. Sync to Google Sheets
    await syncAdvisorToSheets({
      clerkUserId: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      businessName: formData.businessName,
      arn: formData.arn,
      phone: formData.phone,
      plan: 'trial',
    });

    // 5. Clear Redis cache
    await clearFormData(userId);

  } catch (error) {
    console.error('[ONBOARDING] Save error:', error);
    throw error;
  }

  // Redirect to dashboard
  redirect('/dashboard');
}
```

### Phase 4: Enhanced Onboarding Component (2 hours)

Key enhancements:
- **Form Caching**: Save to Redis after every field change
- **Resume Flow**: Load cached data on page load
- **Progress Tracking**: Show step progress visually
- **Error Recovery**: Handle network failures gracefully
- **UI Polish**: Smooth transitions, loading states, toast notifications

(Implementation too long for this doc - will be created in `app/onboarding/page.tsx`)

### Phase 5: Comprehensive Testing (4-5 hours)

#### Test Suites (1000+ tests total)

**1. Email/Password Flow** (`tests/auth-email-password.spec.ts`) - 200 tests
- Valid signup variations (all required fields, optional fields)
- Invalid email formats (50 variations)
- Weak passwords (50 variations)
- Existing email handling
- Form validation messages
- Loading states
- Success redirects

**2. Google OAuth Flow** (`tests/auth-google-oauth.spec.ts`) - 200 tests
- New user OAuth signup
- Existing user OAuth sign-in
- Account linking (OAuth → Email/Password)
- Consent screen handling
- Cancel flow handling
- Network error recovery
- Redirect validation

**3. LinkedIn OAuth Flow** (`tests/auth-linkedin-oauth.spec.ts`) - 200 tests
- (Same as Google OAuth)

**4. Onboarding Wizard** (`tests/onboarding-wizard.spec.ts`) - 200 tests
- Step 1: Welcome screen
- Step 2: Business details (all permutations)
- Step 3: Segmentation (all combinations)
- Step 4: Phone verification (OTP flow)
- Back button navigation
- Forward button validation
- Skip optional fields
- Required field validation

**5. Form Persistence** (`tests/form-persistence.spec.ts`) - 100 tests
- Save on field change
- Restore on page refresh
- Clear on completion
- Expiry after 5 minutes
- Multiple browser tabs
- Network failure recovery

**6. Postgres Validation** (`tests/postgres-validation.spec.ts`) - 100 tests
- User record creation
- Profile record creation
- Data integrity checks
- Duplicate handling
- Cascade deletions
- Foreign key constraints

**7. Google Sheets Sync** (`tests/sheets-sync.spec.ts`) - 50 tests
- New advisor insertion
- Existing advisor update
- Email deduplication
- Error handling
- Sync timing validation

**8. UI Consistency** (`tests/ui-consistency.spec.ts`) - 100 tests
- Color palette compliance
- Typography consistency
- Spacing and layout
- Mobile responsiveness
- Button states
- Form field styling

**9. Edge Cases** (`tests/edge-cases.spec.ts`) - 100 tests
- Network timeouts
- Database connection errors
- Redis unavailability
- Google Sheets API failures
- Clerk API errors
- Missing environment variables
- Race conditions

**10. Visual Regression** (`tests/visual-regression.spec.ts`) - 50 tests
- Screenshot comparisons for all pages
- Mobile vs Desktop views
- Light/Dark mode (if applicable)
- Form states (empty, filled, error, success)

---

## 📋 Manual Clerk Dashboard Configuration

**⚠️ CRITICAL: These steps MUST be completed manually before testing**

1. **Go to**: https://dashboard.clerk.com
2. **Select**: `touched-adder-72` project
3. **Navigate**: Developers → Domains
4. **Add domain**: `https://jarvisdaily.com`
5. **Navigate**: User & authentication → Phone
6. **Uncheck**: "Require phone number at sign-up"
7. **Navigate**: User & authentication → Password
8. **Uncheck**: "Require password at sign-up" (for OAuth users)
9. **Navigate**: Customization → Paths
10. **Set "After sign-up"**: Custom page → `/onboarding`
11. **Set "After sign-in"**: Custom page → `/dashboard`
12. **Save all changes**

**Verification**:
- No CORS errors on `jarvisdaily.com`
- OAuth redirects directly to `/onboarding` (no Clerk signup form)
- No phone/password asked after OAuth authentication

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All 1000+ tests passing locally
- [ ] Visual regression tests passing
- [ ] Clerk dashboard configured
- [ ] Environment variables verified
- [ ] Supabase schema created
- [ ] Google Sheets template ready

### Deployment Steps
1. **Commit changes**: `git add . && git commit -m "feat: complete authentication rebuild with onboarding + persistence"`
2. **Push to GitHub**: `git push origin main`
3. **Manual Vercel deploy**:
   ```bash
   VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" \
   VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" \
   vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes
   ```
4. **Verify deployment**: `vercel logs --follow`
5. **Run production smoke tests**: `npx playwright test --project=production`

### Post-Deployment Validation
- [ ] https://jarvisdaily.com/signup loads correctly
- [ ] Email/password signup works end-to-end
- [ ] Google OAuth works without extra form
- [ ] LinkedIn OAuth works without extra form
- [ ] Onboarding wizard completes successfully
- [ ] Data appears in Supabase
- [ ] Data appears in Google Sheets
- [ ] Dashboard redirect works for signed-in users
- [ ] Sign-out and re-sign-in works

---

## 🎯 Success Criteria

1. **✅ Zero CORS Errors**: jarvisdaily.com authenticates without errors
2. **✅ OAuth UX Perfect**: No duplicate signup forms after Google/LinkedIn auth
3. **✅ Form Persistence**: Data survives page refreshes during onboarding
4. **✅ Data Integrity**: Every signup creates records in Supabase + Google Sheets
5. **✅ Test Coverage**: 1000+ tests, 100% passing
6. **✅ Production Validated**: All flows tested on live URL
7. **✅ Performance**: <3s page loads, <1s form interactions
8. **✅ UI Consistency**: Matches design system across all screens

---

## 📚 Key Learnings

1. **Clerk Auto-Linking**: Prevents duplicate accounts automatically when users sign in via different methods
2. **Progressive Forms**: Clerk's API supports multi-step forms natively - no need to pass all data at once
3. **Redis for UX**: Form caching dramatically improves UX for slow connections
4. **Supabase + Sheets**: Bidirectional sync gives best of both worlds (database + manual editing)
5. **OAuth Redirect Config**: Clerk dashboard settings override code - must configure both
6. **Test Early, Test Often**: 1000+ tests catch issues before production

---

## 🔗 Related Documentation

- [CLERK-OAUTH-FIX-UPDATED.md](./CLERK-OAUTH-FIX-UPDATED.md) - Clerk dashboard configuration guide
- [AUTH-TESTING-REPORT.md](./AUTH-TESTING-REPORT.md) - Previous testing session findings
- [COMPLETE-SEQUENTIAL-GUIDE.md](./archive/swept/sweep_1759977929/COMPLETE-SEQUENTIAL-GUIDE.md) - Phase-by-phase implementation guide
- [CLAUDE.md](./CLAUDE.md) - Project overview and automation rules

---

**End of Architecture Document**
