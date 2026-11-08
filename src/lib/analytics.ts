/** Cloudflare Web Analytics beacon. No token → no script at all. */
export function analyticsScript(token: string | undefined): { src: string; beacon: string } | null {
  const t = token?.trim();
  if (!t) return null;
  return { src: 'https://static.cloudflareinsights.com/beacon.min.js', beacon: JSON.stringify({ token: t }) };
}
