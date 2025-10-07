"use client"

import { useEffect, useRef, useState } from "react"

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  const steps = [
    {
      n: 1,
      title: "Set Preferences",
      desc: "Tell us your niche, client type, and content style. Takes 2 minutes.",
    },
    {
      n: 2,
      title: "AI Generates",
      desc: "Our 14-agent system creates Grammy-level content in seconds.",
    },
    {
      n: 3,
      title: "Review & Approve",
      desc: "Preview on WhatsApp. Make edits if needed. One-click approve.",
    },
    {
      n: 4,
      title: "Auto-Deliver",
      desc: "Content lands in your WhatsApp. Copy, customize, send to clients.",
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const section = sectionRef.current
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Calculate scroll progress (0 to 1)
      // Animation completes at 50% scroll through section (2x speed)
      const startOffset = windowHeight * 0.7  // Start earlier
      const endOffset = windowHeight * 0.2     // End at midpoint

      const scrollStart = rect.top - startOffset
      const scrollEnd = rect.top - endOffset
      const scrollRange = scrollStart - scrollEnd

      let progress = (scrollStart / scrollRange) * 2  // 2x speed = complete at 50%
      progress = Math.max(0, Math.min(1, progress))

      setScrollProgress(progress)
    }

    handleScroll() // Initial call
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate line height based on scroll progress
  const getLineHeight = (stepIndex: number) => {
    const segmentProgress = scrollProgress * (steps.length - 1)

    if (segmentProgress >= stepIndex) {
      // This segment is complete
      return "100%"
    } else if (segmentProgress >= stepIndex - 1) {
      // This segment is in progress
      const segmentCompletion = (segmentProgress - (stepIndex - 1)) * 100
      return `${segmentCompletion}%`
    } else {
      // This segment hasn't started
      return "0%"
    }
  }

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-black">
      <div className="mx-auto max-w-6xl px-8 py-20 md:py-28">
        <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-5xl">
          {"From Zero to Viral in 4 Steps"}
        </h2>

        {/* Desktop Layout - Horizontal */}
        <div className="mt-12 hidden md:grid md:grid-cols-4 md:gap-10 md:mt-16 relative">
          {steps.map((s, idx) => (
            <div key={s.n} className="text-center relative">
              {/* Circle */}
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[var(--color-brand-purple)] to-[var(--color-brand-pink)] shadow-[0_0_40px_rgba(139,92,246,0.35)] ring-1 ring-[var(--color-glass-border)] flex items-center justify-center relative z-10">
                <span className="text-xl font-bold text-white">{s.n}</span>
              </div>

              {/* Connection Line (Desktop - Horizontal) - animates on scroll */}
              {idx < steps.length - 1 && (
                <div className="absolute top-8 left-1/2 h-1 bg-white/10 overflow-hidden z-0" style={{ width: 'calc(100% + 2.5rem)' }}>
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 shadow-[0_0_12px_rgba(255,215,0,0.9)] transition-all duration-700 ease-out origin-left"
                    style={{
                      width: getLineHeight(idx + 1),
                      transformOrigin: 'left center'
                    }}
                  />
                </div>
              )}

              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile Layout - Vertical with left-aligned circles, right-aligned text */}
        <div className="mt-12 md:hidden space-y-8">
          {steps.map((s, idx) => (
            <div key={s.n} className="relative flex items-start gap-6">
              {/* Left side: Circle with connecting line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--color-brand-purple)] to-[var(--color-brand-pink)] shadow-[0_0_40px_rgba(139,92,246,0.35)] ring-1 ring-[var(--color-glass-border)] flex items-center justify-center relative z-10">
                  <span className="text-xl font-bold text-white">{s.n}</span>
                </div>

                {/* Vertical Connection Line (Mobile) - connects edge to edge */}
                {idx < steps.length - 1 && (
                  <div className="w-1 h-28 bg-white/10 overflow-hidden relative -my-2">
                    <div
                      className="w-full bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-600 shadow-[0_0_12px_rgba(255,215,0,0.9)] transition-all duration-700 ease-out absolute top-0"
                      style={{ height: getLineHeight(idx + 1) }}
                    />
                  </div>
                )}
              </div>

              {/* Right side: Text content */}
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
