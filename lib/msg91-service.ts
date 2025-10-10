/**
 * MSG91 OTP Widget Service
 *
 * Handles OTP sending and verification via MSG91 OTP Widget API
 * Docs: https://docs.msg91.com/otp-widget
 * Uses Pethkarandco widget (ID: 35626e6c7577383534333630)
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
 * Verify OTP via MSG91 Widget API
 * @param phone - Phone number with country code
 * @param otp - OTP entered by user
 * @param reqId - Request ID from send OTP response
 * @returns Promise with verification result
 */
export async function verifyOTPViaMSG91(
  phone: string,
  otp: string,
  reqId?: string
): Promise<MSG91VerifyOTPResponse> {
  const widgetToken = process.env.MSG91_WIDGET_TOKEN;
  const widgetId = process.env.MSG91_WIDGET_ID;

  if (!widgetToken || !widgetId) {
    throw new Error('MSG91_WIDGET_TOKEN or MSG91_WIDGET_ID not configured');
  }

  // Remove + from phone number if present
  const cleanPhone = phone.replace('+', '');

  // Use MSG91 OTP Widget Verify API
  // Docs: https://docs.msg91.com/otp-widget
  const url = 'https://control.msg91.com/api/v5/widget/otp/verify';

  const requestBody = {
    widgetId: widgetId,
    identifier: cleanPhone,
    otp: otp
  };

  console.log('[MSG91 Widget Verify Request]', JSON.stringify(requestBody));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': widgetToken // Widget uses 'token' header, not 'authkey'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json() as any;

    console.log('[MSG91 Widget Verify Response]', JSON.stringify(data));

    if (data.type === 'success' || data.message === 'OTP verified successfully') {
      return {
        type: 'success',
        message: data.message || 'OTP verified successfully'
      };
    } else {
      throw new Error(data.message || 'Invalid OTP');
    }
  } catch (error: any) {
    console.error('[MSG91 WIDGET VERIFY ERROR]', error);
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
