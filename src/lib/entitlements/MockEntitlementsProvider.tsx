import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { EntitlementsContext } from "./context";
import {
  FREE_LIMIT,
  type Entitlements,
  type PaywallReason,
  type Plan,
  type Tier,
} from "./types";
import type { ExportFormat } from "../exporters";
import { AuthModal } from "../../components/paywall/AuthModal";
import { PaywallModal } from "../../components/paywall/PaywallModal";

type Account = {
  email: string;
  tier: Exclude<Tier, "guest">;
  downloadsUsed: number;
  periodKey: string; // YYYY-MM
};

const KEY = "chromamimic.account";
const periodNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};
const load = (): Account | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
};
const save = (a: Account | null) => {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
/** roll the monthly counter if the stored period is stale */
const rolled = (a: Account): Account =>
  a.periodKey === periodNow() ? a : { ...a, downloadsUsed: 0, periodKey: periodNow() };

/* Local, no-backend entitlements for dev/preview. The whole guest -> free ->
   pro flow works against localStorage. Swap to ClerkEntitlementsProvider in
   production (same interface). */
export function MockEntitlementsProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("upgrade");
  const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);

  useEffect(() => {
    const a = load();
    if (a) {
      const r = rolled(a);
      if (r !== a) save(r);
      setAccount(r);
    }
    setLoaded(true);
  }, []);

  const status: Tier = account ? account.tier : "guest";
  const isPro = status === "pro";
  const downloadsLeft = isPro
    ? Infinity
    : account
      ? Math.max(0, FREE_LIMIT - rolled(account).downloadsUsed)
      : 0;

  const closeModals = useCallback(() => {
    setAuthOpen(false);
    setPaywallOpen(false);
  }, []);

  const requireSignIn = useCallback((opts?: { pendingExport?: ExportFormat }) => {
    if (opts?.pendingExport) setPendingExport(opts.pendingExport);
    setPaywallOpen(false);
    setAuthOpen(true);
  }, []);

  const openPaywall = useCallback((reason: PaywallReason = "upgrade") => {
    setPaywallReason(reason);
    setAuthOpen(false);
    setPaywallOpen(true);
  }, []);

  const signIn = useCallback((email: string) => {
    const a: Account = { email, tier: "free", downloadsUsed: 0, periodKey: periodNow() };
    save(a);
    setAccount(a);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(() => {
    save(null);
    setAccount(null);
  }, []);

  const consumeDownload = useCallback(async (): Promise<{ ok: boolean; reason?: PaywallReason }> => {
    if (!account) return { ok: false };
    if (account.tier === "pro") return { ok: true };
    const r = rolled(account);
    if (r.downloadsUsed >= FREE_LIMIT) return { ok: false, reason: "limit" };
    const next = { ...r, downloadsUsed: r.downloadsUsed + 1 };
    save(next);
    setAccount(next);
    return { ok: true };
  }, [account]);

  const upgrade = useCallback(
    async (_plan: Plan) => {
      const base: Account =
        account ?? { email: "creator@gmail.com", tier: "free", downloadsUsed: 0, periodKey: periodNow() };
      const next: Account = { ...base, tier: "pro" };
      save(next);
      setAccount(next);
      setPaywallOpen(false);
    },
    [account],
  );

  const manageBilling = useCallback(async () => {
    if (!account) return;
    // demo: simulate the Stripe customer portal "cancel" so the full cycle is testable
    if (window.confirm("Demo billing portal — cancel Pro and return to Free?")) {
      const next: Account = { ...account, tier: "free" };
      save(next);
      setAccount(next);
    }
  }, [account]);

  const clearPendingExport = useCallback(() => setPendingExport(null), []);

  const value: Entitlements = useMemo(
    () => ({
      loaded,
      status,
      email: account?.email ?? null,
      isPro,
      downloadsLeft,
      freeLimit: FREE_LIMIT,
      pendingExport,
      requireSignIn,
      signOut,
      openPaywall,
      closeModals,
      consumeDownload,
      upgrade,
      manageBilling,
      clearPendingExport,
    }),
    [
      loaded,
      status,
      account,
      isPro,
      downloadsLeft,
      pendingExport,
      requireSignIn,
      signOut,
      openPaywall,
      closeModals,
      consumeDownload,
      upgrade,
      manageBilling,
      clearPendingExport,
    ],
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSubmit={signIn} />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason={paywallReason}
        onUpgrade={upgrade}
      />
    </EntitlementsContext.Provider>
  );
}
