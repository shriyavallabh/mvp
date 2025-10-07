export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-glass-border)] bg-[var(--color-true-black)]">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">{"Product"}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a className="transition hover:text-foreground" href="#features">
                  {"Features"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#pricing">
                  {"Pricing"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#how-it-works">
                  {"How It Works"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#api">
                  {"API Docs"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{"Company"}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a className="transition hover:text-foreground" href="#about">
                  {"About Us"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#careers">
                  {"Careers"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#blog">
                  {"Blog"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#contact">
                  {"Contact"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{"Legal"}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a className="transition hover:text-foreground" href="#privacy">
                  {"Privacy Policy"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#terms">
                  {"Terms of Service"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#sebi">
                  {"SEBI Compliance"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#refund">
                  {"Refund Policy"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{"Connect"}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a className="transition hover:text-foreground" href="#" aria-label="Twitter">
                  {"Twitter"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#" aria-label="LinkedIn">
                  {"LinkedIn"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#" aria-label="Instagram">
                  {"Instagram"}
                </a>
              </li>
              <li>
                <a className="transition hover:text-foreground" href="#" aria-label="WhatsApp">
                  {"WhatsApp"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--color-glass-border)] pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-brand-purple)] to-[var(--color-brand-pink)]"
              aria-hidden="true"
            />
            <span className="font-semibold">{"JarvisDaily"}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {"© "}
            {new Date().getFullYear()}
            {" JarvisDaily. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
