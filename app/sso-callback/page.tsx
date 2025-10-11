'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * OAuth Callback Handler
 * This page handles the OAuth redirect from Google/LinkedIn
 * and completes the authentication flow before redirecting based on onboarding status
 */
export default function SSOCallbackPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait for user to be loaded after OAuth callback
    if (isLoaded && user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = user.unsafeMetadata?.onboardingCompleted;

      // Redirect based on onboarding status
      if (hasCompletedOnboarding) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isLoaded, user, router]);

  // Show Clerk's OAuth callback handler while checking user status
  return (
    <div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
