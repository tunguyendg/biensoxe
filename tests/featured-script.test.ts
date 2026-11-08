// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HIDE_EXPIRED_SCRIPT } from '../src/lib/featured';

describe('expiry script in the browser (jsdom)', () => {
  const run = () => new Function(HIDE_EXPIRED_SCRIPT)();
  const page = (ends: (string | null)[]) => {
    document.body.innerHTML = `<aside class="featured"><ul>${ends.map((e) => `<li class="feat"${e ? ` data-end="${e}"` : ''}>x</li>`).join('')}</ul></aside>`;
    return { box: document.querySelector('.featured') as HTMLElement, items: [...document.querySelectorAll<HTMLElement>('.feat')] };
  };
  beforeEach(() => vi.useRealTimers());

  it('hides banners whose end has passed (by the browser clock) and keeps the others', () => {
    vi.useFakeTimers({ now: new Date('2026-11-12T00:00:01+07:00') });
    const { box, items } = page(['2026-11-12T00:00:00+07:00', '2026-11-13T00:00:00+07:00', null]);
    run();
    expect(items.map((i) => i.hidden)).toEqual([true, false, false]);
    expect(box.hidden).toBe(false);
  });
  it('hides the whole area (no empty gap) when every banner has expired', () => {
    vi.useFakeTimers({ now: new Date('2026-11-12T00:00:01+07:00') });
    const { box, items } = page(['2026-11-12T00:00:00+07:00', '2026-11-11T00:00:00+07:00']);
    run();
    expect(items.every((i) => i.hidden)).toBe(true);
    expect(box.hidden).toBe(true);
  });
  it('before the end nothing is hidden; an item without data-end never expires', () => {
    vi.useFakeTimers({ now: new Date('2026-11-11T12:00:00+07:00') });
    const a = page(['2026-11-12T00:00:00+07:00']);
    run();
    expect(a.items[0]?.hidden).toBe(false);
    expect(a.box.hidden).toBe(false);
    vi.setSystemTime(new Date('2035-01-01T00:00:00Z'));
    const b = page([null]);
    run();
    expect(b.items[0]?.hidden).toBe(false);
  });
});
