/* POST /api/stripe-webhook
   The ONLY thing that grants/revokes Pro. Verifies the Stripe signature, then
   writes tier to Clerk publicMetadata based on subscription status. Idempotent:
   it always sets tier from the current status, so replays are harmless. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { clerk, rawBody, stripe, type PublicMeta, type PrivateMeta } from "./_lib.js";

// Stripe needs the raw body; disable Vercel's body parser.
export const config = { api: { bodyParser: false } };

const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

async function resolveClerkUserId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.clerkUserId) return sub.metadata.clerkUserId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted && customer.metadata?.clerkUserId) return customer.metadata.clerkUserId;
  return null;
}

async function setTier(userId: string, tier: "free" | "pro", status: string, customerId?: string) {
  const user = await clerk.users.getUser(userId);
  const pub = (user.publicMetadata ?? {}) as PublicMeta;
  const priv = (user.privateMetadata ?? {}) as PrivateMeta;
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { ...pub, tier, subscriptionStatus: status },
    privateMetadata: customerId ? { ...priv, stripeCustomerId: customerId } : priv,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  let event: Stripe.Event;
  try {
    const body = await rawBody(req);
    const sig = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook signature failed: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        if (userId) await setTier(userId, "pro", "active", customerId);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveClerkUserId(sub);
        if (userId) {
          const tier =
            event.type === "customer.subscription.deleted" || !PRO_STATUSES.has(sub.status)
              ? "free"
              : "pro";
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          await setTier(userId, tier, sub.status, customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // log and 500 so Stripe retries
    console.error("webhook handler error", err);
    return res.status(500).json({ error: "handler failed" });
  }

  return res.status(200).json({ received: true });
}
