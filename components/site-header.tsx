"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

export default function SiteHeader() {
  const [atTop, setAtTop] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 0)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        mobileMenuOpen
          ? "bg-black"
          : atTop ? "bg-transparent backdrop-blur-0" : "bg-background/80 backdrop-blur",
      )}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link href="/" className="text-xl font-semibold text-[var(--color-brand-gold)]">
          {"JarvisDaily"}
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
            {"Features"}
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">
            {"Pricing"}
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
            {"How It Works"}
          </Link>
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className={cn(
                "h-9 rounded-xl ring-1 transition",
                atTop
                  ? "bg-transparent ring-white/15 hover:bg-white/10"
                  : "bg-[var(--color-glass)] ring-[var(--color-brand-gold-20,rgba(212,175,55,0.2))] hover:bg-[var(--color-glass-hover)]",
              )}
            >
              {"Sign In"}
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:text-[var(--color-brand-gold)] transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay - prevents interaction with page content */}
          <div
            className="md:hidden fixed inset-0 top-0 z-40 bg-black/80"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu content - completely opaque with solid background */}
          <div className="md:hidden fixed inset-0 top-[72px] z-50 bg-black border-t border-[var(--color-brand-gold)]/20">
            <nav className="h-full bg-black px-8 py-8 flex flex-col">
              {/* Navigation Links - Top Section */}
              <div className="flex-1 flex flex-col items-center justify-start gap-6 pt-8">
                <Link
                  href="#features"
                  onClick={closeMenu}
                  className="text-xl font-medium text-white hover:text-[var(--color-brand-gold)] transition-colors duration-200 py-3 px-6 hover:bg-white/5 rounded-lg w-full text-center"
                >
                  {"Features"}
                </Link>
                <Link
                  href="#pricing"
                  onClick={closeMenu}
                  className="text-xl font-medium text-white hover:text-[var(--color-brand-gold)] transition-colors duration-200 py-3 px-6 hover:bg-white/5 rounded-lg w-full text-center"
                >
                  {"Pricing"}
                </Link>
                <Link
                  href="#how-it-works"
                  onClick={closeMenu}
                  className="text-xl font-medium text-white hover:text-[var(--color-brand-gold)] transition-colors duration-200 py-3 px-6 hover:bg-white/5 rounded-lg w-full text-center"
                >
                  {"How It Works"}
                </Link>
              </div>

              {/* Sign In Button - Fixed at Bottom */}
              <div className="w-full pb-8">
                <Link href="/sign-in" onClick={closeMenu}>
                  <Button
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black text-lg font-bold hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 transition-all duration-300"
                  >
                    {"Sign In"}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
      <div
        className={cn(
          "h-px w-full transition-opacity duration-300",
          atTop ? "opacity-0" : "opacity-100 bg-[var(--color-brand-gold-20,rgba(212,175,55,0.2))]",
        )}
        aria-hidden="true"
      />
    </div>
  )
}
