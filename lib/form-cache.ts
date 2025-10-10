/**
 * Form Persistence Cache using Vercel KV (Redis)
 *
 * Provides form state caching across page refreshes during onboarding.
 * Data expires after 5 minutes of inactivity.
 */

import { kv } from '@vercel/kv';

export interface OnboardingFormData {
  businessName?: string;
  arn?: string;
  advisorCode?: string;
  segments?: string[];
  phoneNumber?: string;
  currentStep?: number;
  lastUpdated?: string;
}

const CACHE_PREFIX = 'onboarding:';
const CACHE_TTL = 300; // 5 minutes in seconds

/**
 * Save form data to Redis cache
 * @param userId - Clerk user ID
 * @param data - Form data to cache
 */
export async function cacheFormData(
  userId: string,
  data: OnboardingFormData
): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${userId}`;
    const cacheData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    await kv.set(key, cacheData, { ex: CACHE_TTL });
    console.log(`[CACHE] Saved form data for user ${userId}`);
  } catch (error) {
    console.error('[CACHE] Error saving form data:', error);
    // Don't throw - caching is non-critical
  }
}

/**
 * Retrieve form data from Redis cache
 * @param userId - Clerk user ID
 * @returns Cached form data or null if not found/expired
 */
export async function getFormData(
  userId: string
): Promise<OnboardingFormData | null> {
  try {
    const key = `${CACHE_PREFIX}${userId}`;
    const data = await kv.get<OnboardingFormData>(key);

    if (data) {
      console.log(`[CACHE] Retrieved form data for user ${userId}`);
      return data;
    }

    console.log(`[CACHE] No cached data found for user ${userId}`);
    return null;
  } catch (error) {
    console.error('[CACHE] Error retrieving form data:', error);
    return null;
  }
}

/**
 * Clear form data from Redis cache
 * @param userId - Clerk user ID
 */
export async function clearFormData(userId: string): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${userId}`;
    await kv.del(key);
    console.log(`[CACHE] Cleared form data for user ${userId}`);
  } catch (error) {
    console.error('[CACHE] Error clearing form data:', error);
    // Don't throw - clearing cache failure is non-critical
  }
}

/**
 * Update specific field in cached form data
 * @param userId - Clerk user ID
 * @param field - Field name to update
 * @param value - New value
 */
export async function updateFormField(
  userId: string,
  field: keyof OnboardingFormData,
  value: any
): Promise<void> {
  try {
    const existingData = await getFormData(userId);
    const updatedData = {
      ...existingData,
      [field]: value,
    };
    await cacheFormData(userId, updatedData);
  } catch (error) {
    console.error('[CACHE] Error updating form field:', error);
  }
}

/**
 * Check if user has cached form data
 * @param userId - Clerk user ID
 * @returns True if cache exists, false otherwise
 */
export async function hasCachedData(userId: string): Promise<boolean> {
  try {
    const data = await getFormData(userId);
    return data !== null;
  } catch (error) {
    console.error('[CACHE] Error checking cache:', error);
    return false;
  }
}
