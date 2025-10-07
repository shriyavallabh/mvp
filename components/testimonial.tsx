"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

type TestimonialItem = {
  quote: string
  name: string
  title: string
  photo: string
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "My client engagement jumped 3x in 30 days. JarvisDaily's AI content is better than what I was paying ₹15K/month for. Now I spend 10 minutes daily instead of 3 hours.",
    name: "Nitin Mehta",
    title: "Financial Advisor, Mumbai · ₹4.2Cr Portfolio",
    photo: "/advisor-portrait.png",
  },
  {
    quote:
      "Weekly WhatsApp posts are consistently viral. I get inbound leads without running ads. Absolute game-changer for my practice.",
    name: "Aisha Verma",
    title: "Wealth Manager, Bengaluru",
    photo: "/placeholder-user.jpg",
  },
  {
    quote:
      "Clear ROI in under 2 weeks. Clients reply more, meetings increased, and pipeline looks the best it has in a year.",
    name: "Rahul Shah",
    title: "Investment Advisor, Pune",
    photo: "/placeholder-user.jpg",
  },
  {
    quote:
      "The tone is on-brand and compliance-friendly. I just review and approve. Delivery straight to WhatsApp saves me hours.",
    name: "Neha Kapoor",
    title: "RIA, Delhi",
    photo: "/placeholder-user.jpg",
  },
]

export default function Testimonial() {
  // autoplay carousel
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const total = TESTIMONIALS.length

  useEffect(() => {
    const start = () => {
      if (intervalRef.current) return
      intervalRef.current = window.setInterval(() => {
        setIndex((i) => (i + 1) % total)
      }, 6000)
    }
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    start()
    // pause when tab hidden
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [total])

  const goPrev = () => setIndex((i) => (i - 1 + total) % total)
  const goNext = () => setIndex((i) => (i + 1) % total)

  // derive initials for fallback
  const initials = useMemo(
    () =>
      TESTIMONIALS.map((t) =>
        t.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      ),
    [],
  )

  return (
    <section
      id="testimonials"
      className="bg-black"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
    >
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="relative overflow-hidden">
          {/* Slides */}
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="min-w-full"
                aria-roledescription="slide"
                aria-label={`Testimonial ${i + 1} of ${total}`}
              >
                <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-8 text-center backdrop-blur-lg md:p-12">
                  {/* Stars in gold */}
                  <div className="flex justify-center gap-1" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-5 w-5 text-[var(--color-brand-gold,#d4af37)] fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="mt-6 text-pretty text-xl italic leading-relaxed md:text-2xl">
                    {`"${t.quote}"`}
                  </blockquote>

                  {/* Person */}
                  <figcaption className="mt-8 flex items-center justify-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={t.photo || "/placeholder.svg"} alt={`${t.name} portrait`} />
                      <AvatarFallback>{initials[i]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">{t.title}</div>
                    </div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous testimonial"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[color-mix(in_oklab,var(--color-glass)_90%,transparent)] p-2 text-foreground/80 transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {TESTIMONIALS.map((_, i) => (
                <span
                  key={i}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-5 cursor-pointer rounded-full transition-colors ${
                    index === i ? "bg-[var(--color-brand-gold,#d4af37)]" : "bg-foreground/20"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next testimonial"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[color-mix(in_oklab,var(--color-glass)_90%,transparent)] p-2 text-foreground/80 transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
