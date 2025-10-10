'use server';

/**
 * Server Actions for Onboarding Flow
 *
 * Handles saving onboarding data to:
 * 1. Supabase (permanent storage)
 * 2. Google Sheets (for AI agents)
 * 3. Clerk metadata (for quick access)
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { syncAdvisorToSheets } from '@/lib/google-sheets';
import { clearFormData } from '@/lib/form-cache';
import { redirect } from 'next/navigation';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OnboardingData {
  businessName?: string;
  arn?: string;
  advisorCode?: string;
  segments: string[];
  phone: string;
}

export async function saveOnboardingData(formData: OnboardingData) {
  console.log('[ONBOARDING] Starting save process...');

  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('Unauthorized - please sign in');
  }

  try {
    // Step 1: Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    let userDbId: string;

    if (!existingUser) {
      console.log('[ONBOARDING] Creating new user in Supabase...');

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: formData.phone,
          plan: 'trial',
          subscription_status: 'trial',
        })
        .select('id')
        .single();

      if (userError) {
        console.error('[ONBOARDING] User creation error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      userDbId = newUser.id;
      console.log('[ONBOARDING] User created:', userDbId);
    } else {
      userDbId = existingUser.id;
      console.log('[ONBOARDING] Using existing user:', userDbId);

      // Update phone if changed
      await supabase
        .from('users')
        .update({ phone: formData.phone })
        .eq('id', userDbId);
    }

    // Step 2: Create or update advisor profile
    console.log('[ONBOARDING] Saving advisor profile...');

    const { error: profileError } = await supabase
      .from('advisor_profiles')
      .upsert(
        {
          user_id: userDbId,
          business_name: formData.businessName,
          arn: formData.arn,
          advisor_code: formData.advisorCode,
          customer_segments: formData.segments,
          phone_verified: true,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (profileError) {
      console.error('[ONBOARDING] Profile error:', profileError);
      throw new Error(`Failed to save profile: ${profileError.message}`);
    }

    console.log('[ONBOARDING] Profile saved successfully');

    // Step 3: Update Clerk metadata
    console.log('[ONBOARDING] Updating Clerk metadata...');

    try {
      await clerkClient.users.updateUser(userId, {
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingCompleted: true,
          phoneVerified: true,
          phone: formData.phone,
          businessName: formData.businessName,
          arn: formData.arn,
        },
      });
      console.log('[ONBOARDING] Clerk metadata updated');
    } catch (clerkError) {
      console.error('[ONBOARDING] Clerk update warning:', clerkError);
      // Don't fail the whole process if Clerk update fails
    }

    // Step 4: Sync to Google Sheets (non-blocking)
    console.log('[ONBOARDING] Syncing to Google Sheets...');

    try {
      await syncAdvisorToSheets({
        clerkUserId: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        businessName: formData.businessName,
        arn: formData.arn,
        phone: formData.phone,
        plan: 'trial',
        segments: formData.segments,
      });
      console.log('[ONBOARDING] Google Sheets sync complete');
    } catch (sheetsError) {
      console.error('[ONBOARDING] Sheets sync warning:', sheetsError);
      // Don't fail if Sheets sync fails
    }

    // Step 5: Clear form cache
    await clearFormData(userId);
    console.log('[ONBOARDING] Form cache cleared');

    console.log('[ONBOARDING] ✅ All data saved successfully!');
  } catch (error) {
    console.error('[ONBOARDING] Fatal error:', error);
    throw error;
  }

  // Redirect to dashboard
  redirect('/dashboard');
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const { data } = await supabase
      .from('advisor_profiles')
      .select('onboarding_completed')
      .eq('user_id', (
        await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', userId)
          .single()
      ).data?.id)
      .single();

    return data?.onboarding_completed || false;
  } catch (error) {
    console.error('[ONBOARDING] Status check error:', error);
    return false;
  }
}
