import SiteHeader from "@/components/site-header"
import Hero from "@/components/hero"
import FeaturesGrid from "@/components/features-grid"
import Testimonial from "@/components/testimonial"
import PricingCard from "@/components/pricing-card"
import SiteFooter from "@/components/site-footer"
import HowItWorks from "@/components/how-it-works"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-black">
        <Hero />
        <FeaturesGrid />
        <HowItWorks />
        <Testimonial />
        <PricingCard />
        <SiteFooter />
      </main>
    </>
  )
}
