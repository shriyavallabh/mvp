/**
 * MSG91 SendOTP Service
 *
 * Handles OTP sending and verification via MSG91 SendOTP API
 * Docs: https://api.msg91.com/apidoc/sendotp/
 *
 * This uses MSG91's SendOTP API with default DLT-approved templates,
 * avoiding the need for custom template registration.
 */

interface MSG91SendOTPResponse {
  type: 'success' | 'error';
  message: string;
  reqId?: string; // Request ID returned by MSG91 for OTP tracking
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

  // Use MSG91's SendOTP API (Server-Side)
  // Docs: https://api.msg91.com/apidoc/sendotp/send-otp.php
  // No custom message - MSG91 uses default template (pre-approved, no DLT needed)
  const url = `http://api.msg91.com/api/sendotp.php?authkey=${authKey}&mobile=${cleanPhone}&otp=${otp}&otp_expiry=5&otp_length=6`;

  console.log('[MSG91 SendOTP Request] Phone:', cleanPhone, 'OTP:', otp);

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.json() as any;

    console.log('[MSG91 SendOTP Response]', JSON.stringify(data));

    // MSG91 returns type: 'success' or 'error'
    if (data.type === 'success') {
      return {
        type: 'success',
        message: 'OTP sent successfully',
        reqId: data.message // MSG91 returns reqId in 'message' field
      };
    } else {
      throw new Error(data.message || 'MSG91 API error');
    }
  } catch (error: any) {
    console.error('[MSG91 SEND ERROR]', error);
    throw new Error(error.message || 'MSG91 API request failed');
  }
}

/**
 * Verify OTP via MSG91 SendOTP API
 * @param phone - Phone number with country code
 * @param otp - OTP entered by user
 * @param reqId - Request ID from send OTP response (optional, not used in this API)
 * @returns Promise with verification result
 */
export async function verifyOTPViaMSG91(
  phone: string,
  otp: string,
  reqId?: string
): Promise<MSG91VerifyOTPResponse> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY not configured');
  }

  // Remove + from phone number if present
  const cleanPhone = phone.replace('+', '');

  // Use MSG91 verifyRequestOTP API (Simple GET request)
  // Docs: https://api.msg91.com/apidoc/sendotp/verify-otp.php
  const url = `http://api.msg91.com/api/verifyRequestOTP.php?authkey=${authKey}&mobile=${cleanPhone}&otp=${otp}`;

  console.log('[MSG91 Verify Request] Phone:', cleanPhone, 'OTP:', otp);

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.json() as any;

    console.log('[MSG91 Verify Response]', JSON.stringify(data));

    // MSG91 returns type: 'success' with message: 'number_verified_successfully'
    if (data.type === 'success' && data.message === 'number_verified_successfully') {
      return {
        type: 'success',
        message: 'OTP verified successfully'
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
