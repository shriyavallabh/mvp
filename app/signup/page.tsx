'use client';

import { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/nextjs';
import './signup.css';

export default function SignupPage() {
  const { signUp, setActive } = useSignUp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    termsAccepted: false
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const [emailValid, setEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP verification state
  const [step, setStep] = useState<'signup' | 'verify-otp'>('signup');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [pendingSignupResult, setPendingSignupResult] = useState<any>(null);

  // Password strength checker
  useEffect(() => {
    const password = formData.password;
    if (password.length === 0) {
      setPasswordStrength('Weak');
    } else if (password.length < 8) {
      setPasswordStrength('Weak');
    } else if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Strong');
    }
  }, [formData.password]);

  // Email validation
  const handleEmailBlur = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(formData.email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!formData.termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = countryCode === '+91' ? '+91' + formData.phone : countryCode + formData.phone;
      const [firstName, ...lastNameParts] = formData.name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Build signup params - only include lastName if it exists
      const signUpParams: any = {
        firstName,
        emailAddress: formData.email,
        password: formData.password,
        unsafeMetadata: {
          phone: fullPhone
        }
      };

      // Only add lastName if user provided it (not empty)
      if (lastName && lastName.trim()) {
        signUpParams.lastName = lastName;
      }

      const result = await signUp?.create(signUpParams);

      // Don't activate session yet - send WhatsApp OTP first
      if (result) {
        setPendingSignupResult(result);

        // Send WhatsApp OTP
        const otpResponse = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone })
        });

        const otpData = await otpResponse.json();

        if (otpResponse.ok) {
          setOtpSent(true);
          setStep('verify-otp');
          setSuccess(`OTP sent to ${fullPhone} via WhatsApp. Check your phone!`);
          setError('');
        } else {
          setError(otpData.error || 'Failed to send OTP. Please try again.');
        }
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));

      // Extract the most detailed error message
      let errorMessage = 'Failed to create account. Please try again.';

      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        errorMessage = clerkError.longMessage || clerkError.message;

        // Improve password breach error message
        if (errorMessage.includes('password') && errorMessage.includes('breach')) {
          errorMessage = 'This password has been found in data breaches. Please use a stronger, unique password.';
        }

        // Improve lastName error message
        if (errorMessage.includes('last_name') || errorMessage.includes('lastName')) {
          errorMessage = 'There was an issue with the name format. Please try entering your full name or just first name.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.clerkError) {
        errorMessage = JSON.stringify(err);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!signUp) {
        console.error('SignUp not initialized');
        setError('Authentication system is loading. Please try again in a moment.');
        return;
      }
      await signUp.authenticateWithRedirect({
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
      if (!signUp) {
        console.error('SignUp not initialized');
        setError('Authentication system is loading. Please try again in a moment.');
        return;
      }
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_linkedin_oidc',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (err: any) {
      console.error('LinkedIn sign in error:', err);
      setError(err.errors?.[0]?.message || 'Failed to authenticate with LinkedIn');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `${countryCode}${formData.phone}`,
          otp: otp
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // OTP verified! Now activate the Clerk session
      if (pendingSignupResult && pendingSignupResult.createdSessionId) {
        await setActive({ session: pendingSignupResult.createdSessionId });
        setSuccess('✅ Phone verified! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError('Session error. Please try signing up again.');
      }

    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const fullPhone = `${countryCode}${formData.phone}`;
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        setSuccess('New OTP sent to your WhatsApp!');
      } else {
        setError(otpData.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
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
          <div className="step-indicator">Step 1 of 3</div>

          <div className="form-header">
            <h2>Create your account</h2>
            <p>Start generating viral content in under 2 minutes</p>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {step === 'signup' && !loading ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                />
                {emailValid && (
                  <span style={{ display: 'block', color: '#10B981', fontSize: '12px', marginTop: '4px' }}>
                    ✓
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <div className="input-wrapper">
                  <div className="country-code">
                    <select
                      id="country-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      <option value="+91">+91 ▼</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    className="phone-input"
                    required
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="password-wrapper">
                  <input
                    type="password"
                    id="password"
                    required
                    placeholder="Min. 8 characters"
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span className={`password-strength ${passwordStrength.toLowerCase()}`}>
                    {passwordStrength}
                  </span>
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  required
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
                <label htmlFor="termsAccepted">
                  I agree to <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="submit-btn">
                Create Account
              </button>
            </form>
          ) : step === 'verify-otp' && !loading ? (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  Verify your phone number
                </h3>
                <p style={{ color: '#64748B', fontSize: '14px' }}>
                  We've sent a 6-digit code to <strong>{countryCode}{formData.phone}</strong> via WhatsApp
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="otp">Enter OTP *</label>
                <input
                  type="text"
                  id="otp"
                  required
                  placeholder="123456"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                />
              </div>

              <button type="submit" className="submit-btn" style={{ marginBottom: '12px' }}>
                Verify & Continue
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}
                >
                  Didn't receive code? Resend OTP
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ← Back to signup
                </button>
              </div>
            </form>
          ) : (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p style={{ color: '#64748B' }}>
                {step === 'signup' ? 'Creating your account...' : 'Verifying OTP...'}
              </p>
            </div>
          )}

          {step === 'signup' && (
            <>
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
                Already have an account? <a href="/sign-in">Sign in</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
