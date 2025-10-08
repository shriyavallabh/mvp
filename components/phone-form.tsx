"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface PhoneFormProps {
  onSubmit: (phone: string) => void
}

export function PhoneForm({ onSubmit }: PhoneFormProps) {
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)

    try {
      // Call OTP API
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Success - move to OTP step
      onSubmit(phone);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-white border-0 shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
        <CardDescription className="text-gray-600">Start generating viral content in under 2 minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-900">
              Phone Number
            </Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md">
                <span className="text-gray-700 font-medium">+91</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                className="flex-1"
              />
            </div>
            {error && <p className="text-[#EF4444] text-sm">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/signin" className="text-[#3B82F6] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
