import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Hero() {
  return (
    <header className="relative min-h-screen overflow-hidden">
      {/* Background images */}
      <Image
        src="/hero-mobile.jpg"
        alt=""
        fill
        priority
        quality={90}
        className="block md:hidden object-cover object-center opacity-60"
        aria-hidden="true"
      />
      <Image
        src="/hero-desktop.jpg"
        alt=""
        fill
        priority
        quality={90}
        className="hidden md:block object-cover object-center opacity-60"
        aria-hidden="true"
      />
      {/* Readability overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"
        aria-hidden="true"
      />
      {/* Center content vertically and horizontally, keep tighter line-heights */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl w-full items-center justify-center md:justify-start px-4 py-20 md:px-8 md:py-32">
        <div className="text-center md:text-left">
          {/* Badge at top, unchanged copy */}
          <div className="mx-auto md:mx-0 mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm text-white backdrop-blur-md">
            {"🚀 AI-powered viral content in 2.3 seconds"}
          </div>

          {/* Updated headline focused on time savings */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-normal md:tracking-tight md:text-left max-w-5xl"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            {"Save 15 Hours/Week"} <br className="hidden md:block" />
            <span className="text-white">{"Creating Viral Content"}</span>
          </h1>

          {/* H2 showing all content types */}
          <h2
            className="mt-4 text-2xl md:text-3xl lg:text-4xl font-semibold leading-[1.2] tracking-normal md:text-left max-w-4xl"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            <span className="text-hero-gold">{"Grammy-Level"}</span>{" "}
            {"LinkedIn Posts + WhatsApp Messages + Status Images"}
          </h2>

          {/* Updated subheadline with clearer value proposition */}
          <p className="mt-6 mx-auto md:mx-0 max-w-3xl text-pretty text-xl md:text-2xl leading-[1.45] text-gray-300 md:text-left">
            {
              "While competitors think, you deliver. AI generates 9.0+ virality content* for LinkedIn and WhatsApp with 98% engagement. Your clients see professional content. You save time."
            }
          </p>

          {/* Virality score explanation footnote */}
          <p className="mt-3 mx-auto md:mx-0 max-w-3xl text-sm text-gray-400 md:text-left">
            {"*Virality Score 0-10: We guarantee 9.0+ (top-tier viral content) or regenerate free"}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center md:items-start md:justify-start gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full sm:w-auto rounded-2xl px-10 text-black font-bold text-lg bg-gradient-to-r from-[var(--color-brand-gold)] to-[var(--color-brand-gold-bright)] hover:shadow-2xl hover:shadow-[rgba(212,175,55,0.5)] hover:scale-105 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-gold)]"
            >
              {"Start Free Trial \u2606"}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 w-full sm:w-auto rounded-2xl px-10 text-white font-medium text-lg border-2 border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-gold)]"
            >
              {"Watch Demo"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
