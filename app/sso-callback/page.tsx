'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

/**
 * OAuth Callback Handler
 * This page handles the OAuth redirect from Google/LinkedIn
 * and completes the authentication flow before redirecting to dashboard
 */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const completeOAuth = async () => {
      try {
        // Handle the OAuth callback
        await handleRedirectCallback();
        // Clerk will automatically redirect to the redirectUrlComplete
      } catch (error) {
        console.error('OAuth callback error:', error);
        // On error, redirect to sign-in page
        window.location.href = '/sign-in';
      }
    };

    completeOAuth();
  }, [handleRedirectCallback]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '5px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px' }}>
          Completing authentication...
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          Please wait while we sign you in
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
