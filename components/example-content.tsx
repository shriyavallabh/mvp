'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function ExampleContent() {
  return (
    <section className="bg-gradient-to-b from-[#0A0A0A] via-black to-[#0A0A0A] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See <span className="text-[var(--color-brand-gold)]">Grammy-Level Content</span> in Action
          </h2>
          <p className="text-xl text-gray-400">
            Real examples used by 127+ financial advisors
          </p>
        </div>

        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black border border-[var(--color-glass-border)] mb-8">
            <TabsTrigger
              value="linkedin"
              className="data-[state=active]:bg-[var(--color-brand-gold)] data-[state=active]:text-black"
            >
              LinkedIn Posts
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="data-[state=active]:bg-[var(--color-brand-gold)] data-[state=active]:text-black"
            >
              WhatsApp Messages
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="data-[state=active]:bg-[var(--color-brand-gold)] data-[state=active]:text-black"
            >
              Status Images
            </TabsTrigger>
          </TabsList>

          {/* LinkedIn Tab */}
          <TabsContent value="linkedin" className="space-y-6">
            {/* Example 1 */}
            <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-white">Rajesh Kumar</div>
                  <div className="text-sm text-gray-400">Financial Advisor • 14.2k followers</div>
                </div>
              </div>

              <p className="text-white mb-4 leading-relaxed">
                📊 Why are smart investors moving to Index Funds in 2025?
                <br /><br />
                Three data points that changed my mind:
                <br /><br />
                1. 87% of actively managed funds underperform the index over 10 years
                <br />
                2. Index funds charge 0.1% vs 2% TER
                <br />
                3. Warren Buffett&apos;s $1M bet winner
                <br /><br />
                The math is simple: Lower fees = Higher returns compounded over decades.
                <br /><br />
                Want to review your portfolio mix? DM me for a free 15-minute consultation.
                <br /><br />
                #IndexFunds #SmartInvesting #MutualFunds
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>👍 342</span>
                <span>💬 28</span>
                <span>🔄 16</span>
              </div>

              <div className="mt-4 inline-block bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 rounded-full px-4 py-1">
                <span className="text-[var(--color-brand-gold)] text-sm font-semibold">9.2/10 Virality • 342 likes in 6 hours</span>
              </div>
            </div>

            {/* Example 2 */}
            <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-white">Priya Sharma</div>
                  <div className="text-sm text-gray-400">Certified Financial Planner • 8.5k followers</div>
                </div>
              </div>

              <p className="text-white mb-4 leading-relaxed">
                🎯 My client saved ₹4.2 lakhs in taxes this year.
                <br /><br />
                Not with fancy schemes. Just smart 80C planning.
                <br /><br />
                Here&apos;s the breakdown:
                <br />
                • ELSS: ₹1.5L (saves ₹46,800 in taxes)
                <br />
                • PPF: ₹1.5L (saves ₹46,800 in taxes)
                <br />
                • NPS: ₹50K (saves ₹15,600 in taxes)
                <br /><br />
                Total investment: ₹3.5L
                <br />
                Tax saved: ₹1.09L (at 31.2% bracket)
                <br />
                Returns over 10 years: Projected ₹7.8L
                <br /><br />
                The compound effect of tax-saving + growth is underrated.
                <br /><br />
                #TaxPlanning #WealthCreation
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>👍 428</span>
                <span>💬 35</span>
                <span>🔄 22</span>
              </div>

              <div className="mt-4 inline-block bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 rounded-full px-4 py-1">
                <span className="text-[var(--color-brand-gold)] text-sm font-semibold">9.4/10 Virality • 428 likes in 4 hours</span>
              </div>
            </div>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            {/* Example 1 */}
            <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none p-4 max-w-md text-gray-900">
                <p className="leading-relaxed">
                  🔥 Quick market update:
                  <br /><br />
                  SIP returns just hit 15.2% this quarter!
                  <br /><br />
                  This is why I recommend systematic investing.
                  <br /><br />
                  Want to discuss your portfolio? Reply &quot;YES&quot;
                </p>
                <div className="text-xs text-gray-600 text-right mt-2">10:32 AM</div>
              </div>

              <div className="mt-4 text-gray-400 text-sm">
                Stats: <span className="text-[var(--color-brand-gold)]">87% open rate • 34% response rate</span>
              </div>
            </div>

            {/* Example 2 */}
            <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none p-4 max-w-md text-gray-900">
                <p className="leading-relaxed">
                  📊 Breaking: SEBI just announced new NPS tax benefits!
                  <br /><br />
                  What this means for you:
                  <br />
                  ✅ Additional ₹50K tax deduction
                  <br />
                  ✅ On top of existing 80C limit
                  <br />
                  ✅ Effective from FY 2024-25
                  <br /><br />
                  I&apos;m reviewing all my clients&apos; tax strategies this week.
                  <br /><br />
                  Want me to check if this benefits you? Reply &quot;TAX&quot; and I&apos;ll call today 📞
                </p>
                <div className="text-xs text-gray-600 text-right mt-2">6:15 AM</div>
              </div>

              <div className="mt-4 text-gray-400 text-sm">
                Stats: <span className="text-[var(--color-brand-gold)]">92% open rate • 41% response rate</span>
              </div>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Example 1 */}
              <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
                <div className="aspect-[9/16] bg-gradient-to-br from-black to-[#1A1A1A] rounded-lg flex flex-col items-center justify-center p-6">
                  <div className="text-[var(--color-brand-gold)] text-4xl font-bold mb-4">MARKET UPDATE</div>
                  <div className="text-white text-2xl mb-2">Nifty 50:</div>
                  <div className="text-green-500 text-3xl font-bold mb-1">↑ 23,450</div>
                  <div className="text-green-500 text-xl mb-6">+2.3%</div>
                  <div className="mt-auto text-gray-400 text-sm">[Your Logo]</div>
                </div>
                <div className="mt-4 text-gray-400 text-sm text-center">
                  <span className="text-[var(--color-brand-gold)]">1,245 views in 24 hours</span>
                </div>
              </div>

              {/* Status Example 2 */}
              <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
                <div className="aspect-[9/16] bg-gradient-to-br from-[#0A0A0A] to-[#2A2A1A] rounded-lg flex flex-col items-center justify-center p-6">
                  <div className="text-[var(--color-brand-gold)] text-3xl font-bold mb-4">SIP POWER</div>
                  <div className="text-white text-xl mb-6">15 years of ₹5,000/month</div>
                  <div className="text-[var(--color-brand-gold)] text-4xl font-bold mb-2">₹25.8L</div>
                  <div className="text-gray-400 text-sm mb-6">Final Corpus</div>
                  <div className="text-white text-sm">Invested: ₹9L</div>
                  <div className="text-green-500 text-sm">Returns: ₹16.8L</div>
                  <div className="mt-auto text-gray-400 text-sm">[Your Logo]</div>
                </div>
                <div className="mt-4 text-gray-400 text-sm text-center">
                  <span className="text-[var(--color-brand-gold)]">892 views in 18 hours</span>
                </div>
              </div>

              {/* Status Example 3 */}
              <div className="bg-black border border-[var(--color-glass-border)] rounded-lg p-6">
                <div className="aspect-[9/16] bg-gradient-to-br from-[#1A0A0A] to-[#0A1A1A] rounded-lg flex flex-col items-center justify-center p-6">
                  <div className="text-[var(--color-brand-gold)] text-2xl font-bold mb-4">📈 QUICK TIP</div>
                  <div className="text-white text-lg text-center mb-6">
                    &quot;The stock market is a device for transferring money from the impatient to the patient.&quot;
                  </div>
                  <div className="text-gray-400 text-sm mb-6">— Warren Buffett</div>
                  <div className="mt-auto text-gray-400 text-sm">[Your Logo]</div>
                </div>
                <div className="mt-4 text-gray-400 text-sm text-center">
                  <span className="text-[var(--color-brand-gold)]">1,567 views in 20 hours</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-[var(--color-brand-gold)]/10 to-transparent border border-[var(--color-brand-gold)]/30 rounded-lg p-8">
          <p className="text-xl text-white mb-4">
            Want content like this delivered daily at 6 AM?
          </p>
          <Button
            size="lg"
            className="bg-[var(--color-brand-gold)] text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[var(--color-brand-gold)]/90 transition-colors"
          >
            Start 14-Day Free Trial
          </Button>
          <p className="text-sm text-gray-400 mt-3">No credit card required</p>
        </div>
      </div>
    </section>
  );
}
