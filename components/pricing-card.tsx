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
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹1,799",
    period: "/month",
    original: "₹2,999",
    badge: "Save ₹1,200/month",
    cta: "Start 14-Day Free Trial",
    note: "No credit card required",
    features: [
      "Daily AI-crafted content",
      "One-click WhatsApp delivery",
      "Brand customization",
      "SEBI compliance checks",
      "Standard support",
    ],
  },
  {
    name: "Professional",
    price: "₹4,499",
    period: "/month",
    badge: "Most Popular",
    cta: "Start 14-Day Free Trial",
    mostPopular: true,
    note: "Cancel anytime",
    features: [
      "Everything in Starter",
      "Bulk scheduling",
      "Advanced analytics & insights",
      "Priority support",
      "Team seats (up to 3)",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cta: "Contact Sales",
    note: "Privacy-first, NDA available",
    features: [
      "Dedicated success manager",
      "Custom workflows & integrations",
      "SLA & priority escalation",
      "Unlimited team seats",
      "Security reviews & SSO",
    ],
  },
]

export default function PricingCard() {
  return (
    <section id="pricing" className="bg-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{"Choose Your Growth Plan"}</h2>
        <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
          {"All plans include Grammy-level AI content & WhatsApp delivery"}
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

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass)]">
                        <Check className="h-3.5 w-3.5 text-[var(--color-brand-purple)]" aria-hidden="true" />
                      </span>
                      <span className="text-sm text-pretty">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
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
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
