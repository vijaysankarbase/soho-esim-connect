// Lightweight in-memory + sessionStorage store for the POC.
// No backend — resets on hard refresh unless sessionStorage carries state.
import { useSyncExternalStore } from "react";

export type Plan = {
  id: string;
  name: string;
  data: string;
  price: number;
  perks: string[];
  highlight?: boolean;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  planId: string;
  status: "pending" | "activated";
};

export type OnboardingState = {
  step: number;
  business: {
    companyName: string;
    industry: string;
    country: string;
    employees: string;
    taxId: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
  };
  selectedPlanId: string | null;
  team: Employee[];
  completed: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    data: "10 GB",
    price: 12,
    perks: ["EU roaming", "5G ready", "Voicemail-to-email"],
  },
  {
    id: "team",
    name: "Team",
    data: "50 GB",
    price: 22,
    perks: ["EU + UK + US roaming", "Shared team pool", "Priority network"],
    highlight: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    data: "Unlimited",
    price: 38,
    perks: ["Global roaming (60+ countries)", "Hotspot unlimited", "24/7 concierge"],
  },
];

const defaultState: OnboardingState = {
  step: 0,
  business: {
    companyName: "",
    industry: "",
    country: "Germany",
    employees: "1-5",
    taxId: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
  },
  selectedPlanId: "team",
  team: [],
  completed: false,
};

const STORAGE_KEY = "nimbus_onboarding_v1";

let state: OnboardingState = load();
const listeners = new Set<() => void>();

function load(): OnboardingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const onboarding = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setStep: (step: number) => {
    state = { ...state, step };
    emit();
  },
  updateBusiness: (patch: Partial<OnboardingState["business"]>) => {
    state = { ...state, business: { ...state.business, ...patch } };
    emit();
  },
  selectPlan: (planId: string) => {
    state = { ...state, selectedPlanId: planId };
    emit();
  },
  addEmployee: (emp: Omit<Employee, "id" | "status">) => {
    state = {
      ...state,
      team: [
        ...state.team,
        {
          ...emp,
          id: crypto.randomUUID(),
          status: "pending",
        },
      ],
    };
    emit();
  },
  removeEmployee: (id: string) => {
    state = { ...state, team: state.team.filter((e) => e.id !== id) };
    emit();
  },
  activate: (id: string) => {
    state = {
      ...state,
      team: state.team.map((e) => (e.id === id ? { ...e, status: "activated" } : e)),
    };
    emit();
  },
  complete: () => {
    state = { ...state, completed: true };
    emit();
  },
  reset: () => {
    state = defaultState;
    emit();
  },
};

export function useOnboarding() {
  return useSyncExternalStore(
    onboarding.subscribe,
    () => state,
    () => defaultState,
  );
}
