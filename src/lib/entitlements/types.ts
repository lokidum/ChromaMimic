import type { ExportFormat } from "../exporters";

export type Tier = "guest" | "free" | "pro";
export type Plan = "monthly" | "annual";
export type PaywallReason = "limit" | "pro-feature" | "upgrade";

export const FREE_LIMIT = 3; // downloads per calendar month for a free account

/* The single interface the UI talks to. Backed by a mock (localStorage) in
   dev/preview and by Clerk + Stripe + Vercel in production. */
export type Entitlements = {
  loaded: boolean;
  status: Tier;
  email: string | null;
  isPro: boolean;
  /** remaining free downloads this month; Infinity for pro */
  downloadsLeft: number;
  freeLimit: number;
  pendingExport: ExportFormat | null;

  requireSignIn: (opts?: { pendingExport?: ExportFormat }) => void;
  signOut: () => void;
  openPaywall: (reason?: PaywallReason) => void;
  closeModals: () => void;
  /** atomically spend one free download; pro always ok */
  consumeDownload: () => Promise<{ ok: boolean; reason?: PaywallReason }>;
  upgrade: (plan: Plan) => Promise<void>;
  manageBilling: () => Promise<void>;
  clearPendingExport: () => void;
};

export const PRICING = {
  monthly: { id: "monthly" as const, label: "Monthly", price: "$5", period: "/month", note: "" },
  annual: {
    id: "annual" as const,
    label: "Annual",
    price: "$39",
    period: "/year",
    note: "Save 35%",
  },
};

export const PRO_BENEFITS = [
  "Unlimited downloads, every format",
  "Wheel mode — full colorist colour grading",
  "65³ high-precision LUTs",
  "Save & re-download your LUT library",
  "Batch a whole folder of frames",
];
