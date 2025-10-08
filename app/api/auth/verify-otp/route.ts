import { NextResponse } from 'next/server'

// Same OTP storage as send-otp route
// In production, use shared Redis instance
const otpStorage = new Map<string, { otp: string; expiresAt: number }>()

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Get stored OTP
    const storedData = otpStorage.get(phone)

    if (!storedData) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (storedData.expiresAt < Date.now()) {
      otpStorage.delete(phone)
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      )
    }

    // OTP is valid - delete it (one-time use)
    otpStorage.delete(phone)

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully'
    })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    )
  }
}
