// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const MARKUP = `
<form id="search-form"><input id="plate-input" /></form>
<div id="plate" class="plate plate--ghost"><span id="plate-text">83</span></div>
<div id="result" aria-live="polite"><p class="hint">Nhập 2 số đầu của biển, ví dụ 83.</p></div>`;

async function boot(opts: { desktop: boolean; search?: string }) {
  vi.resetModules();
  document.body.innerHTML = MARKUP;
  window.history.replaceState({}, '', `/${opts.search ?? ''}`);
  vi.stubGlobal('matchMedia', () => ({ matches: opts.desktop }));
  await import('../src/scripts/search');
  const input = document.querySelector<HTMLInputElement>('#plate-input') as HTMLInputElement;
  const out = document.querySelector('#result') as HTMLElement;
  const type = (v: string) => {
    input.value = v;
    input.dispatchEvent(new Event('input'));
  };
  return { input, out, type, plate: document.querySelector('#plate-text') as HTMLElement };
}

describe('search UI', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('0–1 digits show a neutral hint, no error', async () => {
    const { out, type } = await boot({ desktop: true });
    type('8');
    expect(out.textContent).toContain('Nhập 2 số đầu');
    expect(out.querySelector('.note')).toBeNull();
  });

  it('shows the province, former name and sibling chips as soon as 2 digits are typed', async () => {
    const { out, type, plate } = await boot({ desktop: true });
    type('83');
    expect(out.querySelector('h2')?.textContent).toBe('Cần Thơ');
    expect(out.querySelector('.former')?.textContent).toBe('Trước 01/07/2025: Sóc Trăng');
    expect(out.querySelectorAll('.chip').length).toBeGreaterThan(0);
    expect(out.textContent).toContain('Không cho biết chủ xe là ai');
    expect(out.textContent).toContain('Nguồn:');
    expect(out.querySelector('.share button')).not.toBeNull();
    expect(plate.textContent).toBe('83');
  });

  it('does not re-render while typing more of the same plate (no flicker)', async () => {
    const { out, type } = await boot({ desktop: true });
    type('83');
    const h2 = out.querySelector('h2');
    type('83A-123.45');
    expect(out.querySelector('h2')).toBe(h2);
  });

  it('unknown code is informational (not an error) and links to /bang-ma', async () => {
    const { out, type } = await boot({ desktop: true });
    type('13');
    const note = out.querySelector('.note');
    expect(note?.textContent).toContain('Mã 13 chưa được cấp cho tỉnh nào');
    expect(note?.querySelector('a')?.getAttribute('href')).toBe('/bang-ma');
  });

  it('special code 80, letters-first, and clearly invalid input', async () => {
    const { out, type } = await boot({ desktop: true });
    type('80');
    expect(out.textContent).toContain('Cục Cảnh sát giao thông');
    type('NG 12');
    expect(out.textContent).toContain('không đoán tỉnh');
    type('!!');
    expect(out.textContent).toContain('Chưa nhận ra mã biển');
  });

  it('deleting back to 1 digit returns to the hint', async () => {
    const { out, type } = await boot({ desktop: true });
    type('83');
    type('8');
    expect(out.querySelector('.hint')).not.toBeNull();
  });

  it('auto-focuses on desktop only', async () => {
    const d = await boot({ desktop: true });
    expect(document.activeElement).toBe(d.input);
    (document.activeElement as HTMLElement).blur();
    const m = await boot({ desktop: false });
    expect(document.activeElement).not.toBe(m.input);
  });

  it('prefills from ?q= (shared link)', async () => {
    const { out } = await boot({ desktop: false, search: '?q=83' });
    expect(out.querySelector('h2')?.textContent).toBe('Cần Thơ');
  });

  it('Enter (submit) keeps the live result and does not navigate', async () => {
    const { out, type } = await boot({ desktop: true });
    type('61');
    const ev = new Event('submit', { cancelable: true });
    (document.querySelector('#search-form') as HTMLElement).dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(out.querySelector('h2')?.textContent).toContain('Hồ Chí Minh');
  });

  it('share falls back to copying the link', async () => {
    const { out, type } = await boot({ desktop: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    type('83');
    (out.querySelector('.share button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/?q=83')));
    await vi.waitFor(() => expect(out.querySelector('.share-status')?.textContent).toBe('Đã sao chép liên kết'));
  });

  it('share uses the Web Share API when available', async () => {
    const { out, type } = await boot({ desktop: true });
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    type('83');
    (out.querySelector('.share button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(share).toHaveBeenCalled());
  });
});
