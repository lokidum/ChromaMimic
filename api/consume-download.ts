/* POST /api/consume-download
   Spends one monthly free download. Pro users always pass. Returns 402 when the
   free allowance is exhausted. Tier + counter live in Clerk publicMetadata. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clerk, getUserId, FREE_LIMIT, periodNow, type PublicMeta } from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  const user = await clerk.users.getUser(userId);
  const meta = (user.publicMetadata ?? {}) as PublicMeta;

  if (meta.tier === "pro") return res.status(200).json({ ok: true, tier: "pro" });

  const used = meta.periodKey === periodNow() ? meta.downloadsUsed ?? 0 : 0;
  if (used >= FREE_LIMIT) {
    return res.status(402).json({ ok: false, reason: "limit", downloadsLeft: 0 });
  }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { ...meta, tier: "free", downloadsUsed: used + 1, periodKey: periodNow() },
  });

  return res.status(200).json({ ok: true, downloadsLeft: FREE_LIMIT - (used + 1) });
}
