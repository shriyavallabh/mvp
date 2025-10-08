"use client"

import type React from "react"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface ProfileFormProps {
  phoneNumber: string
}

export function ProfileForm({ phoneNumber }: ProfileFormProps) {
  const { signUp, setActive } = useSignUp()
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    const labels = ["Weak", "Fair", "Good", "Strong"]
    const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"]

    return {
      strength: (strength / 4) * 100,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "#EF4444",
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)

      try {
        if (!signUp) {
          throw new Error('Clerk SignUp not initialized')
        }

        // Split full name into first and last name
        const nameParts = formData.fullName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Create Clerk account with verified phone metadata
        const result = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: firstName,
          lastName: lastName,
          unsafeMetadata: {
            phone: `+91${phoneNumber}`,
            phoneVerified: true,
            verifiedAt: new Date().toISOString()
          }
        })

        // If account creation is complete, set session and redirect
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          setSuccess(true)

          // Redirect to onboarding after showing success message
          setTimeout(() => {
            router.push('/onboarding')
          }, 2000)
        } else {
          // Handle incomplete signup (shouldn't happen with email/password)
          throw new Error('Account creation incomplete')
        }
      } catch (err: any) {
        console.error('Clerk signup error:', err)

        // Handle specific Clerk errors
        if (err.errors) {
          const clerkError = err.errors[0]
          if (clerkError.code === 'form_identifier_exists') {
            newErrors.email = 'This email is already registered'
          } else if (clerkError.code === 'form_password_pwned') {
            newErrors.password = 'This password has been exposed in a data breach. Please choose a different one.'
          } else {
            newErrors.general = clerkError.message || 'Failed to create account'
          }
        } else {
          newErrors.general = err.message || 'Failed to create account. Please try again.'
        }

        setErrors(newErrors)
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (success) {
    return (
      <Card className="bg-white border-0 shadow-xl">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-6">Welcome to JarvisDaily. Redirecting you to complete your setup...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Complete your profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-900">
              Full Name <span className="text-[#EF4444]">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            {errors.fullName && <p className="text-[#EF4444] text-sm">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900">
              Email <span className="text-[#EF4444]">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="text-[#EF4444] text-sm">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900">
              Password <span className="text-[#EF4444]">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <p className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {errors.password && <p className="text-[#EF4444] text-sm">{errors.password}</p>}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
            />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
              I agree to the{" "}
              <Link href="/terms" className="text-[#3B82F6] hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#3B82F6] hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-[#EF4444] text-sm">{errors.acceptTerms}</p>}

          {errors.general && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-md">
              <p className="text-[#EF4444] text-sm">{errors.general}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
