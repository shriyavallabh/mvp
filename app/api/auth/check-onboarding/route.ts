import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * API endpoint to check if the currently authenticated user has completed onboarding
 * Used by sign-in flow to determine redirect destination
 */
export async function GET() {
  try {
    // Get currently authenticated user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = !!user.unsafeMetadata?.onboardingCompleted;

    return NextResponse.json({ hasCompletedOnboarding });
  } catch (error) {
    console.error('[CHECK_ONBOARDING] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
