import type React from "react"
import { Brain, Smartphone, Palette, CheckCircle } from "lucide-react"

type Feature = {
  title: string
  description: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const features: Feature[] = [
  {
    title: "Viral AI Content",
    description: "Our AI analyzes 100+ viral posts daily. Generates 9.0+ engagement content using proven formulas",
    Icon: Brain,
  },
  {
    title: "WhatsApp Native",
    description: "Direct delivery to WhatsApp. No app installs. Works on any phone.",
    Icon: Smartphone,
  },
  {
    title: "Brand Customization",
    description: "Your logo, colors, and tagline on every piece. 100% on-brand.",
    Icon: Palette,
  },
  {
    title: "SEBI Validated",
    description: "Regulatory compliance built-in. Zero legal risk for advisors.",
    Icon: CheckCircle,
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="group rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-6 backdrop-blur-lg transition hover:bg-[var(--color-glass-hover)]"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-glass)] border border-[var(--color-glass-border)]">
                  <Icon className="h-5 w-5 text-[var(--color-brand-purple)]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
