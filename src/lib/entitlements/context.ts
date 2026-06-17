import { createContext, useContext } from "react";
import type { Entitlements } from "./types";

export const EntitlementsContext = createContext<Entitlements | null>(null);

export function useEntitlements(): Entitlements {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within an EntitlementsProvider");
  return ctx;
}
