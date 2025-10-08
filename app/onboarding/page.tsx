'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  const phoneNumber = user.unsafeMetadata?.phone as string || '';

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="bg-white border-0 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Welcome to JarvisDaily! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Your account has been successfully created
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{user.primaryEmailAddress?.emailAddress}</span>
                </div>
                {phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#D4AF37]/10 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">1.</span>
                  <span>Complete your advisor profile and branding preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">2.</span>
                  <span>Choose your content generation preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">3.</span>
                  <span>Start receiving daily viral content via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold h-12"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1 h-12"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
