/**
 * Razorpay Client Configuration
 *
 * JarvisDaily Payment Integration
 * - Solo Plan: ₹999/month (1 content asset daily)
 * - Professional Plan: ₹2,499/month (Solo + 30 AI Avatar Reels)
 * - Enterprise Plan: ₹4,999/month (Multi-brand + API + White-label)
 */

const Razorpay = require('razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription Plan IDs
const RAZORPAY_PLANS = {
  solo: process.env.RAZORPAY_SOLO_PLAN_ID,
  professional: process.env.RAZORPAY_PROFESSIONAL_PLAN_ID,
  enterprise: process.env.RAZORPAY_ENTERPRISE_PLAN_ID,
};

// Plan Details (for frontend display)
const PLAN_DETAILS = {
  solo: {
    id: 'solo',
    name: 'JarvisDaily Solo',
    razorpayPlanId: process.env.RAZORPAY_SOLO_PLAN_ID,
    price: 999,
    currency: 'INR',
    interval: 'monthly',
    features: [
      '1 LinkedIn post daily (9.0+ virality)',
      '1 WhatsApp message daily',
      '1 Status image daily (1080×1920)',
      'Grammy-level content quality',
      'AI-powered market insights',
      'SEBI compliance check',
    ],
  },
  professional: {
    id: 'professional',
    name: 'JarvisDaily Professional',
    razorpayPlanId: process.env.RAZORPAY_PROFESSIONAL_PLAN_ID,
    price: 2499,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Everything in Solo',
      '30 AI Avatar Reels per month',
      'Priority content generation',
      'Custom branding support',
      'Advanced analytics',
      'Priority support (24h response)',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'JarvisDaily Enterprise',
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID,
    price: 4999,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Everything in Professional',
      'Multi-brand support (up to 5 brands)',
      'API access for custom integrations',
      'White-label solution',
      '360 content assets per month',
      'Dedicated account manager',
      'Custom content templates',
      'Priority support (4h response)',
    ],
  },
};

/**
 * Create a subscription for a customer
 *
 * @param {Object} params - Subscription parameters
 * @param {string} params.planId - 'solo', 'professional', or 'enterprise'
 * @param {string} params.customerId - Razorpay customer ID
 * @param {number} params.quantity - Quantity (default: 1)
 * @param {Object} params.notes - Additional metadata
 * @returns {Promise<Object>} Razorpay subscription object
 */
async function createSubscription({ planId, customerId, quantity = 1, notes = {} }) {
  const razorpayPlanId = RAZORPAY_PLANS[planId];

  if (!razorpayPlanId) {
    throw new Error(`Invalid plan ID: ${planId}. Must be 'solo', 'professional', or 'enterprise'`);
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    customer_id: customerId,
    quantity,
    total_count: 0, // 0 = infinite billing cycles
    customer_notify: 1, // Send notifications to customer

    // ⭐ 14-DAY FREE TRIAL (Payment Method Required Upfront) ⭐
    trial_period: 14, // 14 days free trial
    trial_amount: 0,   // ₹0 charge during trial
    // After 14 days, automatically charges the full plan amount

    notes: {
      plan_type: planId,
      ...notes,
    },
  });

  return subscription;
}

/**
 * Create a Razorpay customer
 *
 * @param {Object} params - Customer parameters
 * @param {string} params.name - Customer name
 * @param {string} params.email - Customer email
 * @param {string} params.phone - Customer phone (optional)
 * @param {Object} params.notes - Additional metadata
 * @returns {Promise<Object>} Razorpay customer object
 */
async function createCustomer({ name, email, phone, notes = {} }) {
  const customer = await razorpay.customers.create({
    name,
    email,
    contact: phone,
    notes,
  });

  return customer;
}

/**
 * Verify webhook signature
 *
 * @param {string} signature - X-Razorpay-Signature header value
 * @param {string} body - Raw request body
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(signature, body) {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Get subscription details
 *
 * @param {string} subscriptionId - Razorpay subscription ID
 * @returns {Promise<Object>} Subscription details
 */
async function getSubscription(subscriptionId) {
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  return subscription;
}

/**
 * Cancel a subscription
 *
 * @param {string} subscriptionId - Razorpay subscription ID
 * @param {boolean} cancelAtCycleEnd - Cancel at end of billing cycle
 * @returns {Promise<Object>} Cancelled subscription object
 */
async function cancelSubscription(subscriptionId, cancelAtCycleEnd = false) {
  const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
    cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
  });

  return subscription;
}

/**
 * Get plan details by plan ID
 *
 * @param {string} planId - 'solo', 'professional', or 'enterprise'
 * @returns {Object} Plan details
 */
function getPlanDetails(planId) {
  return PLAN_DETAILS[planId] || null;
}

/**
 * Get all plan details
 *
 * @returns {Object} All plan details
 */
function getAllPlans() {
  return PLAN_DETAILS;
}

module.exports = {
  razorpay,
  RAZORPAY_PLANS,
  PLAN_DETAILS,
  createSubscription,
  createCustomer,
  verifyWebhookSignature,
  getSubscription,
  cancelSubscription,
  getPlanDetails,
  getAllPlans,
};
