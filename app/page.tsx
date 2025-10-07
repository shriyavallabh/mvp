import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f3a] via-[#243057] to-[#1a1f3a] text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
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
                All powered content engine that gorto 8.0+ engagement scores. Trusted by 500+ Indian i4++ financial advisors.
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

            {/* Right Phone Mockup - Simplified */}
            <div className="flex justify-center">
              <div className="w-72 h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  <div className="h-12 bg-[#075E54] flex items-center px-4">
                    <span className="text-white text-xs">WhatsApp</span>
                  </div>
                  <div className="bg-[#E5DDD5] h-full p-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                      <p className="text-xs text-gray-700">Sample viral content message...</p>
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
              <span className="text-2xl font-bold">HDFC</span>
              <span className="text-2xl font-bold">AXIS</span>
              <span className="text-2xl font-bold">kotak</span>
              <span className="text-2xl font-bold">SBI</span>
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
              <p className="text-gray-600">Vierelize storries, that genst easy in social or menter.</p>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">WhatsApp Native</h3>
              <p className="text-gray-600">Optimizes or going content that apps to the network.</p>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#50B5A9] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Effort</h3>
              <p className="text-gray-600">Delivers cofficient content and engagestment easines.</p>
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
              <h3 className="font-bold text-lg mb-2">Add Preferences</h3>
              <p className="text-sm text-gray-600">Conducts whit payment options and cadulater.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">3</div>
              <h3 className="font-bold text-lg mb-2">AI Generates</h3>
              <p className="text-sm text-gray-600">Microcine line, logir and app sgnod integration.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47DB] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">3</div>
              <h3 className="font-bold text-lg mb-2">Review & Approve</h3>
              <p className="text-sm text-gray-600">Promdes bosument, and prortly aprortrise.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#50B5A9] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">4</div>
              <h3 className="font-bold text-lg mb-2">Auto-Deliver</h3>
              <p className="text-sm text-gray-600">Experive augmention 4 statent pointing.</p>
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
                    <div className="font-bold">Nith Nekia</div>
                    <div className="text-xs text-gray-400">Financial Advisor</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  "The content is always timely and relevant. My clients love the updates, and it has saved me so much time!"
                </p>
                <p className="text-xs text-gray-400">Nitin Mehita<br/>Finantual Notrass Murilbal</p>
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
                  <span className="text-gray-200">/moth</span>
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
                  <span className="text-gray-600">/moth</span>
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
    </div>
  )
}
