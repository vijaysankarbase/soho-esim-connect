import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  Plus,
  Search,
  Signal,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { onboarding, PLANS, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin dashboard · Nimbus eSIM" },
      {
        name: "description",
        content: "Manage business eSIM lines, employees, plans and usage in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const state = useOnboarding();
  const { team, business, selectedPlanId } = state;
  const plan = PLANS.find((p) => p.id === selectedPlanId);
  const activated = team.filter((e) => e.status === "activated").length;
  const monthly = team.length * (plan?.price ?? 22);
  const usedGb = team.length * 3.2;

  const stats = [
    {
      icon: Users,
      label: "Active lines",
      value: `${activated}/${team.length || 0}`,
      hint: team.length ? `${activated} activated` : "No lines yet",
    },
    {
      icon: Activity,
      label: "Data used (mo.)",
      value: `${usedGb.toFixed(1)} GB`,
      hint: `of ${plan?.data ?? "—"} / line`,
    },
    {
      icon: CreditCard,
      label: "Monthly spend",
      value: `€${monthly}`,
      hint: `${team.length} × €${plan?.price ?? 0} · ${plan?.name ?? ""}`,
    },
    {
      icon: Signal,
      label: "Network status",
      value: "Operational",
      hint: "All regions green",
    },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              {business.companyName || "Your workspace"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {business.country} · {business.employees} employees · Admin{" "}
              {business.adminName || "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <Link
              to="/onboarding"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add line
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>

        {/* Lines table */}
        <div className="mt-8 rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Team lines</h2>
              <p className="text-xs text-muted-foreground">
                Manage activation, plans and usage for each employee.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-9 w-56 rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="Search employees"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm transition hover:bg-secondary"
              >
                <Filter className="h-3.5 w-3.5" /> Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Line</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {team.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="font-display text-lg font-semibold">No lines yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Finish onboarding to provision your first eSIM lines.
                      </p>
                      <Link
                        to="/onboarding"
                        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                      >
                        Start onboarding
                      </Link>
                    </td>
                  </tr>
                )}
                {team.map((e, i) => {
                  const p = PLANS.find((pl) => pl.id === e.planId);
                  const used = ((i * 1.7) % 40) + 0.6;
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                            {initials(e.name)}
                          </span>
                          <div>
                            <div className="font-medium">{e.name}</div>
                            <div className="text-xs text-muted-foreground">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        {phoneFor(e.id)}
                      </td>
                      <td className="px-5 py-4">{p?.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent to-signal"
                              style={{ width: `${Math.min(100, (used / 50) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {used.toFixed(1)} GB
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {e.status === "activated" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/25 px-2 py-0.5 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {e.status !== "activated" ? (
                          <button
                            type="button"
                            onClick={() => onboarding.activate(e.id)}
                            className="text-xs font-medium text-accent hover:underline"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing preview */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            <h3 className="font-display text-lg font-semibold">Next invoice</h3>
            <p className="text-xs text-muted-foreground">Estimated for 01 August 2026</p>
            <div className="mt-4 divide-y divide-border">
              <Row label={`${team.length} × ${plan?.name ?? "—"} plan`} value={`€${monthly}`} />
              <Row label="Roaming top-ups" value="€0" />
              <Row label="Setup fee" value="€0" />
              <Row label="Total (excl. VAT)" value={`€${monthly}`} strong />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground">
            <h3 className="font-display text-lg font-semibold">Need more lines?</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Add up to 50 lines on Team plan. Bulk-invite from a CSV or your HR tool.
            </p>
            <Link
              to="/onboarding"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Provision lines
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${strong ? "font-semibold" : "text-sm"}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "—"
  );
}

function phoneFor(id: string) {
  const digits = id.replace(/\D/g, "").padEnd(7, "0").slice(0, 7);
  return `+49 151 ${digits.slice(0, 3)} ${digits.slice(3, 7)}`;
}
