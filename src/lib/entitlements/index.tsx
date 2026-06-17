import { lazy, Suspense, type ReactNode } from "react";
import { MockEntitlementsProvider } from "./MockEntitlementsProvider";

/* Flip to the real Clerk + Stripe backend automatically when a Clerk key is
   present; otherwise run the local mock so the full flow works in dev/preview.
   Clerk is lazy-loaded so it never bloats the mock bundle. */
const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const ClerkEntitlementsProvider = lazy(() =>
  import("./ClerkEntitlementsProvider").then((m) => ({
    default: m.ClerkEntitlementsProvider,
  })),
);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  if (!hasClerk) return <MockEntitlementsProvider>{children}</MockEntitlementsProvider>;
  return (
    <Suspense fallback={null}>
      <ClerkEntitlementsProvider>{children}</ClerkEntitlementsProvider>
    </Suspense>
  );
}

export { useEntitlements } from "./context";
