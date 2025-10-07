'use client'

import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7] font-inter antialiased overflow-x-hidden">
      {/* Fixed Navigation with Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[rgba(10,10,10,0.8)] backdrop-blur-[20px] border-b border-[rgba(124,58,237,0.1)] py-4">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between">
            {/* Logo with Gradient - exact match */}
            <Link href="/" className="text-2xl font-extrabold bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent">
              JarvisDaily
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-10">
              <a href="#features" className="hidden md:block text-[#A1A1AA] hover:text-[#7C3AED] font-medium text-[0.95rem] transition-colors duration-300">
                Features
              </a>
              <a href="#pricing" className="hidden md:block text-[#A1A1AA] hover:text-[#7C3AED] font-medium text-[0.95rem] transition-colors duration-300">
                Pricing
              </a>
              <a href="#how" className="hidden md:block text-[#A1A1AA] hover:text-[#7C3AED] font-medium text-[0.95rem] transition-colors duration-300">
                How It Works
              </a>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    className="bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.2)] hover:border-[rgba(124,58,237,0.5)] hover:text-[#C4B5FD] px-6 py-2.5 rounded-lg font-semibold transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link href="/dashboard">
                  <Button className="bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.2)] px-6 py-2.5 rounded-lg font-semibold">
                    Dashboard
                  </Button>
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mt-[100px] pt-24 pb-16 px-8 max-w-[1400px] mx-auto text-center">
        {/* Hero Badge */}
        <Badge className="inline-block bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#C4B5FD] mb-8 px-5 py-2 rounded-full text-[0.85rem] animate-fade-in-up">
          🚀 AI-powered viral content in 2.3 seconds
        </Badge>

        {/* Hero Headline - exact clamp and gradient */}
        <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6 animate-fade-in-up animation-delay-100">
          <span className="bg-gradient-to-br from-[#FFFFFF] via-[#A78BFA] to-[#7C3AED] bg-clip-text text-transparent">
            Grammy-Level Viral
          </span>
          <br />
          WhatsApp Content for
          <br />
          Financial Advisors
        </h1>

        {/* Hero Subtitle */}
        <p className="text-[clamp(1.1rem,2vw,1.4rem)] text-[#A1A1AA] max-w-[700px] mx-auto mb-12 leading-[1.6] animate-fade-in-up animation-delay-200">
          While competitors think, you deliver. AI generates 9.0+ virality content and delivers directly to WhatsApp. Zero effort, maximum engagement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap animate-fade-in-up animation-delay-300">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white px-10 py-4 text-[1.05rem] font-semibold rounded-xl inline-flex items-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Start Free Trial →
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button
                className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white px-10 py-4 text-[1.05rem] font-semibold rounded-xl inline-flex items-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Go to Dashboard →
              </Button>
            </Link>
          </SignedIn>

          <Button
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#E4E4E7] px-10 py-4 text-[1.05rem] font-semibold rounded-xl hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300"
          >
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Phone Mockup Section */}
      <section className="max-w-[1200px] mx-auto px-8 my-24 animate-fade-in-up animation-delay-400">
        <div className="perspective-1500 relative">
          <div
            className="phone-3d max-w-[400px] mx-auto transition-transform duration-[600ms] hover:phone-3d-hover"
            style={{
              transform: 'rotateY(-15deg) rotateX(5deg)',
            }}
          >
            {/* Phone Frame */}
            <div className="bg-[#1C1C1E] rounded-[45px] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.5),0_0_80px_rgba(124,58,237,0.1)] border border-[rgba(255,255,255,0.1)]">
              {/* Phone Screen */}
              <div className="bg-white rounded-[35px] overflow-hidden">
                {/* WhatsApp Header */}
                <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]"></div>
                  <div>
                    <h3 className="text-white font-semibold text-base">JarvisDaily</h3>
                    <p className="text-white/90 text-xs">online</p>
                  </div>
                </div>

                {/* WhatsApp Messages */}
                <div className="bg-[#ECE5DD] p-6 min-h-[500px] space-y-4">
                  <div className="bg-white rounded-lg max-w-[85%] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.1)] animate-slide-in">
                    <p className="text-[#303030] text-[0.9rem] leading-[1.4] mb-1">
                      🚀 Market Update: Nifty crossed 24,000! Your SIP investors earned 12.4% returns this quarter. Here&apos;s what to tell your clients...
                    </p>
                    <p className="text-[#667781] text-[0.7rem] text-right">9:41 AM</p>
                  </div>

                  <div className="bg-white rounded-lg max-w-[85%] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.1)] animate-slide-in">
                    <p className="text-[#303030] text-[0.9rem] leading-[1.4] mb-1">
                      💡 Pro Tip: 3 mutual funds outperforming in this market. Share this with your high-value clients today for instant credibility.
                    </p>
                    <p className="text-[#667781] text-[0.7rem] text-right">9:42 AM</p>
                  </div>

                  <div className="bg-[#DCF8C6] rounded-lg max-w-[85%] ml-auto p-3 shadow-[0_1px_2px_rgba(0,0,0,0.1)] animate-slide-in">
                    <p className="text-[#303030] text-[0.9rem] leading-[1.4] mb-1">
                      📊 Success Story: Mumbai advisor&apos;s client invested ₹50K/month → ₹2.8 Cr in 8 years! Perfect story to inspire your prospects.
                    </p>
                    <p className="text-[#667781] text-[0.7rem] text-right">9:43 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-[rgba(255,255,255,0.03)] border-t border-b border-[rgba(255,255,255,0.05)] py-12 px-8 my-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 items-center">
          {/* Portfolio Size */}
          <div className="text-center">
            <div className="text-5xl font-extrabold bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent mb-2">
              ₹2.4M+
            </div>
            <div className="text-[#71717A] text-[0.95rem]">Average Portfolio Size</div>
          </div>

          {/* Bank Logos */}
          <div className="flex flex-wrap justify-center gap-8">
            {['HDFC', 'AXIS', 'KOTAK', 'SBI'].map((bank) => (
              <div
                key={bank}
                className="w-20 h-10 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center text-[#71717A] text-xs font-semibold"
              >
                {bank}
              </div>
            ))}
          </div>

          {/* Advisors Count */}
          <div className="text-center">
            <div className="text-5xl font-extrabold bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent mb-2">
              28K+
            </div>
            <div className="text-[#71717A] text-[0.95rem]">Advisors Trust Us</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-[1200px] mx-auto px-8 my-24">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-center mb-4">
          Built for Speed. Designed for Results.
        </h2>
        <p className="text-[#71717A] text-xl text-center mb-16">
          Three pillars that make JarvisDaily unstoppable
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Viral AI Content',
              description: 'Our AI analyzes 100+ viral posts daily. Generates 9.0+ engagement content using proven formulas from Ankur Warikoo, CA Rachana Ranade, and Sharan Hegde.'
            },
            {
              icon: '💬',
              title: 'WhatsApp Native',
              description: 'Perfect formatting for WhatsApp. 300-400 characters, emojis, line breaks—everything optimized for maximum readability on mobile.'
            },
            {
              icon: '🎯',
              title: 'Zero Effort',
              description: 'Set preferences once. AI generates content daily. Review in 10 seconds. Approve and auto-deliver. Spend time closing deals, not writing content.'
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(124,58,237,0.3)] hover:-translate-y-[5px] transition-all duration-300 rounded-2xl">
              <CardContent className="p-10">
                <div className="w-[60px] h-[60px] bg-gradient-to-br from-[rgba(124,58,237,0.2)] to-[rgba(167,139,250,0.1)] rounded-xl flex items-center justify-center text-[1.8rem] mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#E4E4E7] mb-4">
                  {feature.title}
                </h3>
                <p className="text-[#A1A1AA] leading-[1.7]">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-[1200px] mx-auto px-8 my-24">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-center mb-16">
          From Zero to Viral in 4 Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { num: '1', title: 'Set Preferences', desc: 'Tell us your niche, client type, and content style. Takes 2 minutes.' },
            { num: '2', title: 'AI Generates', desc: 'Our 14-agent system creates Grammy-level content in 2.3 seconds.' },
            { num: '3', title: 'Review & Approve', desc: 'Preview on WhatsApp. Make edits if needed. One-click approve.' },
            { num: '4', title: 'Auto-Deliver', desc: 'Content lands in your WhatsApp. Copy, customize, send to clients.' }
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-[60px] h-[60px] mx-auto mb-6 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)]">
                {step.num}
              </div>
              <h3 className="text-[1.3rem] font-bold text-[#E4E4E7] mb-3">
                {step.title}
              </h3>
              <p className="text-[#A1A1AA] leading-[1.6]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-[800px] mx-auto px-8 my-24">
        <Card className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-center rounded-[20px]">
          <CardContent className="p-12">
            <div className="text-[#FCD34D] text-2xl mb-6">★★★★★</div>
            <p className="text-[1.3rem] leading-[1.8] text-[#E4E4E7] mb-8 italic">
              &quot;My client engagement jumped 3x in 30 days. JarvisDaily&apos;s AI content is better than what I was paying ₹15K/month for. Now I spend 10 minutes daily instead of 3 hours.&quot;
            </p>
            <div className="font-bold text-[1.1rem] text-[#E4E4E7] mb-1">
              Nitin Mehta
            </div>
            <div className="text-[#71717A] text-[0.95rem]">
              Financial Advisor, Mumbai · ₹4.2Cr Portfolio
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-[1200px] mx-auto px-8 my-24">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-center mb-4">
          Choose Your Growth Plan
        </h2>
        <p className="text-[#71717A] text-xl text-center mb-16">
          All plans include Grammy-level AI content & WhatsApp delivery
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <Card className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:-translate-y-[5px] transition-all duration-300 rounded-2xl">
            <CardContent className="p-10">
              <div className="text-[#A1A1AA] font-semibold text-sm mb-4">BASIC</div>
              <div className="text-5xl font-extrabold text-[#E4E4E7] mb-2">₹2,500</div>
              <div className="text-[#71717A] mb-8">/month</div>

              <ul className="space-y-0 mb-8">
                {['1 content piece daily', 'WhatsApp delivery', 'Basic analytics', 'Email support'].map((feature) => (
                  <li key={feature} className="flex items-start text-[#A1A1AA] border-b border-[rgba(255,255,255,0.05)] py-3">
                    <span className="text-[#25D366] font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.2)] rounded-xl py-4 font-semibold transition-all duration-300">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan (Featured) */}
          <Card className="bg-gradient-to-br from-[rgba(124,58,237,0.1)] to-[rgba(109,40,217,0.05)] border-2 border-[rgba(124,58,237,0.3)] scale-105 hover:scale-105 hover:-translate-y-[5px] transition-all duration-300 rounded-2xl">
            <CardContent className="p-10">
              <div className="text-[#A1A1AA] font-semibold text-sm mb-4">PRO ⭐ MOST POPULAR</div>
              <div className="text-5xl font-extrabold text-[#E4E4E7] mb-2">₹5,000</div>
              <div className="text-[#71717A] mb-8">/month</div>

              <ul className="space-y-0 mb-8">
                {['3 content pieces daily', 'LinkedIn + WhatsApp + Status', 'Advanced analytics', 'Priority support', 'Custom branding', 'A/B testing'].map((feature) => (
                  <li key={feature} className="flex items-start text-[#A1A1AA] border-b border-[rgba(255,255,255,0.05)] py-3">
                    <span className="text-[#25D366] font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white border-none rounded-xl py-4 font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.4)] transition-all duration-300">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:-translate-y-[5px] transition-all duration-300 rounded-2xl">
            <CardContent className="p-10">
              <div className="text-[#A1A1AA] font-semibold text-sm mb-4">AGENCY</div>
              <div className="text-5xl font-extrabold text-[#E4E4E7] mb-2">₹10,000</div>
              <div className="text-[#71717A] mb-8">/month</div>

              <ul className="space-y-0 mb-8">
                {['Unlimited content', 'Multi-platform delivery', 'White-label option', 'Dedicated account manager', 'API access', 'Custom integrations'].map((feature) => (
                  <li key={feature} className="flex items-start text-[#A1A1AA] border-b border-[rgba(255,255,255,0.05)] py-3">
                    <span className="text-[#25D366] font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.2)] rounded-xl py-4 font-semibold transition-all duration-300">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.05)] py-16 px-8 mt-24">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {[
            {
              title: 'Product',
              links: [
                { name: 'Features', href: '#features' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'How It Works', href: '#how' },
                { name: 'API Docs', href: '#' }
              ]
            },
            {
              title: 'Company',
              links: [
                { name: 'About Us', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Contact', href: '#' }
              ]
            },
            {
              title: 'Legal',
              links: [
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
                { name: 'SEBI Compliance', href: '#' },
                { name: 'Refund Policy', href: '#' }
              ]
            },
            {
              title: 'Connect',
              links: [
                { name: 'Twitter', href: '#' },
                { name: 'LinkedIn', href: '#' },
                { name: 'Instagram', href: '#' },
                { name: 'WhatsApp', href: '#' }
              ]
            }
          ].map((section) => (
            <div key={section.title} className="text-center md:text-left">
              <h3 className="font-bold text-base text-[#E4E4E7] mb-6">{section.title}</h3>
              <ul className="space-y-0">
                {section.links.map((link) => (
                  <li key={link.name} className="py-2">
                    <a href={link.href} className="text-[#71717A] hover:text-[#A78BFA] text-sm transition-colors duration-300 block">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.05)] pt-8 text-center text-[#52525B] text-sm">
          © 2025 JarvisDaily. Built for India&apos;s top financial advisors.
        </div>
      </footer>

      {/* Landing Page Design Showcase */}
      <section className="max-w-[1200px] mx-auto px-8 my-24">
        <div className="text-center mb-16">
          <Badge className="inline-block bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#C4B5FD] mb-8 px-5 py-2 rounded-full text-[0.85rem]">
            🎨 Design Showcase
          </Badge>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold mb-4">
            6 World-Class Landing Page Designs
          </h2>
          <p className="text-[#71717A] text-xl mb-8">
            Inspired by Silicon Valley's best: Stripe, Vercel, Notion, Superhuman, Framer, Zerodha
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Stripe-Inspired",
              subtitle: "Product-Led Growth",
              desc: "Clean white background, blue/purple gradients, minimal copy, professional shadows",
              href: "/landing-v1",
              gradient: "from-blue-500 to-purple-600"
            },
            {
              title: "Vercel-Inspired",
              subtitle: "Premium Dark Theme",
              desc: "Black background, glass morphism cards, purple accents, smooth transitions",
              href: "/landing-v2",
              gradient: "from-purple-400 to-purple-800"
            },
            {
              title: "Linear-Inspired",
              subtitle: "Purple Gradient Power",
              desc: "Full gradient background, glass blur effects, centered typography, modern",
              href: "/landing-v3",
              gradient: "from-purple-500 to-blue-600"
            },
            {
              title: "Notion-Inspired",
              subtitle: "Warm & Approachable",
              desc: "Beige background, serif headlines, asymmetric layout, professional trust",
              href: "/landing-v4",
              gradient: "from-amber-100 to-stone-400"
            },
            {
              title: "Framer-Inspired",
              subtitle: "Dark & Energetic",
              desc: "Dark gray, pink/blue gradients, split screen, gradient borders, bold",
              href: "/landing-v5",
              gradient: "from-pink-500 to-blue-500"
            },
            {
              title: "Zerodha-Inspired",
              subtitle: "Indian Fintech Pro",
              desc: "White background, blue/green trust colors, stats heavy, Made in India 🇮🇳",
              href: "/landing-v6",
              gradient: "from-blue-600 to-green-600"
            }
          ].map((design, index) => (
            <Link key={index} href={design.href}>
              <Card className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(124,58,237,0.3)] hover:-translate-y-[5px] transition-all duration-300 rounded-2xl h-full cursor-pointer">
                <CardContent className="p-8">
                  <div className={`w-full h-32 bg-gradient-to-br ${design.gradient} rounded-xl mb-6 flex items-center justify-center text-4xl font-bold text-white`}>
                    v{index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-[#E4E4E7] mb-2">
                    {design.title}
                  </h3>
                  <p className="text-sm text-[#A78BFA] mb-4">
                    {design.subtitle}
                  </p>
                  <p className="text-[#A1A1AA] text-sm leading-[1.6]">
                    {design.desc}
                  </p>
                  <Button className="w-full mt-6 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.2)] rounded-xl py-3 font-semibold transition-all duration-300">
                    View Design →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Floating Performance Badge */}
      <div className="fixed bottom-5 right-5 z-[999] bg-[rgba(124,58,237,0.95)] px-5 py-3 rounded-full text-sm font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.4)] animate-pulse-slow">
        ⚡ 50ms interactions
      </div>
    </div>
  )
}
