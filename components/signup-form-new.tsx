"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function SignupFormNew() {
  const { signUp, setActive } = useSignUp()
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
    setError("")

    // Validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name")
      return
    }

    if (!formData.email.trim()) {
      setError("Please enter your email")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email")
      return
    }

    if (!formData.password) {
      setError("Please enter a password")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      if (!signUp) {
        throw new Error("Clerk SignUp not initialized")
      }

      // Split full name into first and last name
      const nameParts = formData.fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Create Clerk account (no phone verification yet)
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: firstName,
        lastName: lastName,
        unsafeMetadata: {
          onboardingCompleted: false,
          phoneVerified: false,
        },
      })

      // If account creation is complete, set session and redirect to onboarding
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        // Redirect to onboarding wizard
        router.push("/onboarding")
      } else {
        // Handle incomplete signup
        throw new Error("Account creation incomplete")
      }
    } catch (err: any) {
      console.error("Clerk signup error:", err)

      // Handle specific Clerk errors
      if (err.errors) {
        const clerkError = err.errors[0]
        if (clerkError.code === "form_identifier_exists") {
          setError("This email is already registered")
        } else if (clerkError.code === "form_password_pwned") {
          setError("This password has been exposed in a data breach. Please choose a different one.")
        } else {
          setError(clerkError.message || "Failed to create account")
        }
      } else {
        setError(err.message || "Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error("SignUp not initialized")
      }
      // Use OAuth with redirect - Clerk will handle account creation automatically
      // After OAuth completes, user will be redirected to /onboarding
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
        // Additional metadata to skip Clerk's signup form
        unsafeMetadata: {
          onboardingCompleted: false,
          phoneVerified: false,
          signupMethod: "oauth_google"
        }
      })
    } catch (err: any) {
      console.error("Google sign up error:", err)
      setError(err.errors?.[0]?.message || "Failed to authenticate with Google")
    }
  }

  const handleLinkedInSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error("SignUp not initialized")
      }
      // Use OAuth with redirect - Clerk will handle account creation automatically
      // After OAuth completes, user will be redirected to /onboarding
      await signUp.authenticateWithRedirect({
        strategy: "oauth_linkedin_oidc",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
        // Additional metadata to skip Clerk's signup form
        unsafeMetadata: {
          onboardingCompleted: false,
          phoneVerified: false,
          signupMethod: "oauth_linkedin"
        }
      })
    } catch (err: any) {
      console.error("LinkedIn sign up error:", err)
      setError(err.errors?.[0]?.message || "Failed to authenticate with LinkedIn")
    }
  }

  return (
    <Card className="bg-white border-0 shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
        <CardDescription className="text-gray-600">
          Start generating viral content in under 2 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Social Sign-Up Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              className="w-full h-11 text-base font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLinkedInSignUp}
              className="w-full h-11 text-base font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-900">
                Full Name <span className="text-[#EF4444]">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900">
                Email <span className="text-[#EF4444]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900">
                Password <span className="text-[#EF4444]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
            </div>

            {/* Clerk CAPTCHA Container */}
            <div id="clerk-captcha" className="flex justify-center"></div>

            {error && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-md">
                <p className="text-[#EF4444] text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-[#0A0A0A] font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[#3B82F6] hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#3B82F6] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#3B82F6] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
