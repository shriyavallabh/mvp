import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const plan = params.plan || 'solo';

  // Validate plan
  if (plan !== 'solo' && plan !== 'professional' && plan !== 'enterprise') {
    redirect('/dashboard/upgrade');
  }

  const planDetails = {
    solo: {
      name: 'Solo',
      price: 999,
      features: [
        '1 LinkedIn post daily',
        '1 WhatsApp message daily',
        '1 Status image daily',
        '9.0+ virality guarantee',
        'Email support',
      ],
    },
    professional: {
      name: 'Professional',
      price: 2499,
      features: [
        'Everything in Solo',
        '30 AI Avatar Reels/month 🎬',
        'Priority support',
        'Custom branding',
        'Advanced analytics',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: 4999,
      features: [
        'Everything in Professional',
        'Multi-brand support (3 brands)',
        'API access',
        'White-label solution',
        'Dedicated account manager',
        '360 assets/month',
      ],
    },
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-400">
            You're starting a free trial of the {selectedPlan.name} plan
          </p>
          <p className="text-[#D4AF37] text-sm mt-2">
            14 days free, then ₹{selectedPlan.price.toLocaleString('en-IN')}/month
          </p>
        </div>

        {/* Plan Summary Card */}
        <div className="bg-black border border-[#D4AF37]/20 rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {selectedPlan.name} Plan
              </h3>
              <p className="text-gray-400 text-sm">
                14-day free trial, then billed monthly
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#D4AF37]">
                ₹{selectedPlan.price.toLocaleString('en-IN')}
              </div>
              <div className="text-gray-400 text-sm">/month</div>
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-gray-800 pt-6 mb-6">
            <h4 className="text-white font-semibold mb-3">What you get:</h4>
            <ul className="space-y-2">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-[#D4AF37] mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Form */}
          <CheckoutForm plan={plan} price={selectedPlan.price} />
        </div>

        {/* Trust Indicators */}
        <p className="text-center text-gray-500 text-sm">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          <br />
          Your subscription will auto-renew monthly after the trial period.
        </p>
      </div>
    </div>
  );
}
