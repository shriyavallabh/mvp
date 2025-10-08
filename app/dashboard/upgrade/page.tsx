import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default async function UpgradePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const plans = [
    {
      id: 'solo',
      name: 'Solo',
      price: 999,
      description: 'Perfect for individual advisors',
      features: [
        '1 LinkedIn post daily',
        '1 WhatsApp message daily',
        '1 Status image daily',
        '9.0+ virality guarantee',
        'Email support',
      ],
      cta: 'Start 14-Day Free Trial',
      highlighted: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 2499,
      description: 'Most popular for growing practices',
      features: [
        'Everything in Solo',
        '30 AI Avatar Reels/month 🎬',
        'Priority support',
        'Custom branding',
        'Advanced analytics',
      ],
      cta: 'Start Free Trial - Professional',
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 4999,
      description: 'For multi-brand agencies',
      features: [
        'Everything in Professional',
        'Multi-brand support (3 brands)',
        'API access',
        'White-label solution',
        'Dedicated account manager',
        '360 assets/month',
      ],
      cta: 'Start Free Trial - Enterprise',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Start with a 14-day free trial. No credit card required upfront.
          </p>
          <p className="text-[#D4AF37] text-sm mt-2">
            After trial, payment method will be required
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-black rounded-lg p-8
                ${plan.highlighted
                  ? 'border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'border border-gray-800'
                }
              `}
            >
              {/* Most Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#D4AF37] text-black px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-[#D4AF37]">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-[#D4AF37] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href={`/dashboard/checkout?plan=${plan.id}`}>
                <Button
                  className={`
                    w-full py-6 text-base font-semibold
                    ${plan.highlighted
                      ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                    }
                  `}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Trusted by 500+ financial advisors across India
          </p>
          <div className="flex justify-center items-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-[#D4AF37] mr-2" />
              <span className="text-sm">14-day free trial</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-[#D4AF37] mr-2" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-[#D4AF37] mr-2" />
              <span className="text-sm">9.0+ virality guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
