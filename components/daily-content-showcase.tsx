export default function DailyContentShowcase() {
  return (
    <section className="bg-gradient-to-b from-black via-black to-[#0A0A0A] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section Header */}
        <h2 className="text-center text-3xl font-bold md:text-4xl lg:text-5xl">
          What You Get Every Morning at{" "}
          <span className="text-[var(--color-brand-gold)]">6 AM</span>
        </h2>

        {/* 3 Column Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Column 1: LinkedIn Post */}
          <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[#1A1A1A] p-6 backdrop-blur-lg">
            {/* Icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A66C2]">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">LinkedIn Post</h3>
                <p className="text-sm text-muted-foreground">
                  Professional content that builds your credibility
                </p>
              </div>
            </div>

            {/* Example Mockup */}
            <div className="mt-6 rounded-lg border border-gray-700 bg-[#0D0D0D] p-4 font-mono text-sm">
              <p className="mb-2">📊 SIP returns hit 15.2% this quarter.</p>
              <p className="mb-3 text-gray-300">
                Here's why systematic investing beats lump-sum for most investors:
              </p>
              <ul className="mb-3 space-y-1 text-gray-400">
                <li>• Rupee cost averaging</li>
                <li>• Discipline over timing</li>
                <li>• 15.2% CAGR (5 years)</li>
              </ul>
              <p className="mb-2 text-gray-300">DM to review your SIP.</p>
              <p className="text-xs text-[#0A66C2]">#MutualFunds #SIP</p>
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Ready to publish
            </div>
          </div>

          {/* Column 2: WhatsApp Message */}
          <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[#1A1A1A] p-6 backdrop-blur-lg">
            {/* Icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#25D366]">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">WhatsApp Message</h3>
                <p className="text-sm text-muted-foreground">
                  Personal update that drives client responses
                </p>
              </div>
            </div>

            {/* WhatsApp-style Bubble */}
            <div className="mt-6">
              <div className="relative rounded-lg bg-[#005C4B] p-4 text-sm text-white">
                {/* WhatsApp bubble tail */}
                <div className="absolute right-0 top-0 -mr-2 h-0 w-0 border-b-[20px] border-l-[20px] border-b-transparent border-l-[#005C4B]"></div>

                <p className="mb-2">🔥 Quick market update:</p>
                <p className="mb-2">SIP returns just hit 15.2% this quarter!</p>
                <p className="mb-2">This is why I recommend systematic investing.</p>
                <p className="font-semibold">
                  Want to discuss your portfolio? Reply "YES"
                </p>

                {/* WhatsApp timestamp */}
                <p className="mt-2 text-right text-xs text-gray-300">6:00 AM</p>
              </div>
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Ready to send
            </div>
          </div>

          {/* Column 3: WhatsApp Status */}
          <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[#1A1A1A] p-6 backdrop-blur-lg">
            {/* Icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">WhatsApp Status Image</h3>
                <p className="text-sm text-muted-foreground">
                  Branded visual that keeps you top-of-mind
                </p>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="mt-6 flex justify-center">
              <div className="relative w-48 overflow-hidden rounded-3xl border-4 border-gray-800 bg-gradient-to-br from-black via-gray-900 to-[#0A0A0A]">
                {/* Phone screen with 9:16 aspect ratio */}
                <div className="aspect-[9/16] bg-gradient-to-br from-[#D4AF37] via-gray-900 to-black p-6">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 text-4xl">📈</div>
                    <p className="mb-2 text-2xl font-bold text-white">SIP Returns:</p>
                    <p className="mb-4 text-5xl font-extrabold text-[#D4AF37]">15.2%</p>
                    <p className="text-sm text-gray-300">Q4 2025</p>

                    {/* Logo placeholder */}
                    <div className="mt-auto rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-white">[Your Logo]</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-400"></span>
              1080×1920 branded
            </div>
          </div>
        </div>

        {/* Plan Subtext */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground md:text-base">
            <span className="font-semibold text-white">Solo plan:</span> WhatsApp message only
            (₹1,799) •{" "}
            <span className="font-semibold text-[var(--color-brand-gold)]">Professional plan:</span>{" "}
            All 3 assets daily (₹4,499) •{" "}
            <span className="font-semibold text-white">Enterprise:</span> Custom unlimited (Contact
            us)
          </p>
        </div>
      </div>
    </section>
  )
}
