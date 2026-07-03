import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Battery,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Globe,
  KeyRound,
  Loader2,
  Package,
  ShieldCheck,
  Signal,
  Smartphone,
  Truck,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { lookupEnterprise, type KboLookupResult } from "@/lib/kbo.functions";
import { matchIdentity } from "@/lib/name-match";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOHO eSIM Onboarding POC · My BASE" },
      {
        name: "description",
        content:
          "Proof of concept for SOHO eSIM onboarding: eSIM compatibility, itsme identity, KBO company validation.",
      },
    ],
  }),
  component: SohoPoc,
});

/* --------------------------- Plans --------------------------- */

type Plan = {
  id: string;
  name: string;
  price: number;
  data: string;
  calls: string;
  perks: string[];
  badge?: string;
};

const PLANS: Plan[] = [
  {
    id: "soho-s",
    name: "SOHO S",
    price: 15,
    data: "10 GB",
    calls: "200 min",
    perks: ["EU roaming", "5G", "Voicemail"],
  },
  {
    id: "soho-m",
    name: "SOHO M",
    price: 25,
    data: "50 GB",
    calls: "Unlimited",
    perks: ["EU + UK roaming", "5G", "Shared pool"],
    badge: "Popular",
  },
  {
    id: "soho-l",
    name: "SOHO L",
    price: 40,
    data: "150 GB",
    calls: "Unlimited",
    perks: ["EU + UK + US", "5G+", "Priority network"],
  },
  {
    id: "soho-xl",
    name: "SOHO XL",
    price: 60,
    data: "Unlimited",
    calls: "Unlimited",
    perks: ["Global 60+ countries", "5G+", "24/7 support"],
  },
];

/* ------------------------ Screen keys ------------------------ */

type Screen =
  | "plans"
  | "sim-select"
  | "esim-compatible"
  | "customer-info"
  | "company-info"
  | "itsme-loading"
  | "itsme-consent"
  | "kbo-loading"
  | "kbo-error"
  | "kbo-not-active"
  | "match-fail"
  | "match-success"
  | "physical-order"
  | "physical-confirmed"
  | "esim-pin"
  | "esim-os-prompt"
  | "esim-installing"
  | "esim-activated";

/* ============================================================ */

function SohoPoc() {
  // Dev/debug input panel state
  const [esimCompatible, setEsimCompatible] = useState(true);
  const [itsmeFirstName, setItsmeFirstName] = useState("Jan");
  const [itsmeLastName, setItsmeLastName] = useState("Peeters");
  const itsmeName = `${itsmeFirstName} ${itsmeLastName}`.replace(/\s+/g, " ").trim();
  const [enterpriseNumber, setEnterpriseNumber] = useState("0203201340");

  // Wizard state
  const [screen, setScreen] = useState<Screen>("plans");
  const [history, setHistory] = useState<Screen[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [simType, setSimType] = useState<"esim" | "physical" | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", dob: "" });
  const [company, setCompany] = useState({ name: "", type: "BVBA" });
  const [kbo, setKbo] = useState<KboLookupResult | null>(null);

  const lookupFn = useServerFn(lookupEnterprise);

  const go = (next: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  };
  const back = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setScreen(prev);
      return h.slice(0, -1);
    });
  };
  const restart = () => {
    setScreen("plans");
    setHistory([]);
    setSelectedPlanId(null);
    setSimType(null);
    setKbo(null);
  };

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) ?? null,
    [selectedPlanId],
  );

  /* --------------- Flow transitions --------------- */

  const chooseSim = (t: "esim" | "physical") => {
    setSimType(t);
    if (t === "physical") {
      go("physical-order");
    } else {
      go(esimCompatible ? "esim-compatible" : "match-fail");
    }
  };

  const startItsme = () => {
    go("itsme-loading");
    setTimeout(() => setScreen("itsme-consent"), 1400);
  };

  const runKbo = async () => {
    go("kbo-loading");
    try {
      const result = await lookupFn({ data: { enterpriseNumber } });
      setKbo(result);
      if (result.source === "error" || result.status === "unknown") {
        setScreen("kbo-error");
        return;
      }
      if (result.status !== "active") {
        setScreen("kbo-not-active");
        return;
      }
      const matched = result.functions.some((f) => matchIdentity(itsmeName, f));
      setScreen(matched ? "match-success" : "match-fail");
    } catch (e) {
      setKbo({
        enterpriseNumber,
        companyName: "",
        status: "unknown",
        functions: [],
        source: "error",
        error: e instanceof Error ? e.message : String(e),
      });
      setScreen("match-fail");
    }
  };

  /* ==================== Render ==================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f2e] via-[#004a5c] to-[#00a9c7] py-8">
      <div className="mx-auto max-w-xl px-4">
        {/* Debug input panel — only on first screen */}
        {screen === "plans" && (
          <DebugPanel
            esimCompatible={esimCompatible}
            setEsimCompatible={setEsimCompatible}
            itsmeFirstName={itsmeFirstName}
            setItsmeFirstName={setItsmeFirstName}
            itsmeLastName={itsmeLastName}
            setItsmeLastName={setItsmeLastName}
          />

        )}

        {/* Phone mockup */}
        <PhoneFrame>
          <PhoneChrome onBack={history.length ? back : undefined} onRestart={restart} />

          <div className="flex-1 overflow-y-auto">
            {screen === "plans" && (
              <PlansScreen
                selected={selectedPlanId}
                onSelect={setSelectedPlanId}
                onNext={() => go(esimCompatible ? "esim-compatible" : "sim-select")}
              />
            )}
            {screen === "sim-select" && (
              <SimSelectScreen esimCompatible={esimCompatible} onChoose={chooseSim} />
            )}
            {screen === "esim-compatible" && (
              <EsimCompatibleScreen
                onSelectEsim={() => {
                  setSimType("esim");
                  go("customer-info");
                }}
                onSelectPhysical={() => {
                  setSimType("physical");
                  go("physical-order");
                }}
              />
            )}
            {screen === "customer-info" && (
              <CustomerInfoScreen
                value={customer}
                onChange={setCustomer}
                onNext={() => go("company-info")}
              />
            )}
            {screen === "company-info" && (
              <CompanyInfoScreen
                value={company}
                onChange={setCompany}
                enterpriseNumber={enterpriseNumber}
                setEnterpriseNumber={setEnterpriseNumber}
                onNext={startItsme}
              />
            )}
            {screen === "itsme-loading" && <ItsmeLoading />}
            {screen === "itsme-consent" && (
              <ItsmeConsent
                firstName={itsmeFirstName}
                lastName={itsmeLastName}
                onApprove={runKbo}
                onCancel={back}
              />
            )}
            {screen === "kbo-loading" && <KboLoading />}
            {screen === "kbo-error" && <KboErrorScreen kbo={kbo!} onRestart={restart} />}
            {screen === "kbo-not-active" && <KboNotActive kbo={kbo!} onRestart={restart} />}
            {screen === "match-fail" && (
              <MatchFailScreen
                itsmeName={itsmeName}
                kbo={kbo}
                onPhysical={() => {
                  setSimType("physical");
                  go("physical-order");
                }}
              />
            )}
            {screen === "match-success" && (
              <MatchSuccessScreen
                plan={selectedPlan}
                kbo={kbo!}
                itsmeName={itsmeName}
                onFinish={() => go("esim-pin")}
              />
            )}
            {screen === "physical-order" && (
              <PhysicalOrderScreen
                plan={selectedPlan}
                onSubmit={() => go("physical-confirmed")}
              />
            )}
            {screen === "physical-confirmed" && <PhysicalConfirmed onFinish={restart} />}
            {screen === "esim-pin" && (
              <EsimPinScreen onActivate={() => go("esim-os-prompt")} />
            )}
            {screen === "esim-os-prompt" && (
              <EsimOsPromptScreen
                onAllow={() => go("esim-installing")}
                onDeny={() => go("esim-pin")}
              />
            )}
            {screen === "esim-installing" && (
              <EsimInstallingScreen onDone={() => setScreen("esim-activated")} />
            )}
            {screen === "esim-activated" && <EsimActivatedScreen onFinish={restart} />}
          </div>
        </PhoneFrame>

        {kbo && (kbo.requestXml || kbo.responseXml || kbo.error) && (
          <KboDebug kbo={kbo} />
        )}

        <p className="mt-6 text-center text-xs text-white/50">
          POC · My BASE inspired flow · KBO ({kbo?.source ?? "not called"})
        </p>
      </div>
    </div>
  );
}

function KboDebug({ kbo }: { kbo: KboLookupResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          Last KBO round-trip
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] normal-case tracking-normal ${
              kbo.source === "live" ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"
            }`}
          >
            {kbo.source}
          </span>
        </span>
        <span className="text-xs text-white/50">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 p-4 text-xs text-white/80">
          {kbo.endpoint && (
            <div>
              <div className="mb-1 text-white/50">Endpoint</div>
              <code className="block break-all rounded bg-black/40 p-2 font-mono text-[11px] text-cyan-200">
                POST {kbo.endpoint}
              </code>
            </div>
          )}
          {kbo.error && (
            <div>
              <div className="mb-1 text-white/50">Note</div>
              <div className="rounded bg-amber-500/10 p-2 text-[11px] text-amber-200">{kbo.error}</div>
            </div>
          )}
          {kbo.requestXml && (
            <details open>
              <summary className="cursor-pointer text-white/60">Request SOAP envelope (password digest redacted)</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-white/80">
                {kbo.requestXml}
              </pre>
            </details>
          )}
          {kbo.responseXml && (
            <details>
              <summary className="cursor-pointer text-white/60">Response SOAP (truncated)</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-white/80">
                {kbo.responseXml}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}


/* ==================== Building blocks ==================== */

function DebugPanel(props: {
  esimCompatible: boolean;
  setEsimCompatible: (v: boolean) => void;
  itsmeFirstName: string;
  setItsmeFirstName: (v: string) => void;
  itsmeLastName: string;
  setItsmeLastName: (v: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-cyan-300">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
        POC Inputs
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-white sm:col-span-2">
          <span>eSIM compatible</span>
          <button
            type="button"
            onClick={() => props.setEsimCompatible(!props.esimCompatible)}
            className={`relative h-6 w-11 rounded-full transition ${
              props.esimCompatible ? "bg-cyan-400" : "bg-white/20"
            }`}
            aria-label="Toggle eSIM compatibility"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                props.esimCompatible ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </label>
        <label className="flex flex-col gap-1 text-sm text-white">
          <span className="text-xs text-white/60">itsme first name</span>
          <input
            className="h-9 rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
            value={props.itsmeFirstName}
            onChange={(e) => props.setItsmeFirstName(e.target.value)}
            placeholder="Jan"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white">
          <span className="text-xs text-white/60">itsme last name</span>
          <input
            className="h-9 rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
            value={props.itsmeLastName}
            onChange={(e) => props.setItsmeLastName(e.target.value)}
            placeholder="Peeters"
          />
        </label>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-white/50">
        Live KBO Public Search WS (acceptance). The enterprise number is entered in the phone flow.
        First and last name are compared separately against the company's authorised representatives returned by KBO.
      </p>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="relative rounded-[2.5rem] border-[10px] border-black bg-black shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-[720px] flex-col overflow-hidden rounded-[2rem] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

function PhoneChrome({ onBack, onRestart }: { onBack?: () => void; onRestart: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between bg-white px-6 pb-1 pt-3 text-xs font-medium text-black">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3" />
          <span className="text-[10px]">BASE</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100 disabled:opacity-30"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00b4d8]" />
          <span className="font-display text-sm font-semibold text-slate-800">My BASE</span>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
        >
          Restart
        </button>
      </div>
    </>
  );
}

/* ==================== Screens ==================== */

function PlansScreen({
  selected,
  onSelect,
  onNext,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-3 pt-5">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Choose your SOHO plan</h1>
        <p className="mt-1 text-sm text-slate-500">For freelancers and small offices.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {PLANS.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${
                active
                  ? "border-[#00b4d8] bg-cyan-50/60"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2 right-4 rounded-full bg-[#00b4d8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {p.badge}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold text-slate-900">{p.name}</span>
                <span className="text-slate-900">
                  <span className="text-xl font-bold">€{p.price}</span>
                  <span className="text-xs text-slate-500">/mo</span>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>📶 {p.data}</span>
                <span>📞 {p.calls}</span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {p.perks.map((perk) => (
                  <li
                    key={perk}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                  >
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-4">
        <PrimaryButton disabled={!selected} onClick={onNext}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}

function SimSelectScreen({
  esimCompatible,
  onChoose,
}: {
  esimCompatible: boolean;
  onChoose: (t: "esim" | "physical") => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-5">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Choose your SIM</h1>
      <p className="mt-1 text-sm text-slate-500">How do you want to activate your line?</p>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => onChoose("esim")}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-[#00b4d8]"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-50 text-[#00b4d8]">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">eSIM</div>
            <div className="text-xs text-slate-500">Activate instantly, no card to receive.</div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
        <button
          type="button"
          onClick={() => onChoose("physical")}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-[#00b4d8]"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Physical SIM</div>
            <div className="text-xs text-slate-500">Shipped to your address in 1–2 days.</div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      {!esimCompatible && (
        <div className="mt-6 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          Heads up: your device does not appear to be eSIM-ready. We'll check this after you pick.
        </div>
      )}
    </div>
  );
}

function EsimCompatibleScreen({
  onSelectEsim,
  onSelectPhysical,
}: {
  onSelectEsim: () => void;
  onSelectPhysical: () => void;
}) {
  const benefits = [
    { icon: Zap, text: "Instant activation — no waiting for delivery" },
    { icon: Globe, text: "Switch plans or add lines digitally" },
    { icon: Smartphone, text: "Use multiple numbers on one device" },
  ];

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-cyan-50">
            <CheckCircle2 className="h-10 w-10 text-[#00b4d8]" strokeWidth={1.5} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">
            Your phone is eSIM compatible
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            You're all set for a digital SIM. Activate your SOHO line in minutes.
          </p>
        </div>
        <div className="mt-5 space-y-2">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.text}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-[#00b4d8]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">{b.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-3 border-t border-slate-100 bg-white pt-4">
        <PrimaryButton onClick={onSelectEsim}>Select eSIM</PrimaryButton>
        <SecondaryButton onClick={onSelectPhysical} icon={<Package className="h-4 w-4" />}>
          Select physical SIM
        </SecondaryButton>
      </div>
    </div>
  );
}

function CustomerInfoScreen({
  value,
  onChange,
  onNext,
}: {
  value: { name: string; email: string; dob: string };
  onChange: (v: { name: string; email: string; dob: string }) => void;
  onNext: () => void;
}) {
  const canNext = value.name && value.email && value.dob;
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 px-5 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">About you</h1>
          <p className="mt-1 text-sm text-slate-500">
            We need a few details to prepare your line.
          </p>
        </div>
        <MobileField label="Full name">
          <input
            className={mInput}
            placeholder="Jan Peeters"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </MobileField>
        <MobileField label="Email">
          <input
            type="email"
            className={mInput}
            placeholder="jan@example.be"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
        </MobileField>
        <MobileField label="Date of birth">
          <DobInput value={value.dob} onChange={(dob) => onChange({ ...value, dob })} />
        </MobileField>
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-4">
        <PrimaryButton disabled={!canNext} onClick={onNext}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}

function CompanyInfoScreen({
  value,
  onChange,
  enterpriseNumber,
  setEnterpriseNumber,
  onNext,
}: {
  value: { name: string; type: string };
  onChange: (v: { name: string; type: string }) => void;
  enterpriseNumber: string;
  setEnterpriseNumber: (v: string) => void;
  onNext: () => void;
}) {
  const canNext = value.name && enterpriseNumber.replace(/\D/g, "").length >= 9;
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 px-5 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Your company</h1>
          <p className="mt-1 text-sm text-slate-500">
            We verify this against the KBO / BCE registry.
          </p>
        </div>
        <MobileField label="Company name">
          <input
            className={mInput}
            placeholder="Nimbus Coffee BVBA"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </MobileField>
        <MobileField label="Company number (KBO/BCE)">
          <input
            className={`${mInput} font-mono`}
            placeholder="0203.201.340"
            value={enterpriseNumber}
            onChange={(e) => setEnterpriseNumber(e.target.value)}
          />
        </MobileField>
        <MobileField label="Business type">
          <select
            className={mInput}
            value={value.type}
            onChange={(e) => onChange({ ...value, type: e.target.value })}
          >
            <option>BVBA</option>
            <option>NV</option>
            <option>Sole proprietorship</option>
            <option>VZW</option>
          </select>
        </MobileField>
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-4">
        <PrimaryButton disabled={!canNext} onClick={onNext}>
          Continue with itsme
        </PrimaryButton>
      </div>
    </div>
  );
}

function ItsmeLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#ff5a00] text-white">
      <div className="rounded-2xl bg-white/15 px-4 py-2 font-display text-lg font-bold">itsme®</div>
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm text-white/80">Opening itsme...</p>
    </div>
  );
}

function ItsmeConsent({
  firstName,
  lastName,
  onApprove,
  onCancel,
}: {
  firstName: string;
  lastName: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#ff5a00] text-white">
      <div className="px-6 pt-8">
        <div className="inline-block rounded-xl bg-white/15 px-3 py-1 font-display text-base font-bold">
          itsme®
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Share your identity with BASE?</h1>
        <p className="mt-2 text-sm text-white/80">
          BASE is asking you to confirm your identity to open a SOHO eSIM line.
        </p>
        <div className="mt-6 space-y-2 rounded-2xl bg-white/10 p-4 text-sm">
          <Row k="First name" v={firstName || "—"} />
          <Row k="Last name" v={lastName || "—"} />
          <Row k="Nationality" v="Belgian" />
          <Row k="Age verification" v="18+" />
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 p-5">
        <button
          type="button"
          onClick={onApprove}
          className="h-12 rounded-full bg-white font-semibold text-[#ff5a00]"
        >
          Confirm
        </button>
        <button type="button" onClick={onCancel} className="h-11 text-sm text-white/80">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/70">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function KboLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-cyan-50">
        <ShieldCheck className="h-8 w-8 text-[#00b4d8]" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      <p className="text-sm text-slate-600">Verifying company with KBO / BCE…</p>
    </div>
  );
}

function KboNotActive({ kbo, onRestart }: { kbo: KboLookupResult; onRestart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
      <div />
      <div className="flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-red-50">
          <X className="h-14 w-14 text-red-500" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-slate-900">
          Company is not active
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          According to KBO, <span className="font-medium">{kbo.companyName || kbo.enterpriseNumber}</span>{" "}
          is not in an active state. We can't open a SOHO line for it.
        </p>
      </div>
      <div className="w-full">
        <PrimaryButton onClick={onRestart}>Back to start</PrimaryButton>
      </div>
    </div>
  );
}

function KboErrorScreen({ kbo, onRestart }: { kbo: KboLookupResult; onRestart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
      <div />
      <div className="flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-amber-50">
          <ShieldCheck className="h-14 w-14 text-amber-500" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-slate-900">
          KBO lookup failed
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          We couldn't verify <span className="font-medium">{kbo.enterpriseNumber}</span> with KBO right now.
          Please try again later.
        </p>
      </div>
      <div className="w-full">
        <PrimaryButton onClick={onRestart}>Back to start</PrimaryButton>
      </div>
    </div>
  );
}

function MatchFailScreen({
  itsmeName,
  kbo,
  onPhysical,
}: {
  itsmeName: string;
  kbo: KboLookupResult | null;
  onPhysical: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
      <div />
      <div className="flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-red-50">
          <X className="h-14 w-14 text-red-500" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-slate-900">
          eSIM order is not possible
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          We couldn't match <span className="font-medium">{itsmeName}</span> to an authorised
          representative of{" "}
          <span className="font-medium">{kbo?.companyName || "this company"}</span>.
        </p>


      </div>
      <div className="w-full space-y-2">
        <PrimaryButton onClick={onPhysical}>Order a physical SIM instead</PrimaryButton>
        <p className="text-xs text-slate-500">
          A physical SIM is shipped to your company address for verification.
        </p>
      </div>
    </div>
  );
}

function MatchSuccessScreen({
  plan,
  kbo,
  itsmeName,
  onFinish,
}: {
  plan: Plan | null;
  kbo: KboLookupResult;
  itsmeName: string;
  onFinish: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-green-50">
          <Check className="h-12 w-12 text-green-600" strokeWidth={2} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">
          Identity verified
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {itsmeName} is a registered representative of {kbo.companyName}.
        </p>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <Row2 k="Company" v={kbo.companyName} />
        <Row2 k="KBO nr." v={kbo.enterpriseNumber} />
        <Row2 k="Status" v="Active" />
        {plan && <Row2 k="Plan" v={`${plan.name} — €${plan.price}/mo`} />}
        <Row2 k="Data source" v={kbo.source === "live" ? "KBO live" : "KBO error"} />
      </div>
      <div className="mt-auto">
        <PrimaryButton onClick={onFinish}>Activate my eSIM</PrimaryButton>
      </div>
    </div>
  );
}

function Row2({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{k}</span>
      <span className="text-right font-medium text-slate-900">{v}</span>
    </div>
  );
}

function PhysicalOrderScreen({ plan, onSubmit }: { plan: Plan | null; onSubmit: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Order overview</h1>
          <p className="mt-1 text-sm text-slate-500">Review your physical SIM order.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{plan?.name ?? "SOHO plan"}</div>
              <div className="text-xs text-slate-500">
                {plan?.data} · {plan?.calls}
              </div>
            </div>
            <div className="font-semibold text-slate-900">€{plan?.price ?? 0}/mo</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Shipping
          </div>
          <div className="mt-1 text-sm text-slate-900">Physical SIM · 1–2 working days</div>
          <div className="text-xs text-slate-500">Free delivery to your business address</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          By submitting you agree to BASE's SOHO terms. Your line will be activated once you insert
          and register the SIM.
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-4">
        <PrimaryButton onClick={onSubmit}>Submit order</PrimaryButton>
      </div>
    </div>
  );
}

function PhysicalConfirmed({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
      <div />
      <div className="flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-cyan-50">
          <Truck className="h-14 w-14 text-[#00b4d8]" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-slate-900">
          Your SIM is on its way
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your SIM will be shipped in <span className="font-medium">1–2 working days</span>. You'll
          receive a tracking link by email.
        </p>
      </div>
      <div className="w-full">
        <PrimaryButton onClick={onFinish}>Done</PrimaryButton>
      </div>
    </div>
  );
}

/* ==================== UI atoms ==================== */

const mInput =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00b4d8]";

function DobInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value is ISO YYYY-MM-DD (or empty). Keep local partial state so users can type freely.
  const initial = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yy, mm, dd] = value.split("-");
      return { d: dd, m: mm, y: yy };
    }
    return { d: "", m: "", y: "" };
  }, [value]);
  const [parts, setParts] = useState(initial);
  const numeric = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max);
  const update = (next: { d: string; m: string; y: string }) => {
    setParts(next);
    if (next.d.length === 2 && next.m.length === 2 && next.y.length === 4) {
      onChange(`${next.y}-${next.m}-${next.d}`);
    } else if (value) {
      onChange("");
    }
  };
  return (
    <div className="flex gap-2">
      <input
        inputMode="numeric"
        placeholder="DD"
        aria-label="Day"
        className={`${mInput} text-center`}
        value={parts.d}
        maxLength={2}
        onChange={(e) => update({ ...parts, d: numeric(e.target.value, 2) })}
      />
      <input
        inputMode="numeric"
        placeholder="MM"
        aria-label="Month"
        className={`${mInput} text-center`}
        value={parts.m}
        maxLength={2}
        onChange={(e) => update({ ...parts, m: numeric(e.target.value, 2) })}
      />
      <input
        inputMode="numeric"
        placeholder="YYYY"
        aria-label="Year"
        className={`${mInput} text-center`}
        value={parts.y}
        maxLength={4}
        onChange={(e) => update({ ...parts, y: numeric(e.target.value, 4) })}
      />
    </div>
  );
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00b4d8] font-semibold text-white shadow-md transition hover:bg-[#0090b0] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {icon}
      {children}
    </button>
  );
}

/* ==================== eSIM install simulation ==================== */

function EsimPinScreen({ onActivate }: { onActivate: () => void }) {
  const pin = "4829";

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e0f7fb]">
          <KeyRound className="h-8 w-8 text-[#00a9c7]" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">
          Your eSIM activation code
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Keep this code handy. Your device will use it to download your BASE eSIM profile.
        </p>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
          Activation PIN
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="font-mono text-lg font-semibold tracking-wider text-slate-900">
            {pin}
          </code>
          <button
            type="button"
            onClick={copy}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-white"
            aria-label="Copy PIN"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        {copied && (
          <div className="mt-2 text-xs text-emerald-600">Copied to clipboard</div>
        )}
      </div>
      <ul className="mt-5 space-y-2 text-xs text-slate-500">
        <li>• Your line stays active on any current SIM until install completes.</li>
        <li>• You can install the eSIM on one device at a time.</li>
      </ul>
      <div className="mt-auto">
        <PrimaryButton onClick={onActivate}>Activate eSIM</PrimaryButton>
      </div>
    </div>
  );
}

function EsimOsPromptScreen({ onAllow, onDeny }: { onAllow: () => void; onDeny: () => void }) {
  return (
    <div className="relative flex h-full flex-col bg-slate-100">
      {/* Fake iOS status bar + settings backdrop */}
      <div className="flex items-center justify-between px-6 pt-3 text-xs font-semibold text-slate-900">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3" />
          <Wifi className="h-3 w-3" />
          <Battery className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="px-6 pt-6">
        <div className="text-[13px] text-slate-500">Settings</div>
        <div className="mt-1 font-display text-2xl font-semibold text-slate-900">
          Cellular
        </div>
      </div>
      <div className="mx-6 mt-4 space-y-px overflow-hidden rounded-2xl bg-white text-sm text-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <span>Primary</span>
          <span className="text-slate-400">Personal</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-slate-400">Add eSIM…</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
      </div>

      {/* iOS-style dialog */}
      <div className="absolute inset-0 flex items-end justify-center bg-black/40 px-4 pb-6">
        <div className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white/95 backdrop-blur">
          <div className="px-5 pb-3 pt-5 text-center">
            <div className="font-display text-[15px] font-semibold text-slate-900">
              "BASE" would like to install a Cellular Plan
            </div>
            <p className="mt-2 text-[12px] leading-snug text-slate-600">
              This will download an eSIM profile from BASE onto this iPhone. You can manage it later in Settings › Cellular.
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-200 text-[15px]">
            <button
              type="button"
              onClick={onDeny}
              className="border-r border-slate-200 py-3 font-medium text-[#007aff] hover:bg-slate-50"
            >
              Don't Allow
            </button>
            <button
              type="button"
              onClick={onAllow}
              className="py-3 font-semibold text-[#007aff] hover:bg-slate-50"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EsimInstallingScreen({ onDone }: { onDone: () => void }) {
  const steps = [
    "Contacting BASE provisioning server…",
    "Downloading eSIM profile…",
    "Installing on secure element…",
    "Registering on the BASE network…",
    "Activating your line…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e0f7fb]">
          <Download className="h-8 w-8 text-[#00a9c7]" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">
          Installing your eSIM
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Keep this screen open. This usually takes less than a minute.
        </p>
      </div>
      <div className="mt-6 space-y-3">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                done
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                  : active
                    ? "border-[#00a9c7]/30 bg-[#e0f7fb] text-slate-900"
                    : "border-slate-100 bg-white text-slate-400"
              }`}
            >
              <span className="grid h-6 w-6 place-items-center">
                {done ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#00a9c7]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EsimActivatedScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-green-50">
          <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">
          Your eSIM is active
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You're now connected on the BASE network. Enjoy your new SOHO line.
        </p>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <Row2 k="Network" v="BASE 5G" />
        <Row2 k="Signal" v="Excellent" />
        <Row2 k="Line status" v="Active" />
      </div>
      <div className="mt-auto">
        <PrimaryButton onClick={onFinish}>Done</PrimaryButton>
      </div>
    </div>
  );
}
