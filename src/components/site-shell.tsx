import { Link } from "@tanstack/react-router";
import { Signal } from "lucide-react";
import type { ReactNode } from "react";

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Signal className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Nimbus<span className="text-accent">.</span>eSIM
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground">Product</Link>
          <a href="#plans" className="hover:text-foreground">Plans</a>
          <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
        </nav>
        {cta && (
          <Link
            to="/onboarding"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            Start onboarding
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© 2026 Nimbus Telecom. eSIM SOHO POC.</p>
        <p>Prototype only — no real activations are performed.</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
