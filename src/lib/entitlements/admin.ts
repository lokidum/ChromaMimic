/* Client-side admin check, used only by the MOCK provider (dev/preview).
   In production the Clerk provider gets admin status from /api/entitlements,
   which reads the server-only ADMIN_EMAILS — so admin emails are never shipped
   in the client bundle. VITE_ADMIN_EMAILS is a dev convenience only. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
