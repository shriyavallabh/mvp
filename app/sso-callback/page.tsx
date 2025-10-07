'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * OAuth Callback Handler
 * This page handles the OAuth redirect from Google/LinkedIn
 * and completes the authentication flow before redirecting to dashboard
 */
export default function SSOCallbackPage() {
  // Clerk provides a built-in component for handling OAuth callbacks
  return <AuthenticateWithRedirectCallback />;
}
