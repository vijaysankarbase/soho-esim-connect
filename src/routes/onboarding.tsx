import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Mail,
  Plus,
  QrCode,
  Rocket,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/site-shell";
import { onboarding, PLANS, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding · Nimbus eSIM" },
      {
        name: "description",
        content: "Register your business, pick a plan, invite your team and activate eSIM lines.",
      },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { id: 0, label: "Business", icon: Building2 },
  { id: 1, label: "Plan", icon: Wallet },
  { id: 2, label: "Team", icon: Users },
  { id: 3, label: "Activate", icon: Rocket },
];

function OnboardingPage() {
  const state = useOnboarding();
  const navigate = useNavigate();

  const canAdvance = useMemo(() => {
    if (state.step === 0) {
      const b = state.business;
      return b.companyName && b.taxId && b.adminName && b.adminEmail;
    }
    if (state.step === 1) return !!state.selectedPlanId;
    if (state.step === 2) return state.team.length > 0;
    return true;
  }, [state]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Stepper */}
        <ol className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3">
          {STEPS.map((s, i) => {
            const done = state.step > s.id;
            const active = state.step === s.id;
            return (
              <li key={s.id} className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => state.step > s.id && onboarding.setStep(s.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "text-foreground hover:bg-secondary"
                        : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : done
                          ? "bg-success/25 text-foreground"
                          : "bg-secondary"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="hidden h-px flex-1 bg-border sm:block" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          {state.step === 0 && <BusinessStep />}
          {state.step === 1 && <PlanStep />}
          {state.step === 2 && <TeamStep />}
          {state.step === 3 && <ActivateStep />}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          {state.step > 0 ? (
            <button
              type="button"
              onClick={() => onboarding.setStep(state.step - 1)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          )}

          {state.step < 3 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => onboarding.setStep(state.step + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onboarding.complete();
                navigate({ to: "/dashboard" });
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground shadow-soft transition hover:opacity-90"
            >
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

function BusinessStep() {
  const { business } = useOnboarding();
  return (
    <Card
      title="Tell us about your business"
      subtitle="This information is used to verify your company and set up billing. All fields are required unless marked optional."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Company name">
          <input
            className={inputCls}
            placeholder="Nimbus Coffee GmbH"
            value={business.companyName}
            onChange={(e) => onboarding.updateBusiness({ companyName: e.target.value })}
          />
        </Field>
        <Field label="Tax / VAT ID">
          <input
            className={inputCls}
            placeholder="DE123456789"
            value={business.taxId}
            onChange={(e) => onboarding.updateBusiness({ taxId: e.target.value })}
          />
        </Field>
        <Field label="Industry">
          <select
            className={inputCls}
            value={business.industry}
            onChange={(e) => onboarding.updateBusiness({ industry: e.target.value })}
          >
            <option value="">Select industry</option>
            <option>Software & IT</option>
            <option>Retail & Hospitality</option>
            <option>Professional services</option>
            <option>Manufacturing</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Country">
          <select
            className={inputCls}
            value={business.country}
            onChange={(e) => onboarding.updateBusiness({ country: e.target.value })}
          >
            {["Germany", "France", "Netherlands", "Spain", "Italy", "United Kingdom"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </Field>
        <Field label="Team size">
          <select
            className={inputCls}
            value={business.employees}
            onChange={(e) => onboarding.updateBusiness({ employees: e.target.value })}
          >
            {["1-5", "6-15", "16-30", "31-50"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="hidden md:block" />

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
            <p className="font-display text-sm font-semibold">Admin contact</p>
            <p className="text-xs text-muted-foreground">
              The person who will manage lines and receive invoices.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Full name">
                <input
                  className={inputCls}
                  placeholder="Alex Weber"
                  value={business.adminName}
                  onChange={(e) => onboarding.updateBusiness({ adminName: e.target.value })}
                />
              </Field>
              <Field label="Work email">
                <input
                  type="email"
                  className={inputCls}
                  placeholder="alex@nimbus.co"
                  value={business.adminEmail}
                  onChange={(e) => onboarding.updateBusiness({ adminEmail: e.target.value })}
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  className={inputCls}
                  placeholder="+49 151 000 0000"
                  value={business.adminPhone}
                  onChange={(e) => onboarding.updateBusiness({ adminPhone: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlanStep() {
  const { selectedPlanId } = useOnboarding();
  return (
    <Card
      title="Choose a plan for your team"
      subtitle="You can mix plans per employee later. This is the default assigned to new lines."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const active = selectedPlanId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onboarding.selectPlan(p.id)}
              className={`relative flex flex-col rounded-2xl border p-6 text-left transition ${
                active
                  ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                  : "border-border bg-background hover:border-foreground/30"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2 right-4 rounded-full bg-signal px-2 py-0.5 text-xs font-medium text-signal-foreground">
                  Popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.data} data</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold">€{p.price}</span>
                <span className="text-sm text-muted-foreground">/line/mo</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.perks.map((k) => (
                  <li key={k} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {k}
                  </li>
                ))}
              </ul>
              <span
                className={`mt-6 inline-flex h-9 items-center justify-center rounded-full text-sm font-medium ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-card"
                }`}
              >
                {active ? "Selected" : "Select"}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TeamStep() {
  const { team, selectedPlanId } = useOnboarding();
  const [form, setForm] = useState({ name: "", email: "", role: "" });

  const add = () => {
    if (!form.name || !form.email) return;
    onboarding.addEmployee({
      name: form.name,
      email: form.email,
      role: form.role || "Team member",
      planId: selectedPlanId || "team",
    });
    setForm({ name: "", email: "", role: "" });
  };

  return (
    <Card
      title="Invite your team"
      subtitle="Add each colleague who needs a line. They'll receive an activation email — you can review before sending."
    >
      <div className="grid gap-3 rounded-2xl border border-border bg-secondary/40 p-4 md:grid-cols-[1.2fr_1.4fr_1fr_auto]">
        <input
          className={inputCls}
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          className={inputCls}
          placeholder="work@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Role (optional)"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add line
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {team.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No lines yet — add your first employee above.
                </td>
              </tr>
            )}
            {team.map((e) => {
              const plan = PLANS.find((p) => p.id === e.planId);
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.email} · {e.role}
                    </div>
                  </td>
                  <td className="px-4 py-3">{plan?.name} · {plan?.data}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                      Pending invite
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onboarding.removeEmployee(e.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ActivateStep() {
  const { team } = useOnboarding();

  return (
    <Card
      title="Activate eSIM lines"
      subtitle="Each employee scans their unique QR code on their phone camera to install the eSIM profile. Tap 'Simulate scan' to mark as activated."
    >
      {team.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Go back and add at least one employee to see activation codes.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {team.map((e) => (
          <ActivationCard key={e.id} employee={e} />
        ))}
      </div>
    </Card>
  );
}

function ActivationCard({ employee }: { employee: ReturnType<typeof useOnboarding>["team"][number] }) {
  const code = useMemo(
    () => `LPA:1$rsp.nimbus.co$${employee.id.slice(0, 8).toUpperCase()}`,
    [employee.id],
  );

  return (
    <div
      className={`flex gap-5 rounded-2xl border p-5 transition ${
        employee.status === "activated"
          ? "border-success/40 bg-success/10"
          : "border-border bg-background"
      }`}
    >
      <div className="grid h-28 w-28 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <QrCode className="h-20 w-20" strokeWidth={1.2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{employee.name}</p>
            <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
          </div>
          {employee.status === "activated" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/25 px-2 py-0.5 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Pending
            </span>
          )}
        </div>
        <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">{code}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(code)}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium transition hover:bg-secondary"
          >
            <Copy className="h-3 w-3" /> Copy code
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium transition hover:bg-secondary"
          >
            <Mail className="h-3 w-3" /> Email QR
          </button>
          {employee.status !== "activated" && (
            <button
              type="button"
              onClick={() => onboarding.activate(employee.id)}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground transition hover:opacity-90"
            >
              Simulate scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
