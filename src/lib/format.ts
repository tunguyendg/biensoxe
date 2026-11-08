/** '2025-07-01' → '01/07/2025' */
export function formatDate(iso: string): string {
  return iso.split('-').reverse().join('/');
}

/** Lower-case, diacritics-free text for filtering ("Hà Nội" → "ha noi"). */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/** ['A'] → "A"; ['A','B'] → "A và B"; ['A','B','C'] → "A, B và C". */
export function joinVi(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} và ${items[items.length - 1]}`;
}
