/* Shared helpers for the Vercel serverless functions (Clerk + Stripe).
   These run on Vercel's Node runtime, separate from the Vite SPA bundle. */
import type { VercelRequest } from "@vercel/node";
import { createClerkClient, verifyToken } from "@clerk/backend";
import Stripe from "stripe";

export const FREE_LIMIT = 3;

export const periodNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

export const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// apiVersion left unset to use the account default (avoids type-literal drift).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const APP_URL = process.env.APP_URL || "https://chromamimic.com";

/** Owner/admin allowlist: these emails are always Pro, no Stripe required.
   Set ADMIN_EMAILS to a comma-separated list in the server environment. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Resolve a Clerk user's primary email. */
export function primaryEmail(user: {
  emailAddresses?: { id: string; emailAddress: string }[];
  primaryEmailAddressId?: string | null;
}): string | null {
  const list = user.emailAddresses ?? [];
  return (
    list.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    list[0]?.emailAddress ??
    null
  );
}

/** Verify the Clerk session token from the Authorization header. */
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export type PublicMeta = {
  tier?: "free" | "pro";
  downloadsUsed?: number;
  periodKey?: string;
  subscriptionStatus?: string;
};
export type PrivateMeta = { stripeCustomerId?: string };

/** Read the raw request body (needed for Stripe signature verification). */
export async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}
