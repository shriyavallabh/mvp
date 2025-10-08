import SiteHeader from "@/components/site-header"
import Hero from "@/components/hero"
import DailyContentShowcase from "@/components/daily-content-showcase"
import FeaturesGrid from "@/components/features-grid"
import Testimonial from "@/components/testimonial"
import PricingCard from "@/components/pricing-card"
import SiteFooter from "@/components/site-footer"
import HowItWorks from "@/components/how-it-works"
import ExampleContent from "@/components/example-content"
import ROICalculator from "@/components/roi-calculator"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-black">
        <Hero />
        <DailyContentShowcase />
        <ExampleContent />
        <FeaturesGrid />
        <HowItWorks />
        <Testimonial />
        <ROICalculator />
        <PricingCard />
        <SiteFooter />
      </main>
    </>
  )
}
