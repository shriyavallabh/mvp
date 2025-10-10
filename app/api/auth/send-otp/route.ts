import { NextRequest, NextResponse } from 'next/server';
import { otpStorage } from '@/lib/otp-storage';
import { sendOTPViaMSG91 } from '@/lib/msg91-service';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // Validate phone number format (Indian numbers: +91 followed by 10 digits)
    if (!phone || !/^\+91[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be +91 followed by 10 digits.' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via MSG91 SendOTP API
    try {
      const result = await sendOTPViaMSG91(phone, otp);

      // Store OTP in-memory with 5-minute expiry
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      otpStorage.set(phone, {
        otp,
        expiresAt
      });

      console.log(`[OTP] Sent via MSG91 to ${phone}: ${otp}, reqId: ${result.reqId}`);

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        // Only show OTP in development for testing
        debug: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    } catch (msg91Error: any) {
      console.error('[MSG91 ERROR]', msg91Error.message);
      return NextResponse.json(
        { error: msg91Error.message || 'Failed to send OTP via MSG91' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[OTP ERROR]', error);

    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
