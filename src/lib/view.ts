import { lookup, type LookupResult } from './lookup';
import { parsePlate } from './parse';

/** What the result area should show for a given input. Pure, no DOM. */
export type ViewState =
  | { kind: 'hint' } // empty or still typing the first digit: neutral, never an error
  | { kind: 'letters' } // letters-first plate: we never guess a province
  | { kind: 'invalid' } // clearly wrong input
  | { kind: 'result'; result: LookupResult };

const SINGLE_DIGIT = /^[\s.\-_]*\d[\s.\-_]*$/u;

export function getViewState(input: string): ViewState {
  const p = parsePlate(input);
  if (p.kind === 'empty') return { kind: 'hint' };
  if (p.kind === 'letters') return { kind: 'letters' };
  if (p.kind === 'code') return { kind: 'result', result: lookup(p.code as string) };
  // invalid: one digit is just "still typing"; anything else is genuinely unusable
  return SINGLE_DIGIT.test(input.normalize('NFKC')) ? { kind: 'hint' } : { kind: 'invalid' };
}

/** Changes only when the *kind of content* changes, so typing more of the same plate never re-renders. */
export function stateKey(s: ViewState): string {
  return s.kind === 'result' ? `result:${s.result.code}` : s.kind;
}

/** Text drawn on the decorative plate: uppercase, safe characters only, max 12 chars. */
export function plateText(input: string): string {
  return input
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^\p{L}\d.\- ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
}
