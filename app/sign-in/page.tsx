'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import '../signup/signup.css';

export default function SignInPage() {
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn?.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result?.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);

      let errorMessage = 'Invalid email or password. Please try again.';

      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        errorMessage = clerkError.longMessage || clerkError.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!signIn) {
        console.error('SignIn not initialized');
        return;
      }
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.errors?.[0]?.message || 'Failed to authenticate with Google');
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      if (!signIn) {
        console.error('SignIn not initialized');
        return;
      }
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_linkedin_oidc',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (err: any) {
      console.error('LinkedIn sign in error:', err);
      setError(err.errors?.[0]?.message || 'Failed to authenticate with LinkedIn');
    }
  };

  return (
    <div className="signup-wrapper">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="logo-section">
          <h1>
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15"/>
              <path d="M8 20L12 12L16 16L20 8L24 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="1.5" fill="white"/>
              <circle cx="16" cy="16" r="1.5" fill="white"/>
              <circle cx="20" cy="8" r="1.5" fill="white"/>
              <circle cx="24" cy="14" r="1.5" fill="white"/>
            </svg>
            JarvisDaily
          </h1>
        </div>

        <div className="hero-content">
          <div className="decorative-shapes">
            <div className="shape chat-bubble-1"></div>
            <div className="shape chat-bubble-2"></div>
            <div className="shape chart-line"></div>
          </div>
        </div>

        <div className="testimonial-card">
          <div className="testimonial-header">
            <div className="testimonial-avatar">VP</div>
            <div className="testimonial-info">
              <h3>Vidya Patel</h3>
              <p>Financial Advisor, Mumbai</p>
            </div>
          </div>
          <div className="stars">★★★★★</div>
          <p className="testimonial-text">&quot;JarvisDaily significantly boosted my client engagement.&quot;</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="form-container">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your viral content dashboard</p>
          </div>

          {error && <div className="error">{error}</div>}

          {!loading ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="submit-btn">
                Sign In
              </button>
            </form>
          ) : (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p style={{ color: '#64748B' }}>Signing you in...</p>
            </div>
          )}

          <div className="divider">
            <span>Or</span>
          </div>

          <div className="social-buttons">
            <button className="social-btn" onClick={handleGoogleSignIn} type="button">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="social-btn" onClick={handleLinkedInSignIn} type="button">
              <svg className="social-icon" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="signin-link">
            Don&apos;t have an account? <a href="/signup">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
