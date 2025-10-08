'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Razorpay global type
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutFormProps {
  plan: string;
  price: number;
}

export default function CheckoutForm({ plan, price }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // Create subscription on backend
      const response = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Check if Razorpay script is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

      // Load Razorpay checkout
      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: 'JarvisDaily',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - 14 Day Free Trial`,
        image: '/logo.png', // Add your logo here
        handler: function (response: any) {
          // Payment successful
          toast({
            title: '🎉 Trial Started Successfully!',
            description: 'Your 14-day free trial is now active',
            duration: 5000,
          });

          // Redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard?trial=started');
          }, 1500);
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#D4AF37',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: 'Checkout Cancelled',
              description: 'You can try again anytime',
              variant: 'destructive',
            });
          },
        },
        notes: {
          plan: plan,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
        duration: 5000,
      });
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 text-lg py-6 font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading checkout...
          </>
        ) : (
          <>
            Start Free Trial
            <span className="ml-2 text-sm font-normal opacity-80">
              (₹{price.toLocaleString('en-IN')}/mo after trial)
            </span>
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>🔒 Secured by Razorpay</p>
        <p className="mt-1">
          Payment method will be authorized but not charged during the trial period
        </p>
      </div>
    </div>
  );
}
