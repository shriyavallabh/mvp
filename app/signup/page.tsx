'use client';

import { useState } from 'react';
import { PhoneForm } from '@/components/phone-form';
import { OtpForm } from '@/components/otp-form';
import { ProfileForm } from '@/components/profile-form';
import { TestimonialPanel } from '@/components/testimonial-panel';

export default function SignupPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setStep('otp');
  };

  const handleOtpVerified = () => {
    setStep('profile');
  };

  const handleBack = () => {
    setStep('phone');
    setPhoneNumber('');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] grid grid-cols-1 lg:grid-cols-2">
      {/* Testimonial Panel - Left Side (50%) */}
      <TestimonialPanel />

      {/* Form Panel - Right Side (50%) */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {step === 'phone' && <PhoneForm onSubmit={handlePhoneSubmit} />}
          {step === 'otp' && (
            <OtpForm
              phoneNumber={phoneNumber}
              onVerified={handleOtpVerified}
              onBack={handleBack}
            />
          )}
          {step === 'profile' && <ProfileForm phoneNumber={phoneNumber} />}
        </div>
      </div>
    </div>
  );
}
