import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

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
      <html lang="en" className="bg-[#0A0A0A]">
        <body suppressHydrationWarning className="bg-[#0A0A0A] text-[#E4E4E7] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
