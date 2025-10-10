'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { cacheFormData, getFormData, updateFormField } from '@/lib/form-cache';
import { saveOnboardingData } from '@/app/actions/save-onboarding';

type OnboardingStep = 'welcome' | 'business' | 'segmentation' | 'phone' | 'confirmation';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [businessData, setBusinessData] = useState({
    businessName: '',
    arn: '',
    advisorCode: '',
  });
  const [segments, setSegments] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load cached form data on mount
  useEffect(() => {
    async function loadCachedData() {
      if (!isLoaded || !user) return;

      try {
        const cached = await getFormData(user.id);
        if (cached) {
          // Restore form state from cache
          if (cached.businessName || cached.arn || cached.advisorCode) {
            setBusinessData({
              businessName: cached.businessName || '',
              arn: cached.arn || '',
              advisorCode: cached.advisorCode || '',
            });
          }
          if (cached.segments && cached.segments.length > 0) {
            setSegments(cached.segments);
          }
          if (cached.phoneNumber) {
            setPhoneNumber(cached.phoneNumber);
          }
        }
      } catch (error) {
        console.error('[ONBOARDING] Failed to load cached data:', error);
      }
    }

    loadCachedData();
  }, [isLoaded, user]);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !user) {
      router.push('/sign-in');
    }

    // Check if onboarding already completed
    if (isLoaded && user && user.unsafeMetadata?.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  const segmentOptions = [
    { id: 'hni', label: 'HNI (High Net Worth)' },
    { id: 'salaried', label: 'Salaried Professionals' },
    { id: 'business', label: 'Business Owners' },
    { id: 'retirees', label: 'Retirees' },
    { id: 'young', label: 'Young Investors (20-35)' },
  ];

  // Cache helper - save field to Redis
  const cacheField = async (field: string, value: any) => {
    if (!user) return;
    try {
      await updateFormField(user.id, field as any, value);
    } catch (error) {
      console.error(`[ONBOARDING] Failed to cache ${field}:`, error);
    }
  };

  const handleBusinessDataChange = (field: keyof typeof businessData, value: string) => {
    const newData = { ...businessData, [field]: value };
    setBusinessData(newData);
    cacheField(field, value);
  };

  const handleSegmentToggle = (segmentId: string) => {
    const newSegments = segments.includes(segmentId)
      ? segments.filter((s) => s !== segmentId)
      : [...segments, segmentId];

    setSegments(newSegments);
    cacheField('segments', newSegments);
  };

  const handleSendOTP = async () => {
    setPhoneError('');

    if (!phoneNumber || phoneNumber.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phoneNumber}` }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${phoneNumber}`,
          otp: otpValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid OTP');
      }

      // Step 2: Save onboarding data to all layers (Supabase + Sheets + Clerk + clear cache)
      await saveOnboardingData({
        businessName: businessData.businessName,
        arn: businessData.arn,
        advisorCode: businessData.advisorCode,
        segments,
        phone: `+91${phoneNumber}`,
      });

      // Note: saveOnboardingData automatically redirects to /dashboard
      // If redirect doesn't work, show confirmation step
      setStep('confirmation');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Step 1: Welcome + Value Demo */}
        {step === 'welcome' && (
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-[#0A0A0A]" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Welcome to JarvisDaily, {user.firstName}! 🎉
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Let's get you set up in 2 minutes
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">What you'll get:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Save 15 Hours/Week</p>
                      <p className="text-sm text-gray-600">No more struggling with content creation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Grammy-Level Content (9.0+ Virality)</p>
                      <p className="text-sm text-gray-600">LinkedIn posts + WhatsApp messages + Status images</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Instant Daily Delivery</p>
                      <p className="text-sm text-gray-600">Content delivered to WhatsApp every morning at 9 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('business')}
                className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold h-12"
              >
                Continue to Setup <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Business Details */}
        {step === 'business' && (
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Tell us about your practice</CardTitle>
              <CardDescription className="text-gray-600">
                This helps us personalize your content (all fields optional)
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-gray-900">
                  Business Name (Optional)
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="e.g., Sharma Financial Services"
                  value={businessData.businessName}
                  onChange={(e) => handleBusinessDataChange('businessName', e.target.value)}
                />
                <p className="text-sm text-gray-500">Appears on your branded content</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arn" className="text-gray-900">
                  ARN - Advisor Registration Number (Optional)
                </Label>
                <Input
                  id="arn"
                  type="text"
                  placeholder="e.g., ARN-12345"
                  value={businessData.arn}
                  onChange={(e) => handleBusinessDataChange('arn', e.target.value)}
                />
                <p className="text-sm text-gray-500">For SEBI compliance on mutual fund content</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisorCode" className="text-gray-900">
                  Advisor Code (Optional)
                </Label>
                <Input
                  id="advisorCode"
                  type="text"
                  placeholder="e.g., ADV-789"
                  value={businessData.advisorCode}
                  onChange={(e) => handleBusinessDataChange('advisorCode', e.target.value)}
                />
                <p className="text-sm text-gray-500">Your unique advisor identifier</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('welcome')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                <Button
                  onClick={() => setStep('segmentation')}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Customer Segmentation */}
        {step === 'segmentation' && (
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Who do you serve?</CardTitle>
              <CardDescription className="text-gray-600">
                Select all that apply - this personalizes your content tone and topics
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-3">
                {segmentOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={segments.includes(option.id)}
                      onCheckedChange={() => handleSegmentToggle(option.id)}
                    />
                    <label
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              {segments.length === 0 && (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                  💡 Tip: Select at least one segment for better personalization
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('business')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                <Button
                  onClick={() => setStep('phone')}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Phone Verification */}
        {step === 'phone' && (
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">📱 Verify your WhatsApp number</CardTitle>
              <CardDescription className="text-gray-600">
                We'll deliver your daily content to this number
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Why WhatsApp?</strong> Instant delivery, 98% open rate, no email spam folders
                </p>
              </div>

              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-900">
                      WhatsApp Number
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md">
                        <span className="text-gray-700 font-medium">+91</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => {
                          const phone = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(phone);
                          cacheField('phoneNumber', phone);
                        }}
                        maxLength={10}
                        className="flex-1"
                      />
                    </div>
                    {phoneError && <p className="text-[#EF4444] text-sm">{phoneError}</p>}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('segmentation')}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 w-5 h-5" /> Back
                    </Button>
                    <Button
                      onClick={handleSendOTP}
                      disabled={isLoading}
                      className="flex-1 bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-gray-900">Enter 6-digit OTP</Label>
                    <p className="text-sm text-gray-600">Sent to +91{phoneNumber}</p>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          className="w-12 h-14 text-center text-2xl font-semibold"
                        />
                      ))}
                    </div>
                    {otpError && <p className="text-[#EF4444] text-sm text-center">{otpError}</p>}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={isLoading}
                      className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Start Trial'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setOtpError('');
                      }}
                      className="text-sm text-[#3B82F6] hover:underline"
                    >
                      Change number
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Trial Confirmation */}
        {step === 'confirmation' && (
          <Card className="bg-white border-0 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
                <p className="text-lg text-gray-600">Your free 14-day trial starts now</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-left">
                <h3 className="font-semibold text-gray-900">What happens next:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] font-bold">1.</span>
                    <span>Daily content generation starts tomorrow 9 AM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] font-bold">2.</span>
                    <span>Receive LinkedIn post + WhatsApp message + Status image</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] font-bold">3.</span>
                    <span>No payment required for 14 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] font-bold">4.</span>
                    <span>Cancel anytime - no questions asked</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold h-12 text-lg"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        {step !== 'welcome' && step !== 'confirmation' && (
          <div className="mt-4 flex justify-center gap-2">
            <div className={`h-2 w-16 rounded-full ${step === 'business' ? 'bg-[#D4AF37]' : 'bg-gray-300'}`} />
            <div className={`h-2 w-16 rounded-full ${step === 'segmentation' ? 'bg-[#D4AF37]' : 'bg-gray-300'}`} />
            <div className={`h-2 w-16 rounded-full ${step === 'phone' ? 'bg-[#D4AF37]' : 'bg-gray-300'}`} />
          </div>
        )}
      </div>
    </div>
  );
}
