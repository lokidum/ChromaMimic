/* POST /api/create-checkout  { plan: "monthly" | "annual" }
   Creates a Stripe Checkout session (subscription, 7-day trial) and returns the
   hosted checkout URL. Links the Stripe customer to the Clerk user both ways. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  APP_URL,
  clerk,
  getUserId,
  stripe,
  type PrivateMeta,
} from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  const plan = (req.body?.plan as string) === "monthly" ? "monthly" : "annual";
  const price =
    plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY! : process.env.STRIPE_PRICE_ANNUAL!;

  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;
  const priv = (user.privateMetadata ?? {}) as PrivateMeta;

  // reuse or create the Stripe customer, tagged with the Clerk user id
  let customerId = priv.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    await clerk.users.updateUserMetadata(userId, {
      privateMetadata: { ...priv, stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { trial_period_days: 7, metadata: { clerkUserId: userId } },
    allow_promotion_codes: true,
    success_url: `${APP_URL}/?upgraded=1#tool`,
    cancel_url: `${APP_URL}/#pricing`,
  });

  return res.status(200).json({ url: session.url });
}
