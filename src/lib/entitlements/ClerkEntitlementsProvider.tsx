import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ClerkProvider,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/clerk-react";
import { EntitlementsContext } from "./context";
import {
  FREE_LIMIT,
  type Entitlements,
  type PaywallReason,
  type Plan,
  type Tier,
} from "./types";
import type { ExportFormat } from "../exporters";
import { PaywallModal } from "../../components/paywall/PaywallModal";

const PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const periodNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

/* Production entitlements: Clerk auth + Vercel API (Stripe). Same interface as
   the mock. Tier + counter live in Clerk publicMetadata (server-written). */
export function ClerkEntitlementsProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={PK}
      appearance={{
        variables: {
          colorBackground: "#1a1a1c",
          colorPrimary: "#e8c9a0",
          colorText: "#f4f3ef",
          colorTextSecondary: "#b8b3a8",
          colorInputBackground: "#222226",
          borderRadius: "8px",
        },
      }}
    >
      <Inner>{children}</Inner>
    </ClerkProvider>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const clerk = useClerk();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("upgrade");
  const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
  // server-authoritative entitlements (admin allowlist + counter live here)
  const [serverEnt, setServerEnt] = useState<{ tier: "free" | "pro"; downloadsLeft: number } | null>(
    null,
  );

  const meta = (user?.publicMetadata ?? {}) as {
    tier?: "free" | "pro";
    downloadsUsed?: number;
    periodKey?: string;
  };
  const metaTier = meta.tier === "pro" ? "pro" : "free";
  const effTier = serverEnt?.tier ?? (isSignedIn ? metaTier : "free");
  const status: Tier = !isSignedIn ? "guest" : effTier;
  const isPro = status === "pro";
  const usedMeta = meta.periodKey === periodNow() ? meta.downloadsUsed ?? 0 : 0;
  const downloadsLeft = isPro
    ? Infinity
    : isSignedIn
      ? serverEnt
        ? serverEnt.downloadsLeft < 0
          ? Infinity
          : serverEnt.downloadsLeft
        : Math.max(0, FREE_LIMIT - usedMeta)
      : 0;

  const requireSignIn = useCallback(
    (opts?: { pendingExport?: ExportFormat }) => {
      if (opts?.pendingExport) setPendingExport(opts.pendingExport);
      clerk.openSignIn({});
    },
    [clerk],
  );

  const openPaywall = useCallback((reason: PaywallReason = "upgrade") => {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }, []);

  const api = useCallback(
    async (path: string, body?: unknown) => {
      const token = await getToken();
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res;
    },
    [getToken],
  );

  // fetch effective entitlements from the server on sign-in (covers the admin allowlist)
  useEffect(() => {
    if (!isSignedIn) {
      setServerEnt(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/entitlements");
        if (res.ok && !cancelled) setServerEnt(await res.json());
      } catch {
        /* ignore: fall back to metadata-derived tier */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id, api]);

  const consumeDownload = useCallback(async (): Promise<{ ok: boolean; reason?: PaywallReason }> => {
    if (!isSignedIn) return { ok: false };
    if (isPro) return { ok: true };
    const res = await api("/api/consume-download");
    if (res.status === 402) return { ok: false, reason: "limit" };
    if (!res.ok) return { ok: false };
    try {
      const r = await api("/api/entitlements");
      if (r.ok) setServerEnt(await r.json());
    } catch {
      /* ignore */
    }
    return { ok: true };
  }, [api, isSignedIn, isPro]);

  const upgrade = useCallback(
    async (plan: Plan) => {
      const res = await api("/api/create-checkout", { plan });
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    },
    [api],
  );

  const manageBilling = useCallback(async () => {
    const res = await api("/api/create-portal");
    const { url } = (await res.json()) as { url?: string };
    if (url) window.location.href = url;
  }, [api]);

  const value: Entitlements = useMemo(
    () => ({
      loaded: isLoaded,
      status,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      isPro,
      downloadsLeft,
      freeLimit: FREE_LIMIT,
      pendingExport,
      requireSignIn,
      signOut: () => void clerk.signOut(),
      openPaywall,
      closeModals: () => setPaywallOpen(false),
      consumeDownload,
      upgrade,
      manageBilling,
      clearPendingExport: () => setPendingExport(null),
    }),
    [
      isLoaded,
      status,
      user,
      isPro,
      downloadsLeft,
      pendingExport,
      requireSignIn,
      openPaywall,
      consumeDownload,
      upgrade,
      manageBilling,
      clerk,
    ],
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason={paywallReason}
        onUpgrade={upgrade}
      />
    </EntitlementsContext.Provider>
  );
}
