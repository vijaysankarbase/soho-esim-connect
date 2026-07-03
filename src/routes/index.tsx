import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { PLANS } from "@/lib/onboarding-store";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Small office · Home office · eSIM
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Give your whole team a mobile line{" "}
              <span className="bg-gradient-to-r from-accent to-signal bg-clip-text text-transparent">
                before lunch.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance">
              Nimbus eSIM SOHO onboards small businesses in under 10 minutes. Register
              your company, pick a plan, invite your team — they activate with a QR code.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/onboarding"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lift transition hover:opacity-90"
              >
                Start free onboarding
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                See the admin dashboard
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-8 text-sm">
              {[
                ["10 min", "avg. onboarding"],
                ["60+", "countries roaming"],
                ["0", "plastic SIM cards"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-semibold">{k}</dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero device mock */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-accent/20 via-transparent to-signal/20 blur-2xl" />
            <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Nimbus eSIM
                  </p>
                  <p className="font-display text-lg font-semibold">Team plan · 50 GB</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-1 text-xs font-medium text-success-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
              <div className="mt-6 grid aspect-square place-items-center rounded-2xl bg-primary p-6 text-primary-foreground">
                <QrCode className="h-40 w-40" strokeWidth={1.2} />
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Line</p>
                  <p className="font-medium">+49 151 ••• 4021</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Data used</p>
                  <p className="font-medium">3.2 / 50 GB</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[6%] rounded-full bg-gradient-to-r from-accent to-signal" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              From company signup to first call in four steps.
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Register the business",
                desc: "Company name, tax ID and an admin contact. That's it.",
              },
              {
                icon: Zap,
                title: "Pick a plan",
                desc: "Starter, Team or Unlimited — with EU or global roaming.",
              },
              {
                icon: Users,
                title: "Invite the team",
                desc: "Add lines for each employee. They get an email in seconds.",
              },
              {
                icon: QrCode,
                title: "Scan & activate",
                desc: "Employees scan a QR code on their phone. Line is live.",
              },
            ].map((s, i) => (
              <li
                key={s.title}
                className="relative rounded-2xl border border-border bg-background p-6"
              >
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 font-mono text-xs text-primary-foreground">
                  0{i + 1}
                </span>
                <s.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-widest text-accent">
                Plans
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                Transparent per-line pricing.
              </h2>
              <p className="mt-3 text-muted-foreground">
                All plans include EU roaming, 5G access, and a single invoice for the
                whole company. Cancel or change any month.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Prices in EUR, VAT excluded.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition ${
                  p.highlight
                    ? "border-primary bg-primary text-primary-foreground shadow-lift"
                    : "border-border bg-card"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p
                  className={`text-sm ${
                    p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {p.data} of high-speed data
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold">€{p.price}</span>
                  <span
                    className={
                      p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"
                    }
                  >
                    /line/mo
                  </span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          p.highlight ? "text-accent" : "text-accent"
                        }`}
                      />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onboarding"
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition ${
                    p.highlight
                      ? "bg-accent text-accent-foreground hover:opacity-90"
                      : "border border-border bg-background hover:bg-secondary"
                  }`}
                >
                  Choose {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "GDPR-first",
              desc: "EU-hosted infrastructure. KYB verified admins. Auditable line history.",
            },
            {
              icon: Globe,
              title: "Works in 60+ countries",
              desc: "Automatic network selection across partner carriers, no reconfiguration.",
            },
            {
              icon: Zap,
              title: "Provision by API",
              desc: "Bulk-invite lines from your HR tool via a single REST endpoint.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
            Ready to onboard your office?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Try the full flow — register a business, pick a plan, invite lines, and see
            QR activation. No credit card required.
          </p>
          <Link
            to="/onboarding"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lift transition hover:opacity-90"
          >
            Launch onboarding
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
