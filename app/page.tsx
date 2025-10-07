'use client'

import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-bg text-linear-zinc-200 font-inter antialiased">
      {/* Fixed Navigation with Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-linear-bg/80 backdrop-blur-xl border-b border-linear-purple/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with Gradient */}
            <Link href="/" className="text-2xl font-extrabold bg-gradient-purple bg-clip-text text-transparent">
              JarvisDaily
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-linear-zinc-400 hover:text-linear-purple font-medium text-sm transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-linear-zinc-400 hover:text-linear-purple font-medium text-sm transition-colors">
                Pricing
              </a>
              <a href="#how" className="text-linear-zinc-400 hover:text-linear-purple font-medium text-sm transition-colors">
                How It Works
              </a>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="bg-linear-purple/10 border-linear-purple/30 text-linear-purple-light hover:bg-linear-purple/20 hover:border-linear-purple/50 hover:text-linear-purple-lighter rounded-lg"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link href="/dashboard">
                  <Button variant="outline" className="bg-linear-purple/10 border-linear-purple/30 text-linear-purple-light hover:bg-linear-purple/20 rounded-lg">
                    Dashboard
                  </Button>
                </Link>
                <UserButton />
              </SignedIn>
            </div>

            {/* Mobile Sign In */}
            <div className="md:hidden">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="bg-linear-purple/10 border-linear-purple/30 text-linear-purple-light">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-8 mt-16 max-w-7xl mx-auto text-center">
        {/* Hero Badge */}
        <Badge className="inline-block bg-linear-purple/10 border-linear-purple/30 text-linear-purple-lighter mb-8 px-5 py-2 rounded-full text-sm animate-fade-in-up">
          🚀 AI-powered viral content in 2.3 seconds
        </Badge>

        {/* Hero Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up animation-delay-100">
          <span className="bg-gradient-text bg-clip-text text-transparent">
            Grammy-Level Viral
          </span>
          <br />
          WhatsApp Content for
          <br />
          Financial Advisors
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg md:text-xl text-linear-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
          While competitors think, you deliver. AI generates 9.0+ virality content and delivers directly to WhatsApp. Zero effort, maximum engagement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up animation-delay-300">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="bg-gradient-purple-dark text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Start Free Trial →
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-purple-dark text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Go to Dashboard →
              </Button>
            </Link>
          </SignedIn>

          <Button
            size="lg"
            variant="outline"
            className="bg-white/5 border-white/10 text-linear-zinc-200 px-10 py-6 text-lg font-semibold rounded-xl hover:bg-white/8 hover:border-white/20 transition-all"
          >
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Phone Mockup Section */}
      <section className="max-w-5xl mx-auto px-8 py-16 animate-fade-in-up animation-delay-400">
        <div className="perspective-1500">
          <div
            className="phone-3d max-w-md mx-auto transition-transform duration-500 hover:scale-105"
            style={{
              transform: 'rotateY(-15deg) rotateX(5deg)',
            }}
          >
            {/* Phone Frame */}
            <div className="bg-[#1C1C1E] rounded-[45px] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.5),0_0_80px_rgba(124,58,237,0.1)] border border-white/10">
              {/* Phone Screen */}
              <div className="bg-white rounded-[35px] overflow-hidden">
                {/* WhatsApp Header */}
                <div className="bg-linear-whatsapp px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-purple"></div>
                  <div>
                    <h3 className="text-white font-semibold text-base">JarvisDaily</h3>
                    <p className="text-white/90 text-xs">online</p>
                  </div>
                </div>

                {/* WhatsApp Messages */}
                <div className="bg-[#ECE5DD] p-6 min-h-[500px] space-y-4">
                  <div className="bg-white rounded-lg max-w-[85%] p-3 shadow-sm animate-slide-in">
                    <p className="text-[#303030] text-sm leading-relaxed mb-1">
                      🚀 Market Update: Nifty crossed 24,000! Your SIP investors earned 12.4% returns this quarter. Here's what to tell your clients...
                    </p>
                    <p className="text-[#667781] text-xs text-right">9:41 AM</p>
                  </div>

                  <div className="bg-white rounded-lg max-w-[85%] p-3 shadow-sm animate-slide-in animation-delay-100">
                    <p className="text-[#303030] text-sm leading-relaxed mb-1">
                      💡 Pro Tip: 3 mutual funds outperforming in this market. Share this with your high-value clients today for instant credibility.
                    </p>
                    <p className="text-[#667781] text-xs text-right">9:42 AM</p>
                  </div>

                  <div className="bg-[#DCF8C6] rounded-lg max-w-[85%] ml-auto p-3 shadow-sm animate-slide-in animation-delay-200">
                    <p className="text-[#303030] text-sm leading-relaxed mb-1">
                      📊 Success Story: Mumbai advisor's client invested ₹50K/month → ₹2.8 Cr in 8 years! Perfect story to inspire your prospects.
                    </p>
                    <p className="text-[#667781] text-xs text-right">9:43 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-white/[0.03] border-t border-b border-white/5 py-12 px-8 my-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
          {/* Portfolio Size */}
          <div>
            <div className="text-5xl font-extrabold bg-gradient-purple bg-clip-text text-transparent mb-2">
              ₹2.4M+
            </div>
            <div className="text-linear-zinc-500 text-sm">Average Portfolio Size</div>
          </div>

          {/* Bank Logos */}
          <div className="flex flex-wrap justify-center gap-6">
            {['HDFC', 'AXIS', 'KOTAK', 'SBI'].map((bank) => (
              <div
                key={bank}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-linear-zinc-500 text-xs font-semibold"
              >
                {bank}
              </div>
            ))}
          </div>

          {/* Advisors Count */}
          <div className="text-center md:text-right">
            <div className="text-5xl font-extrabold bg-gradient-purple bg-clip-text text-transparent mb-2">
              28K+
            </div>
            <div className="text-linear-zinc-500 text-sm">Advisors Trust Us</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4">
          Built for Speed. Designed for Results.
        </h2>
        <p className="text-linear-zinc-400 text-xl text-center mb-16">
          Three pillars that make JarvisDaily unstoppable
        </p>

        <div className="grid md:grid-cols-3 gap-8">
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
            <Card key={index} className="bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-linear-purple/30 transition-all hover:-translate-y-2 duration-300">
              <CardContent className="p-10">
                <div className="w-16 h-16 bg-gradient-purple/20 rounded-xl flex items-center justify-center text-4xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-linear-zinc-100 mb-4">
                  {feature.title}
                </h3>
                <p className="text-linear-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16">
          From Zero to Viral in 4 Steps
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: '1', title: 'Set Preferences', desc: 'Tell us your niche, client type, and content style. Takes 2 minutes.' },
            { num: '2', title: 'AI Generates', desc: 'Our 14-agent system creates Grammy-level content in 2.3 seconds.' },
            { num: '3', title: 'Review & Approve', desc: 'Preview on WhatsApp. Make edits if needed. One-click approve.' },
            { num: '4', title: 'Auto-Deliver', desc: 'Content lands in your WhatsApp. Copy, customize, send to clients.' }
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-purple-dark rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)]">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-linear-zinc-100 mb-3">
                {step.title}
              </h3>
              <p className="text-linear-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-8 py-20">
        <Card className="bg-white/[0.03] border-white/5 text-center">
          <CardContent className="p-12">
            <div className="text-4xl text-[#FCD34D] mb-6">★★★★★</div>
            <p className="text-xl md:text-2xl text-linear-zinc-200 leading-relaxed mb-8 italic">
              "My client engagement jumped 3x in 30 days. JarvisDaily's AI content is better than what I was paying ₹15K/month for. Now I spend 10 minutes daily instead of 3 hours."
            </p>
            <div className="font-bold text-lg text-linear-zinc-100 mb-1">
              Nitin Mehta
            </div>
            <div className="text-linear-zinc-500 text-sm">
              Financial Advisor, Mumbai · ₹4.2Cr Portfolio
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4">
          Choose Your Growth Plan
        </h2>
        <p className="text-linear-zinc-400 text-xl text-center mb-16">
          All plans include Grammy-level AI content & WhatsApp delivery
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <Card className="bg-white/[0.03] border-white/5 hover:-translate-y-2 transition-all duration-300">
            <CardContent className="p-10">
              <div className="text-linear-zinc-400 font-semibold text-sm mb-4">BASIC</div>
              <div className="text-5xl font-extrabold text-linear-zinc-100 mb-2">₹2,500</div>
              <div className="text-linear-zinc-500 mb-8">/month</div>

              <ul className="space-y-4 mb-8">
                {['1 content piece daily', 'WhatsApp delivery', 'Basic analytics', 'Email support'].map((feature) => (
                  <li key={feature} className="flex items-start text-linear-zinc-400 border-b border-white/5 pb-3">
                    <span className="text-linear-whatsapp font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-linear-purple/10 border border-linear-purple/30 text-linear-purple-light hover:bg-linear-purple/20 rounded-xl py-4">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan (Featured) */}
          <Card className="bg-gradient-purple/10 border-2 border-linear-purple/30 scale-105 hover:scale-110 transition-all duration-300 shadow-[0_20px_60px_rgba(124,58,237,0.3)]">
            <CardContent className="p-10">
              <div className="text-linear-purple-lighter font-semibold text-sm mb-4">PRO ⭐ MOST POPULAR</div>
              <div className="text-5xl font-extrabold text-linear-zinc-100 mb-2">₹5,000</div>
              <div className="text-linear-zinc-400 mb-8">/month</div>

              <ul className="space-y-4 mb-8">
                {['3 content pieces daily', 'LinkedIn + WhatsApp + Status', 'Advanced analytics', 'Priority support', 'Custom branding', 'A/B testing'].map((feature) => (
                  <li key={feature} className="flex items-start text-linear-zinc-300 border-b border-linear-purple/20 pb-3">
                    <span className="text-linear-whatsapp font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-gradient-purple-dark text-white rounded-xl py-4 shadow-[0_4px_20px_rgba(124,58,237,0.4)]">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="bg-white/[0.03] border-white/5 hover:-translate-y-2 transition-all duration-300">
            <CardContent className="p-10">
              <div className="text-linear-zinc-400 font-semibold text-sm mb-4">AGENCY</div>
              <div className="text-5xl font-extrabold text-linear-zinc-100 mb-2">₹10,000</div>
              <div className="text-linear-zinc-500 mb-8">/month</div>

              <ul className="space-y-4 mb-8">
                {['Unlimited content', 'Multi-platform delivery', 'White-label option', 'Dedicated account manager', 'API access', 'Custom integrations'].map((feature) => (
                  <li key={feature} className="flex items-start text-linear-zinc-400 border-b border-white/5 pb-3">
                    <span className="text-linear-whatsapp font-bold mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-linear-purple/10 border border-linear-purple/30 text-linear-purple-light hover:bg-linear-purple/20 rounded-xl py-4">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-white/5 py-16 px-8 mt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
          {[
            {
              title: 'Product',
              links: ['Features', 'Pricing', 'How It Works', 'API Docs']
            },
            {
              title: 'Company',
              links: ['About Us', 'Careers', 'Blog', 'Contact']
            },
            {
              title: 'Legal',
              links: ['Privacy Policy', 'Terms of Service', 'SEBI Compliance', 'Refund Policy']
            },
            {
              title: 'Connect',
              links: ['Twitter', 'LinkedIn', 'Instagram', 'WhatsApp']
            }
          ].map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-linear-zinc-100 mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-linear-zinc-500 hover:text-linear-purple-light text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 text-center text-linear-zinc-600 text-sm">
          © 2025 JarvisDaily. Built for India's top financial advisors.
        </div>
      </footer>

      {/* Floating Performance Badge */}
      <div className="fixed bottom-5 right-5 z-50 bg-linear-purple/95 px-5 py-3 rounded-full text-sm font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.4)] animate-pulse-slow">
        ⚡ 50ms interactions
      </div>
    </div>
  )
}
