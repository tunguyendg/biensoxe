/** '2025-07-01' → '01/07/2025' */
export function formatDate(iso: string): string {
  return iso.split('-').reverse().join('/');
}
