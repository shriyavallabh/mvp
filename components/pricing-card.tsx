import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

type Plan = {
  name: string
  price: string
  period?: string
  original?: string
  badge?: string
  cta: string
  mostPopular?: boolean
  note?: string
  dailyContent?: string[]
  monthlyTotal?: string
  costPerAsset?: string
  features: string[]
  perfectFor?: string
}

const plans: Plan[] = [
  {
    name: "Solo",
    price: "₹1,799",
    period: "/month",
    badge: "For Individual Advisors",
    cta: "Start 14-Day Free Trial",
    note: "No credit card required",
    dailyContent: [
      "1 WhatsApp message/day (ready to send)",
      "Basic logo branding",
      "SEBI compliance built-in",
    ],
    monthlyTotal: "30 viral WhatsApp messages",
    costPerAsset: "₹60",
    features: [
      "Daily content generation",
      "WhatsApp-optimized format",
      "Review & approve before sending",
      "24/7 support",
    ],
    perfectFor: "Advisors with <100 clients",
  },
  {
    name: "Professional",
    price: "₹4,499",
    period: "/month",
    badge: "⭐ MOST POPULAR - Save 17%",
    cta: "Start 14-Day Free Trial",
    mostPopular: true,
    note: "No credit card required",
    dailyContent: [
      "1 LinkedIn post/day (ready to publish)",
      "1 WhatsApp message/day (ready to send)",
      "1 WhatsApp Status image/day (1080×1920 branded)",
      "Advanced logo + color branding",
      "SEBI compliance built-in",
    ],
    monthlyTotal: "90 total assets (3 per day)",
    costPerAsset: "₹50 (vs ₹60 on Solo)",
    features: [
      "Everything in Solo, PLUS:",
      "Multi-platform (LinkedIn + WhatsApp)",
      "Bulk content scheduling",
      "Engagement analytics",
      "Priority support",
      "Custom brand guidelines",
    ],
    perfectFor: "Advisors with 100-500 clients",
  },
  {
    name: "Enterprise",
    price: "Custom Pricing",
    badge: "For Advisory Firms",
    cta: "Contact Sales",
    dailyContent: [
      "Unlimited content generation",
      "Multi-advisor dashboard",
      "API access for automation",
      "White-label branding",
      "Dedicated account manager",
      "Custom compliance rules",
    ],
    features: [],
    perfectFor: "Firms with 500+ clients, multiple advisors",
  },
]

export default function PricingCard() {
  return (
    <section id="pricing" className="bg-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{"Choose Your Growth Plan"}</h2>
        <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
          {"All plans include Grammy-level AI content (9.0+ virality) & SEBI compliance"}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3" role="list" aria-label="Pricing plans">
          {plans.map((plan) => {
            const isPopular = plan.mostPopular
            return (
              <article
                key={plan.name}
                role="listitem"
                aria-label={`${plan.name} plan`}
                className={[
                  "relative rounded-2xl border p-6 backdrop-blur-lg transition",
                  "border-[var(--color-glass-border)] bg-[var(--color-glass)]",
                  "hover:bg-[var(--color-glass-hover)]",
                  isPopular ? "ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20" : "",
                ].join(" ")}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={[
                        "rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap",
                        isPopular
                          ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/50"
                          : "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/50",
                      ].join(" ")}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <header className="pt-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  {plan.original && (
                    <div className="mt-1 text-xs text-muted-foreground line-through">{plan.original}</div>
                  )}
                </header>

                {/* What You Get Daily section */}
                {plan.dailyContent && plan.dailyContent.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--color-brand-gold)]">
                      {plan.name === "Enterprise" ? "What You Get:" : "What You Get Daily:"}
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {plan.dailyContent.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-0.5 text-green-500">✅</span>
                          <span className="text-sm text-pretty">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monthly Total & Cost per Asset */}
                {plan.monthlyTotal && (
                  <div className="mt-4 rounded-lg bg-[var(--color-glass)] border border-[var(--color-glass-border)] p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Monthly Total:</p>
                    <p className="text-sm font-bold text-white">{plan.monthlyTotal}</p>
                    {plan.costPerAsset && (
                      <p className="mt-1 text-xs text-muted-foreground">Cost per asset: {plan.costPerAsset}</p>
                    )}
                  </div>
                )}

                {/* Features section */}
                {plan.features.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-muted-foreground">Features:</h4>
                    <ul className="mt-3 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5">•</span>
                          <span className="text-sm text-pretty">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Perfect for section */}
                {plan.perfectFor && (
                  <div className="mt-4 rounded-lg bg-[var(--color-glass-hover)] border border-[var(--color-glass-border)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-brand-gold)]">Perfect for:</p>
                    <p className="text-sm">{plan.perfectFor}</p>
                  </div>
                )}

                {/* Trial Clarity Badges */}
                {plan.name !== "Enterprise" && (
                  <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-green-500">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">14-Day Free Trial</span>
                      </div>
                      <div className="flex items-center text-green-500">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">No Credit Card Required</span>
                      </div>
                      <div className="flex items-center text-green-500">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">Cancel Anytime</span>
                      </div>
                    </div>
                  </div>
                )}

                {plan.name === "Enterprise" && (
                  <div className="mt-6 bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-[var(--color-brand-gold)]">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="font-semibold text-sm">Free Consultation</span>
                      </div>
                      <div className="flex items-center text-[var(--color-brand-gold)]">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">Custom Pricing</span>
                      </div>
                      <div className="flex items-center text-[var(--color-brand-gold)]">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">Flexible Contract</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    size="lg"
                    className={[
                      "w-full h-12 rounded-lg transition",
                      isPopular
                        ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-105"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    ].join(" ")}
                    aria-label={`${plan.cta} - ${plan.name}`}
                  >
                    {plan.cta}
                  </Button>
                  {plan.note && <p className="mt-3 text-center text-xs text-muted-foreground">{plan.note}</p>}
                  {plan.name !== "Enterprise" && (
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Full access to all features - no limitations during trial
                    </p>
                  )}
                  {plan.name === "Enterprise" && (
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Tailored solutions for firms with 500+ clients
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
