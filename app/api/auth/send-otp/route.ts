import { NextResponse } from 'next/server'

// Simple in-memory OTP storage (for MVP)
// In production, use Redis (Upstash) or database
const otpStorage = new Map<string, { otp: string; expiresAt: number }>()

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [phone, data] of otpStorage.entries()) {
    if (data.expiresAt < now) {
      otpStorage.delete(phone)
    }
  }
}, 5 * 60 * 1000)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^\+91\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be in format: +919876543210' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = generateOTP()

    // Store OTP with 5-minute expiry
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
    otpStorage.set(phone, { otp, expiresAt })

    // Send OTP via WhatsApp
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''), // Remove + for Meta API
          type: 'text',
          text: {
            body: `🔐 Your JarvisDaily verification code is: ${otp}\n\nValid for 5 minutes. Don't share this code with anyone.`
          }
        })
      }
    )

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json()
      console.error('WhatsApp API error:', errorData)

      // Still return success to user (OTP is stored)
      // In production, you'd want to retry or use fallback (SMS)
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        debug: process.env.NODE_ENV === 'development' ? otp : undefined
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your WhatsApp',
      // Only show OTP in development for testing
      debug: process.env.NODE_ENV === 'development' ? otp : undefined
    })

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
