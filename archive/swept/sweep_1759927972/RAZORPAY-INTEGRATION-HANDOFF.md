# 🎯 RAZORPAY INTEGRATION - AGENT HANDOFF PROMPT

**Date:** October 8, 2025
**Project:** JarvisDaily - AI-powered WhatsApp content distribution SaaS
**Task:** Complete Razorpay subscription integration with 14-day free trials
**Priority:** HIGH - This is critical for payment flow

---

## 📋 CONTEXT: WHAT'S ALREADY DONE

### **✅ Completed:**
1. **Deep market research** completed (see `JARVISDAILY-PRICING-STRATEGY-2025.md`)
2. **Final pricing decided:**
   - Solo: ₹999/month
   - Professional: ₹2,499/month (Most Popular)
   - Enterprise: ₹4,999/month
3. **Trial strategy decided:** 14-day free trial with payment method required upfront (Option 1)
4. **Razorpay account:** Already active (LIVE mode, KYC verified)
5. **Basic project setup:** Next.js 15, Clerk auth, Supabase DB, Vercel deployment
6. **Complete implementation guide:** See `COMPLETE-SEQUENTIAL-GUIDE.md` (Prompts 4.1-4.4)

### **🔄 In Progress:**
1. User is creating 3 Razorpay plans (Solo, Professional, Enterprise)
2. Waiting for 3 Plan IDs to be shared

### **❌ Not Started:**
1. Razorpay SDK integration in Next.js app
2. Subscription creation API with trial logic
3. Webhook handler for payment events
4. Trial countdown in dashboard
5. Subscription management UI (upgrade/cancel)

---

## 🎯 YOUR TASK: COMPLETE RAZORPAY INTEGRATION

### **WHAT YOU NEED FROM USER FIRST:**

Ask user to share these 4 items:

```
Solo Plan ID:          plan_________________
Professional Plan ID:  plan_________________
Enterprise Plan ID:    plan_________________
Webhook Secret:        whsec_________________
```

**Where user gets these:**
- Plan IDs: Razorpay Dashboard → Subscriptions → Plans (after creating plans)
- Webhook Secret: Razorpay Dashboard → Settings → Webhooks → Create Webhook → Copy secret

---

## 📊 FINAL PRICING & FEATURES (IMPORTANT!)

### **Plan 1: Solo - ₹999/month**
**Features:**
- 1 LinkedIn post daily (9.0+ virality score)
- 1 WhatsApp message daily (300-400 chars)
- 1 WhatsApp Status image daily (1080×1920px, branded)
- SEBI compliance validation
- ARN disclaimer auto-added
- 7-day content history
- **Total:** 90 assets/month

**Trial:** 14 days free, payment method required upfront

### **Plan 2: Professional - ₹2,499/month** ⭐ MOST POPULAR
**Features (All Solo features +):**
- **1 AI Avatar Reel daily (30-60 sec video)** 🆕 KEY DIFFERENTIATOR
- Voice cloning (avatar speaks in advisor's voice)
- Auto-generated reel scripts
- Premium branding (logo overlay, custom colors)
- 30-day content history
- Priority email support
- **Total:** 120 assets/month (including 30 reels)

**Trial:** 14 days free, payment method required upfront

### **Plan 3: Enterprise - ₹4,999/month**
**Features (All Professional features +):**
- Multi-brand support (up to 3 advisor profiles)
- API access for CRM integration
- White-label branding (remove "Powered by JarvisDaily")
- Dedicated account manager
- Priority phone support (2-hour SLA)
- Custom compliance rules
- Unlimited content history
- **Total:** 360 assets/month (3 advisors × 120 assets)

**Trial:** 14 days free, payment method required upfront

---

## 🔧 TECHNICAL IMPLEMENTATION REQUIREMENTS

### **STEP 1: UPDATE ENVIRONMENT VARIABLES**

Add to `.env`:

```bash
# Razorpay (LIVE Mode - already configured)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx  # User already has this
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx  # User already has this
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx  # User will provide this

# Plan IDs (you'll add these after user shares)
RAZORPAY_SOLO_PLAN_ID=plan_xxxxxxxxxxxx
RAZORPAY_PROFESSIONAL_PLAN_ID=plan_xxxxxxxxxxxx
RAZORPAY_ENTERPRISE_PLAN_ID=plan_xxxxxxxxxxxx
```

### **STEP 2: INSTALL RAZORPAY SDK**

```bash
npm install razorpay
```

### **STEP 3: CREATE RAZORPAY CLIENT LIBRARY**

Create `lib/razorpay.ts`:

```typescript
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan IDs
export const PLANS = {
  solo: process.env.RAZORPAY_SOLO_PLAN_ID!,
  professional: process.env.RAZORPAY_PROFESSIONAL_PLAN_ID!,
  enterprise: process.env.RAZORPAY_ENTERPRISE_PLAN_ID!,
};
```

### **STEP 4: CREATE SUBSCRIPTION API WITH TRIAL LOGIC**

Create `app/api/checkout/create-subscription/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { razorpay, PLANS } from '@/lib/razorpay';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await request.json(); // 'solo' | 'professional' | 'enterprise'

    // Get user data from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get plan ID
    const planId = PLANS[planType as keyof typeof PLANS];
    if (!planId) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Create Razorpay customer (if not exists)
    let customerId = user.razorpay_customer_id;

    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: user.full_name,
        email: user.email,
        contact: user.phone,
        notes: {
          user_id: userId,
          company: user.company_name || '',
          arn: user.arn || '',
        },
      });
      customerId = customer.id;

      // Save customer ID to Supabase
      await supabase
        .from('users')
        .update({ razorpay_customer_id: customerId })
        .eq('id', userId);
    }

    // Create subscription with 14-day trial
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1, // Send email to customer
      quantity: 1,
      total_count: 0, // 0 = unlimited billing cycles
      start_at: Math.floor(Date.now() / 1000) + 60, // Start in 60 seconds
      addons: [],
      notes: {
        user_id: userId,
        plan_type: planType,
        started_at: new Date().toISOString(),
      },

      // ⭐ CRITICAL: 14-DAY FREE TRIAL WITH PAYMENT UPFRONT ⭐
      trial_period: 14, // 14 days free
      trial_amount: 0,   // ₹0 charge during trial
    });

    // Save subscription details to Supabase
    await supabase
      .from('users')
      .update({
        plan_type: planType,
        razorpay_subscription_id: subscription.id,
        subscription_status: 'trialing', // Status during trial
        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Return subscription details to frontend
    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      short_url: subscription.short_url, // Razorpay checkout URL
      plan_type: planType,
      trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Subscription creation failed:', error);
    return NextResponse.json(
      {
        error: 'Subscription creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### **STEP 5: CREATE WEBHOOK HANDLER**

Create `app/api/webhooks/razorpay/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    console.log('[Razorpay Webhook] Event:', event.event, event.payload);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.payment.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      default:
        console.log('[Razorpay Webhook] Unhandled event:', event.event);
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('[Webhook] Subscription activated:', subscription.id);

  const userId = subscription.notes.user_id;

  // Update user subscription status (trial ended, now active)
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      trial_end_date: null, // Trial is over
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionCharged(payment: any) {
  console.log('[Webhook] Payment charged:', payment.id);

  // Log payment in database
  await supabase.from('payments').insert({
    payment_id: payment.id,
    subscription_id: payment.subscription_id,
    amount: payment.amount / 100, // Convert paise to rupees
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    created_at: new Date(payment.created_at * 1000).toISOString(),
  });

  // Update user's last payment date
  await supabase
    .from('users')
    .update({
      last_payment_date: new Date(payment.created_at * 1000).toISOString(),
      subscription_status: 'active',
    })
    .eq('razorpay_subscription_id', payment.subscription_id);
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('[Webhook] Subscription cancelled:', subscription.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      plan_type: null,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('[Webhook] Subscription paused:', subscription.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('[Webhook] Subscription resumed:', subscription.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionCompleted(subscription: any) {
  console.log('[Webhook] Subscription completed:', subscription.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handlePaymentFailed(payment: any) {
  console.log('[Webhook] Payment failed:', payment.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', payment.subscription_id);
}

// GET handler for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Razorpay webhook endpoint active' });
}
```

### **STEP 6: UPDATE PRICING PAGE WITH "START FREE TRIAL" BUTTONS**

Update `app/dashboard/upgrade/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleStartTrial = async (planType: 'solo' | 'professional' | 'enterprise') => {
    setLoading(planType);

    try {
      const response = await fetch('/api/checkout/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();

      // Redirect to Razorpay checkout page
      if (data.short_url) {
        window.location.href = data.short_url;
      }
    } catch (error) {
      console.error('Subscription creation failed:', error);
      alert('Failed to start trial. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#D4AF37]">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Start your 14-day free trial. No credit card required upfront.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Solo Plan */}
          <Card className="bg-black border-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all">
            <CardHeader>
              <CardTitle className="text-2xl text-[#D4AF37]">Solo</CardTitle>
              <CardDescription>For individual advisors</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹999</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>1 LinkedIn post daily (9.0+ virality)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>1 WhatsApp message daily</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>1 Status image daily</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>SEBI compliance validation</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>7-day content history</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                onClick={() => handleStartTrial('solo')}
                disabled={loading !== null}
              >
                {loading === 'solo' ? 'Processing...' : 'Start 14-Day Free Trial'}
              </Button>
            </CardFooter>
          </Card>

          {/* Professional Plan */}
          <Card className="bg-black border-[#D4AF37] border-2 relative hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-[#D4AF37]">Professional</CardTitle>
              <CardDescription>For established advisors</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹2,499</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span className="font-bold">All Solo features +</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span className="font-bold text-[#D4AF37]">30 AI Avatar Reels/month 🎬</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Voice cloning for avatar</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Premium branding (logo, colors)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>30-day content history</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Priority support</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                onClick={() => handleStartTrial('professional')}
                disabled={loading !== null}
              >
                {loading === 'professional' ? 'Processing...' : 'Start 14-Day Free Trial'}
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-black border-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all">
            <CardHeader>
              <CardTitle className="text-2xl text-[#D4AF37]">Enterprise</CardTitle>
              <CardDescription>For firms & agencies</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹4,999</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span className="font-bold">All Professional features +</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Up to 3 advisor profiles</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>API access for integrations</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>White-label branding</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Dedicated account manager</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Priority phone support (2hr SLA)</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                onClick={() => handleStartTrial('enterprise')}
                disabled={loading !== null}
              >
                {loading === 'enterprise' ? 'Processing...' : 'Start 14-Day Free Trial'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>✓ 14-day free trial • ✓ Cancel anytime • ✓ No contracts</p>
          <p className="mt-2">💯 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
}
```

### **STEP 7: ADD TRIAL BANNER IN DASHBOARD**

Create `components/dashboard/TrialBanner.tsx`:

```typescript
'use client';

import { differenceInDays } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TrialBannerProps {
  trialEndDate: string;
  subscriptionStatus: string;
}

export function TrialBanner({ trialEndDate, subscriptionStatus }: TrialBannerProps) {
  const router = useRouter();

  if (subscriptionStatus !== 'trialing') return null;

  const daysLeft = differenceInDays(new Date(trialEndDate), new Date());

  if (daysLeft < 0) return null; // Trial expired

  return (
    <Alert className="mb-6 bg-[#D4AF37]/10 border-[#D4AF37]">
      <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
      <AlertTitle className="text-[#D4AF37] font-bold">
        {daysLeft} days left in your free trial
      </AlertTitle>
      <AlertDescription className="text-white mt-2">
        Your trial ends on {new Date(trialEndDate).toLocaleDateString('en-IN')}.
        You'll be charged automatically unless you cancel before then.
        <div className="mt-3 flex gap-3">
          <Button
            size="sm"
            className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
            onClick={() => router.push('/dashboard/settings')}
          >
            Manage Subscription
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#D4AF37] text-[#D4AF37]"
            onClick={() => router.push('/dashboard/upgrade')}
          >
            View Plans
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### **STEP 8: CREATE PAYMENTS TABLE IN SUPABASE**

Run this SQL in Supabase SQL Editor:

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id VARCHAR(255) NOT NULL UNIQUE,
  subscription_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_subscription FOREIGN KEY (subscription_id)
    REFERENCES users(razorpay_subscription_id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT razorpay_subscription_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert
CREATE POLICY "Service role can insert payments"
  ON payments
  FOR INSERT
  WITH CHECK (true);
```

### **STEP 9: UPDATE USERS TABLE**

Add these columns to users table (if not already present):

```sql
-- Add Razorpay-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_razorpay_subscription_id ON users(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
```

### **STEP 10: CONFIGURE RAZORPAY WEBHOOK IN DASHBOARD**

**Go to:** Razorpay Dashboard → Settings → Webhooks → Add Webhook URL

**Settings:**
- **Webhook URL:** `https://jarvisdaily.com/api/webhooks/razorpay`
- **Alert Email:** User's email
- **Active Events (select these):**
  - ✅ subscription.activated
  - ✅ subscription.charged
  - ✅ subscription.cancelled
  - ✅ subscription.paused
  - ✅ subscription.resumed
  - ✅ subscription.completed
  - ✅ payment.authorized
  - ✅ payment.captured
  - ✅ payment.failed

**After creating, copy the Webhook Secret** (shown only once!)

### **STEP 11: TEST THE COMPLETE FLOW**

#### **Test with Razorpay Test Cards:**

1. **Visit:** http://localhost:3000/dashboard/upgrade
2. **Click:** "Start 14-Day Free Trial" on Professional plan
3. **Razorpay checkout opens**
4. **Use test card:**
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
   - Name: Test User
5. **Complete payment**
6. **Verify:**
   - Dashboard shows "14 days left in trial" banner
   - Supabase users table: `subscription_status = 'trialing'`
   - Content generation works
7. **Simulate trial end:**
   - Manually set `trial_end_date` to yesterday in Supabase
   - Check that webhook triggers billing
   - Verify status changes to `'active'`

---

## ✅ DELIVERABLE CHECKLIST

Mark as complete when:

- [ ] Razorpay SDK installed (`npm install razorpay`)
- [ ] Environment variables added (Plan IDs, Webhook Secret)
- [ ] Razorpay client library created (`lib/razorpay.ts`)
- [ ] Subscription API created (`/api/checkout/create-subscription/route.ts`)
- [ ] Webhook handler created (`/api/webhooks/razorpay/route.ts`)
- [ ] Pricing page updated with "Start Free Trial" buttons
- [ ] Trial banner component created
- [ ] Payments table created in Supabase
- [ ] Users table updated with Razorpay columns
- [ ] Webhook configured in Razorpay dashboard
- [ ] End-to-end test completed successfully
- [ ] Documentation updated with Plan IDs

---

## 📚 REFERENCE DOCUMENTS

1. **COMPLETE-SEQUENTIAL-GUIDE.md** - Full implementation guide (Prompts 4.1-4.4)
2. **JARVISDAILY-PRICING-STRATEGY-2025.md** - Deep market research & pricing rationale
3. **CLAUDE.md** - Project overview and tech stack

---

## 🚨 CRITICAL NOTES

1. **Trial Logic:** Payment method IS required upfront (Option 1). This is intentional for better conversion.
2. **Pricing:** ₹999/₹2,499/₹4,999 is final (based on deep market research)
3. **Avatar Reels:** Professional plan's key differentiator - don't remove
4. **Webhook Security:** ALWAYS verify signature before processing events
5. **Error Handling:** Log all errors, never expose sensitive data to frontend

---

## 🆘 TROUBLESHOOTING

**Issue: "Plan ID not found"**
- Check `.env` has correct Plan IDs
- Verify Plan IDs copied from Razorpay (start with `plan_`)

**Issue: "Webhook signature mismatch"**
- Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- Check webhook secret copied correctly (starts with `whsec_`)

**Issue: "Trial not working"**
- Check `trial_period: 14` in subscription creation API
- Verify `trial_amount: 0` is set

**Issue: "Payment not charging after trial"**
- Check webhook is configured in Razorpay
- Verify webhook URL is correct: `https://jarvisdaily.com/api/webhooks/razorpay`
- Check Vercel logs for webhook events

---

## 📞 SUPPORT

If you get stuck:
1. Check Razorpay docs: https://razorpay.com/docs/api/subscriptions/
2. Review COMPLETE-SEQUENTIAL-GUIDE.md (Prompts 4.1-4.4)
3. Check Vercel logs: `vercel logs --follow`
4. Test with Razorpay test mode first, then switch to live mode

---

**TIME ESTIMATE:** 2-3 hours (with Plan IDs provided)

**PRIORITY:** HIGH - Required for payment flow

**STATUS:** Ready to start (waiting for Plan IDs from user)

---

**Good luck! This is the final piece to complete JarvisDaily's payment system.** 🚀
