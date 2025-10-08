"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

interface OtpFormProps {
  phoneNumber: string
  onVerified: () => void
  onBack: () => void
}

export function OtpForm({ phoneNumber, onVerified, onBack }: OtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError("")

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setIsLoading(true)

    try {
      // Call verify OTP API
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${phoneNumber}`,
          otp: otpValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Success
      setSuccess("OTP verified successfully!")
      setTimeout(() => onVerified(), 500)
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleResend = async () => {
    setError("")
    setSuccess("")

    try {
      // Call send OTP API again
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phoneNumber}` })
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      setSuccess("OTP resent successfully!")
      setOtp(["", "", "", "", "", ""]) // Clear OTP inputs
      inputRefs.current[0]?.focus()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  }

  return (
    <Card className="bg-white border-0 shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-gray-900">Verify your phone number</CardTitle>
        <CardDescription className="text-gray-600">
          We've sent a 6-digit code to +91{phoneNumber} via SMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-md focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            ))}
          </div>

          {error && <p className="text-[#EF4444] text-sm text-center">{error}</p>}
          {success && <p className="text-[#10B981] text-sm text-center">{success}</p>}

          <Button
            type="submit"
            className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </Button>

          <div className="flex flex-col items-center gap-2 text-sm">
            <button type="button" onClick={handleResend} className="text-[#3B82F6] hover:underline">
              Didn't receive? Resend OTP
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
