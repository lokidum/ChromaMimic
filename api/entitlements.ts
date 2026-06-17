/* POST /api/entitlements
   Returns the caller's effective entitlements, computed server-side so the
   client never needs to know who the admins are. Admin emails (ADMIN_EMAILS)
   are always Pro and are promoted in Clerk metadata on first call. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  clerk,
  getUserId,
  isAdminEmail,
  primaryEmail,
  FREE_LIMIT,
  periodNow,
  type PublicMeta,
} from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  const user = await clerk.users.getUser(userId);
  const meta = (user.publicMetadata ?? {}) as PublicMeta;
  const admin = isAdminEmail(primaryEmail(user));

  // promote admins to pro in metadata once, so all other paths see them as pro
  if (admin && meta.tier !== "pro") {
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { ...meta, tier: "pro", subscriptionStatus: "admin" },
    });
  }

  const tier = admin || meta.tier === "pro" ? "pro" : "free";
  const used = meta.periodKey === periodNow() ? meta.downloadsUsed ?? 0 : 0;
  const downloadsLeft = tier === "pro" ? -1 : Math.max(0, FREE_LIMIT - used);

  return res.status(200).json({ tier, downloadsLeft, isAdmin: admin });
}
