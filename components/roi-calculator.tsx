'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ROICalculator() {
  const [writerCost, setWriterCost] = useState<number>(0);
  const [toolsCost, setToolsCost] = useState<number>(0);
  const [timeHours, setTimeHours] = useState<number>(0);

  const hourlyRate = 500; // ₹500/hour for advisor's time
  const timeCostMonthly = timeHours * 4 * hourlyRate; // 4 weeks per month
  const totalCurrent = writerCost + toolsCost + timeCostMonthly;
  const jarvisCost = 4499;
  const savings = totalCurrent - jarvisCost;
  const savingsPercent = totalCurrent > 0 ? Math.round((savings / totalCurrent) * 100) : 0;

  const useExample = () => {
    setWriterCost(15000);
    setToolsCost(2000);
    setTimeHours(15);
  };

  return (
    <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
            How Much Does Content Creation Cost You Today?
          </h2>
          <p className="text-xl" style={{ color: '#64748B' }}>
            Most advisors are surprised when they calculate their actual content costs
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* LEFT: Calculator Form */}
          <div
            className="p-8 rounded-2xl border"
            style={{
              background: '#1A1A1A',
              borderColor: '#D4AF37',
              borderWidth: '2px'
            }}
          >
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#FFFFFF' }}>
              Your Current Costs
            </h3>

            {/* Content Writer Salary */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Content writer salary (monthly):
              </label>
              <div className="flex items-center">
                <span style={{ color: '#D4AF37', marginRight: '8px' }}>₹</span>
                <input
                  type="number"
                  value={writerCost || ''}
                  onChange={(e) => setWriterCost(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-4 py-3 rounded-lg"
                  style={{
                    background: '#0A0A0A',
                    border: '1px solid #333',
                    color: '#FFFFFF'
                  }}
                />
                <span style={{ color: '#64748B', marginLeft: '8px' }}>/month</span>
              </div>
            </div>

            {/* Design Tools */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Design tool subscriptions (Canva, etc):
              </label>
              <div className="flex items-center">
                <span style={{ color: '#D4AF37', marginRight: '8px' }}>₹</span>
                <input
                  type="number"
                  value={toolsCost || ''}
                  onChange={(e) => setToolsCost(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-4 py-3 rounded-lg"
                  style={{
                    background: '#0A0A0A',
                    border: '1px solid #333',
                    color: '#FFFFFF'
                  }}
                />
                <span style={{ color: '#64748B', marginLeft: '8px' }}>/month</span>
              </div>
            </div>

            {/* Time Spent */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Your time creating content (hours/week):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeHours || ''}
                  onChange={(e) => setTimeHours(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-4 py-3 rounded-lg"
                  style={{
                    background: '#0A0A0A',
                    border: '1px solid #333',
                    color: '#FFFFFF'
                  }}
                />
                <span style={{ color: '#64748B' }}>hours × ₹{hourlyRate}/hour = </span>
                <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  ₹{timeCostMonthly.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t mb-6" style={{ borderColor: '#333' }}></div>

            {/* Results */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>Total Current Cost:</span>
                <span style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 'bold' }}>
                  ₹{totalCurrent.toLocaleString()} /month
                </span>
              </div>

              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>JarvisDaily Professional:</span>
                <span style={{ color: '#64748B' }}>₹{jarvisCost.toLocaleString()} /month</span>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: '#10B981', fontWeight: '600', fontSize: '18px' }}>
                    💰 You Save:
                  </span>
                  <span style={{ color: '#10B981', fontSize: '28px', fontWeight: 'bold' }}>
                    ₹{Math.max(0, savings).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: '#10B981' }}>Cost Reduction:</span>
                  <span style={{ color: '#10B981', fontSize: '20px', fontWeight: 'bold' }}>
                    {savingsPercent > 0 ? savingsPercent : 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2 rounded-full" style={{ background: '#0A0A0A' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: '#10B981',
                      width: `${Math.min(savingsPercent, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Pre-Filled Example */}
          <div
            className="p-8 rounded-2xl"
            style={{ background: '#1A1A1A' }}
          >
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#FFFFFF' }}>
              📊 Typical Financial Advisor
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between pb-3 border-b" style={{ borderColor: '#333' }}>
                <span style={{ color: '#64748B' }}>Content writer:</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>₹15,000</span>
              </div>

              <div className="flex justify-between pb-3 border-b" style={{ borderColor: '#333' }}>
                <span style={{ color: '#64748B' }}>Design tools:</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>₹2,000</span>
              </div>

              <div className="flex justify-between pb-3 border-b" style={{ borderColor: '#333' }}>
                <span style={{ color: '#64748B' }}>Your time (15h/week):</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>₹30,000</span>
              </div>

              <div className="flex justify-between pt-2">
                <span style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '18px' }}>Total:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '20px' }}>
                  ₹47,000/month
                </span>
              </div>

              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>JarvisDaily:</span>
                <span style={{ color: '#64748B' }}>₹4,499/month</span>
              </div>

              <div
                className="p-4 rounded-lg mt-4"
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid #D4AF37'
                }}
              >
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#D4AF37', fontWeight: '600' }}>Savings:</span>
                  <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '24px' }}>
                    ₹42,501
                  </span>
                </div>
                <div style={{ color: '#D4AF37', fontSize: '14px' }}>
                  (90% cost reduction)
                </div>
              </div>
            </div>

            <Button
              onClick={useExample}
              className="w-full h-12 rounded-lg font-semibold text-lg transition-all hover:scale-105"
              style={{
                background: '#D4AF37',
                color: '#0A0A0A'
              }}
            >
              Use This Example →
            </Button>

            <p className="text-sm text-center mt-4" style={{ color: '#64748B' }}>
              These are conservative estimates. Most advisors save even more.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg mb-4" style={{ color: '#64748B' }}>
            See the savings for yourself with a 14-day free trial
          </p>
          <a
            href="#pricing"
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
            style={{
              background: '#D4AF37',
              color: '#0A0A0A'
            }}
          >
            Start Saving Today →
          </a>
        </div>
      </div>
    </section>
  );
}
