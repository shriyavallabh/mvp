/**
 * MSG91 OTP Service
 *
 * Handles OTP sending and verification via MSG91 API
 * Docs: https://docs.msg91.com/otp/sendotp
 */

interface MSG91SendOTPResponse {
  type: 'success' | 'error';
  message: string;
}

interface MSG91VerifyOTPResponse {
  type: 'success' | 'error';
  message: string;
}

/**
 * Send OTP via MSG91
 * @param phone - Phone number with country code (e.g., 919765071249)
 * @param otp - 6-digit OTP to send
 * @returns Promise with success/error response
 */
export async function sendOTPViaMSG91(
  phone: string,
  otp: string
): Promise<MSG91SendOTPResponse> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY not configured');
  }

  // Remove + from phone number if present
  const cleanPhone = phone.replace('+', '');

  // Use MSG91's official SendOTP API
  // Docs: https://api.msg91.com/apidoc/sendotp/send-otp.php
  // NOTE: Not providing 'message' parameter - MSG91 will use default OTP template
  // This avoids URL encoding issues with ##OTP## placeholder

  // Build URL manually to avoid URLSearchParams encoding issues
  const url = `http://api.msg91.com/api/sendotp.php?authkey=${authKey}&mobile=${cleanPhone}&otp=${otp}&otp_expiry=5&otp_length=6`;

  console.log('[MSG91 Request URL]', url);

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.json() as any;

    console.log('[MSG91 Response]', JSON.stringify(data));

    // MSG91 returns type: 'success' or 'error'
    if (data.type === 'error') {
      throw new Error(data.message || 'MSG91 API error');
    }

    return {
      type: 'success',
      message: data.message || 'OTP sent successfully'
    };
  } catch (error: any) {
    console.error('[MSG91 SEND ERROR]', error);
    throw new Error(error.message || 'MSG91 API request failed');
  }
}

/**
 * Verify OTP via MSG91
 * @param phone - Phone number with country code
 * @param otp - OTP to verify
 * @returns Promise with verification result
 */
export async function verifyOTPViaMSG91(
  phone: string,
  otp: string
): Promise<MSG91VerifyOTPResponse> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY not configured');
  }

  // Remove + from phone number if present
  const cleanPhone = phone.replace('+', '');

  // Use MSG91's official Verify OTP API
  // Docs: https://api.msg91.com/apidoc/sendotp/verify-otp.php
  const params = new URLSearchParams({
    authkey: authKey,
    mobile: cleanPhone,
    otp: otp
  });

  const url = `http://api.msg91.com/api/verifyRequestOTP.php?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.json() as MSG91VerifyOTPResponse;

    console.log('[MSG91 VERIFY Response]', JSON.stringify(data));

    if (data.type === 'success') {
      return {
        type: 'success',
        message: data.message || 'OTP verified successfully'
      };
    } else {
      throw new Error(data.message || 'Invalid OTP');
    }
  } catch (error: any) {
    console.error('[MSG91 VERIFY ERROR]', error);
    throw new Error(error.message || 'OTP verification failed');
  }
}

/**
 * Resend OTP via MSG91 (uses retry mechanism)
 * @param phone - Phone number with country code
 * @param retryType - Type of retry: 'voice' or 'text'
 * @returns Promise with success/error response
 */
export async function resendOTPViaMSG91(
  phone: string,
  retryType: 'voice' | 'text' = 'text'
): Promise<MSG91SendOTPResponse> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY not configured');
  }

  const cleanPhone = phone.replace('+', '');

  const url = 'https://control.msg91.com/api/v5/otp/retry';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey
      },
      body: JSON.stringify({
        mobile: cleanPhone,
        retrytype: retryType
      })
    });

    const data = await response.json() as MSG91SendOTPResponse;

    if (response.ok && data.type === 'success') {
      return {
        type: 'success',
        message: data.message || 'OTP resent successfully'
      };
    } else {
      throw new Error(data.message || 'Failed to resend OTP');
    }
  } catch (error: any) {
    console.error('[MSG91 RESEND ERROR]', error);
    throw new Error(error.message || 'Failed to resend OTP');
  }
}
