import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'JarvisDaily - Your Daily Viral Content',
  description: 'Grammy-Level Viral Content for Financial Advisors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" className="dark bg-black" suppressHydrationWarning>
        <head>
          {/* Razorpay Checkout Script */}
          <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        </head>
        <body suppressHydrationWarning className="bg-black text-white antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
