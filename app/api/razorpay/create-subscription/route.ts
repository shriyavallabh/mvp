import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCustomer, createSubscription, getPlanDetails } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription for the authenticated user
 *
 * Body:
 * {
 *   "planId": "solo" | "professional" | "enterprise"
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { plan } = body; // Frontend sends 'plan' not 'planId'
    const planId = plan; // Normalize

    if (!planId || !['solo', 'professional', 'enterprise'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID. Must be solo, professional, or enterprise' },
        { status: 400 }
      );
    }

    // 3. Get user details from Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Create or get Razorpay customer
    let razorpayCustomerId = user.razorpay_customer_id;

    if (!razorpayCustomerId) {
      // Create new Razorpay customer
      const customer = await createCustomer({
        name: user.full_name || 'JarvisDaily User',
        email: user.email,
        phone: user.phone,
        notes: {
          clerk_user_id: userId,
          user_id: user.id,
        },
      });

      razorpayCustomerId = customer.id;

      // Update user with Razorpay customer ID
      await supabaseAdmin
        .from('users')
        .update({ razorpay_customer_id: razorpayCustomerId })
        .eq('id', user.id);
    }

    // 5. Create subscription
    const subscription = await createSubscription({
      planId,
      customerId: razorpayCustomerId,
      quantity: 1,
      notes: {
        clerk_user_id: userId,
        user_id: user.id,
        plan_type: planId,
      },
    });

    // 6. Update user subscription status in Supabase
    await supabaseAdmin
      .from('users')
      .update({
        razorpay_subscription_id: subscription.id,
        subscription_plan: planId,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // 7. Get plan details for response
    const planDetails = getPlanDetails(planId);

    // 8. Return subscription details (format expected by CheckoutForm)
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id, // For Razorpay checkout modal
      razorpayKeyId: process.env.RAZORPAY_KEY_ID, // For Razorpay checkout modal
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id,
        created_at: subscription.created_at,
        short_url: subscription.short_url, // Razorpay payment link (alternative)
      },
      plan: planDetails,
    });

  } catch (error: any) {
    console.error('Subscription creation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
