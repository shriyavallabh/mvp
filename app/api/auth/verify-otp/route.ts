import { NextRequest, NextResponse } from 'next/server';
import { otpStorage } from '@/lib/otp-storage';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    // Validate inputs
    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored OTP from in-memory storage (dev) or Vercel KV (production)
    const storedData = otpStorage.get(phone);

    if (!storedData) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (storedData.expiresAt < Date.now()) {
      otpStorage.delete(phone);
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // OTP is valid - delete it (one-time use)
    otpStorage.delete(phone);

    console.log(`[OTP] Verified for ${phone}`);

    return NextResponse.json({
      success: true,
      phoneVerified: true,
      message: 'Phone number verified successfully'
    });

  } catch (error: any) {
    console.error('[VERIFY OTP ERROR]', error);

    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
