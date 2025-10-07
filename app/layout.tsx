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
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
