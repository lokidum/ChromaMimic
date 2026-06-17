/* POST /api/create-portal
   Returns a Stripe Customer Portal URL so users self-serve billing (update card,
   cancel) without us building billing UI. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { APP_URL, clerk, getUserId, stripe, type PrivateMeta } from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  const user = await clerk.users.getUser(userId);
  const priv = (user.privateMetadata ?? {}) as PrivateMeta;
  if (!priv.stripeCustomerId) return res.status(400).json({ error: "no stripe customer" });

  const session = await stripe.billingPortal.sessions.create({
    customer: priv.stripeCustomerId,
    return_url: `${APP_URL}/#pricing`,
  });

  return res.status(200).json({ url: session.url });
}
