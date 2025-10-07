'use client'

import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useState } from 'react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f3a] via-[#243057] to-[#1a1f3a] text-white">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1f3a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FFB800] rounded-lg flex items-center justify-center">
                <span className="text-[#1a1f3a] font-bold text-xl">J</span>
              </div>
              <span className="text-xl font-bold">JarvisDaily</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-white transition">Home</a>
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold px-6 py-2 rounded-lg transition">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold px-6 py-2 rounded-lg transition">
                    Dashboard
                  </button>
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
              <div className="flex flex-col space-y-4">
                <a href="#home" className="text-gray-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Home</a>
                <a href="#features" className="text-gray-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-16 px-6 overflow-hidden">
        {/* Starfield Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 left-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-60 right-1/4 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-32 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Grammy-Level<br />
                Viral Content.<br />
                Delivered Daily to<br />
                WhatsApp.
              </h1>
              <p className="text-lg text-gray-300 max-w-lg">
                AI-powered content engine that generates 8.0+ engagement scores. Trusted by 500+ Indian financial advisors.
              </p>
              <div className="flex flex-wrap gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold px-8 py-4 rounded-xl transition-all">
                      Start Free Trial
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold px-8 py-4 rounded-xl transition-all">
                      Go to Dashboard
                    </button>
                  </Link>
                </SignedIn>
                <button className="border-2 border-white text-white hover:bg-white hover:text-[#1a1f3a] font-semibold px-8 py-4 rounded-xl transition-all">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right Phone Mockup - Tilted */}
            <div className="flex justify-center lg:justify-end">
              <div className="transform rotate-6 hover:rotate-3 transition-transform duration-300">
                <div className="w-72 h-[600px] bg-gradient-to-br from-gray-800 to-black rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Phone Notch */}
                    <div className="h-8 bg-black flex items-center justify-center">
                      <div className="w-32 h-6 bg-white rounded-b-2xl"></div>
                    </div>

                    {/* WhatsApp Header */}
                    <div className="h-14 bg-[#075E54] flex items-center px-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                      <div>
                        <div className="text-white font-semibold text-sm">Jarvis Daily</div>
                        <div className="text-gray-300 text-xs">online</div>
                      </div>
                    </div>

                    {/* WhatsApp Messages */}
                    <div className="bg-[#E5DDD5] h-full p-4 space-y-3">
                      <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%]">
                        <p className="text-xs text-gray-800 leading-relaxed">
                          🚀 <strong>Market Update:</strong> Nifty crossed 24,000 today!<br />
                          Your SIP investors earned 12.4% returns...
                        </p>
                        <p className="text-[10px] text-gray-500 text-right mt-1">9:30 AM</p>
                      </div>

                      <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%]">
                        <p className="text-xs text-gray-800 leading-relaxed">
                          💡 <strong>Pro Tip:</strong> 3 mutual funds outperforming...
                        </p>
                        <p className="text-[10px] text-gray-500 text-right mt-1">2:45 PM</p>
                      </div>

                      <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm max-w-[85%] ml-auto">
                        <p className="text-xs text-gray-800 leading-relaxed">
                          <strong>📊 Success:</strong><br />₹50K/mo → ₹2.8Cr in 8 yrs!
                        </p>
                        <p className="text-[10px] text-gray-600 text-right mt-1">6:15 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-gradient-to-r from-[#2a3055] to-[#1f2847] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">2.4M+</div>
              <div className="text-sm text-gray-400">Portfolio size</div>
            </div>
            <div className="flex gap-8 items-center opacity-60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#004C8F] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">H</span>
                </div>
                <span className="text-xl font-bold">HDFC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#97144D] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <span className="text-xl font-bold">AXIS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ED232A] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
                <span className="text-xl font-bold">Kotak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#22409A] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SBI</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">28K</div>
              <div className="text-sm text-gray-400">advisors on platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#5B47DB] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Viral AI Content</h3>
              <p className="text-gray-600">Generate stories, market updates, and client success posts that get 8.0+ engagement scores automatically.</p>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">WhatsApp Native</h3>
              <p className="text-gray-600">Optimized for WhatsApp delivery with perfect formatting, emojis, and mobile-first design.</p>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#50B5A9] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Effort</h3>
              <p className="text-gray-600">Daily content delivered automatically. Just review, approve, and share with your clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFB800] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="font-bold text-lg mb-2">Set Preferences</h3>
              <p className="text-sm text-gray-600">Configure your brand, tone, and client segments in 5 minutes.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">2</div>
              <h3 className="font-bold text-lg mb-2">AI Generates</h3>
              <p className="text-sm text-gray-600">14 AI agents create viral content with your branding and compliance.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47DB] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">3</div>
              <h3 className="font-bold text-lg mb-2">Review & Approve</h3>
              <p className="text-sm text-gray-600">Preview content daily and approve with one click before delivery.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#50B5A9] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">4</div>
              <h3 className="font-bold text-lg mb-2">Auto-Deliver</h3>
              <p className="text-sm text-gray-600">Content sends to WhatsApp automatically at your scheduled time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial & Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Testimonial */}
            <div className="lg:col-span-1">
              <div className="bg-[#2a3055] rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full mr-4"></div>
                  <div>
                    <div className="flex text-yellow-400 mb-1">★★★★★</div>
                    <div className="font-bold">Nitin Mehta</div>
                    <div className="text-xs text-gray-400">Financial Advisor</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  "The content is always timely and relevant. My clients love the updates, and it has saved me so much time!"
                </p>
                <p className="text-xs text-gray-400">Nitin Mehta<br/>Financial Advisor, Mumbai</p>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <div className="bg-white text-gray-900 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-2">Basic</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹2,500</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    AI-generated content
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    WhatsApp integration
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    Engagement analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    Priority support
                  </li>
                </ul>
                <button className="w-full border-2 border-gray-900 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-900 hover:text-white transition-all">
                  Learn more
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-[#5B47DB] text-white rounded-2xl p-8 border-4 border-white shadow-2xl">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹5,000</span>
                  <span className="text-gray-200">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    AI-generated content
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    WhatsApp integration
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Engagement analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Priority support
                  </li>
                </ul>
                <button className="w-full bg-white text-[#5B47DB] font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all">
                  Get Started
                </button>
              </div>

              {/* Agency Plan */}
              <div className="bg-white text-gray-900 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-2">Agency</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹10,000</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    AI-generated content
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    WhatsApp integration
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    Engagement analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    Priority support
                  </li>
                </ul>
                <button className="w-full border-2 border-gray-900 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-900 hover:text-white transition-all">
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1221] py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#FFB800] rounded-lg flex items-center justify-center">
                  <span className="text-[#1a1f3a] font-bold text-xl">J</span>
                </div>
                <span className="text-xl font-bold">JarvisDaily</span>
              </div>
              <p className="text-sm text-gray-400">
                Grammy-level viral content for financial advisors. Delivered daily to WhatsApp.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 JarvisDaily. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
