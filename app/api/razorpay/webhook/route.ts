import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/razorpay/webhook
 *
 * Handles webhook events from Razorpay
 * Events: subscription.activated, subscription.charged, subscription.cancelled, etc.
 */
export async function POST(request: Request) {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // 2. Verify webhook signature
    const isValid = verifyWebhookSignature(signature, body);

    if (!isValid) {
      console.error('Invalid Razorpay signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 3. Parse event data
    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log(`[Razorpay Webhook] Event: ${eventType}`);

    // 4. Handle different event types
    switch (eventType) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(payload);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Razorpay Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

// ==================== Event Handlers ====================

async function handleSubscriptionActivated(payload: any) {
  const subscription = payload.subscription.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription activated: ${subscription.id}`);

  // Update user in Supabase
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      razorpay_subscription_id: subscription.id,
      subscription_activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update subscription status:', error);
  } else {
    console.log(`[Razorpay] User subscription activated successfully`);
  }
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription.entity;
  const payment = payload.payment.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription charged: ${subscription.id}, Payment: ${payment.id}`);

  // Update last payment date
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      last_payment_date: new Date().toISOString(),
      last_payment_amount: payment.amount / 100, // Convert paise to rupees
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update payment info:', error);
  } else {
    console.log(`[Razorpay] Payment recorded successfully`);
  }
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription cancelled: ${subscription.id}`);

  // Update user subscription status
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update cancellation:', error);
  } else {
    console.log(`[Razorpay] Subscription cancelled successfully`);
  }
}

async function handleSubscriptionPaused(payload: any) {
  const subscription = payload.subscription.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription paused: ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update pause status:', error);
  }
}

async function handleSubscriptionResumed(payload: any) {
  const subscription = payload.subscription.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription resumed: ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update resume status:', error);
  }
}

async function handleSubscriptionCompleted(payload: any) {
  const subscription = payload.subscription.entity;
  const customerId = subscription.customer_id;

  console.log(`[Razorpay] Subscription completed: ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_customer_id', customerId);

  if (error) {
    console.error('[Razorpay] Failed to update completion status:', error);
  }
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment.entity;

  console.log(`[Razorpay] Payment failed: ${payment.id}`);

  // You might want to notify the user or take other actions here
  // For now, just log it
  console.log(`[Razorpay] Payment failure details:`, payment);
}
