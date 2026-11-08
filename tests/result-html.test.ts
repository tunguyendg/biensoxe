import { describe, expect, it } from 'vitest';
import { DRAFT_NOTE, LIMITS } from '../src/lib/copy';
import { data, isDraft, robotsContent } from '../src/lib/data';
import { esc, footerHtml, renderResult } from '../src/lib/result-html';
import { getViewState } from '../src/lib/view';

const html = (input: string) => renderResult(getViewState(input));

describe('renderResult (the single result-card renderer)', () => {
  it('hint / letters / invalid states', () => {
    expect(html('')).toBe('<p class="hint">Nhập 2 số đầu của biển, ví dụ 83.</p>');
    expect(html('NG')).toContain('không đoán tỉnh');
    expect(html('!!')).toContain('Chưa nhận ra mã biển');
  });

  it('merged province with a changed former name: lead, h2, former, badge, meta, chips, limits, source, share', () => {
    const h = html('83');
    expect(h).toContain('<p class="lead">Biển 83 là xe đăng ký tại</p>');
    expect(h).toContain('<h2 class="province">Cần Thơ</h2>');
    expect(h).toContain('<p class="former">Trước 01/07/2025: Sóc Trăng</p>');
    expect(h).toContain('badge badge--merged">Hợp nhất từ: Cần Thơ, Sóc Trăng, Hậu Giang');
    expect(h).toContain('<p class="meta">Miền Nam</p>');
    expect(h).toContain('<a class="chip" href="/65" aria-label="Biển số 65, Cần Thơ">65</a>');
    expect(h).toContain(LIMITS);
    expect(h).toContain('Nguồn: Phụ lục 02 TT 51/2025/TT-BCA');
    expect(h).toContain('data-share data-code="83"');
    // order: former → badge → meta → siblings → limits → share
    const order = ['class="former"', 'class="badge', 'class="meta"', 'class="siblings"', 'class="limits"', 'data-share'].map((k) => h.indexOf(k));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i >= 0)).toBe(true);
  });

  it('merged province whose name did not change has no "Trước…" line but still has the badge', () => {
    const h = html('65');
    expect(h).not.toContain('class="former"');
    expect(h).toContain('Hợp nhất từ:');
  });

  it('unchanged province without siblings: no former, no chips, "Không thay đổi" badge', () => {
    const h = html('14');
    expect(h).toContain('Không thay đổi sau sáp nhập 01/07/2025');
    expect(h).not.toContain('class="siblings"');
    expect(h).not.toContain('class="former"');
  });

  it('special code 80', () => {
    const h = html('80');
    expect(h).toContain('Mã 80 không gắn với tỉnh hay thành phố nào');
    expect(h).toContain('Cục Cảnh sát giao thông');
    expect(h).toContain('data-share data-code="80"');
  });

  it('unknown code is an informational note with limits + source but no share button', () => {
    const h = html('13');
    expect(h).toContain('note note--info');
    expect(h).toContain('Mã 13 chưa được cấp cho tỉnh nào');
    expect(h).toContain('href="/bang-ma"');
    expect(h).toContain(LIMITS);
    expect(h).not.toContain('data-share');
  });

  it('every internal link is /{2 digits}, /bang-ma or /nguon', () => {
    for (const code of ['83', '61', '29', '80', '13']) {
      for (const m of html(code).matchAll(/href="([^"]+)"/g)) expect(m[1]).toMatch(/^\/(\d{2}|bang-ma|nguon)$/);
    }
  });

  it('escapes HTML', () => {
    expect(esc(`<a href="x">&'</a>`)).toBe('&#60;a href=&#34;x&#34;&#62;&#38;&#39;&#60;/a&#62;');
    expect(footerHtml()).toContain(LIMITS);
  });

  it('draft note: shown at the END of the source line while any record is unverified, gone when all are verified', () => {
    expect(isDraft()).toBe(true);
    const draft = footerHtml(); // default = the real data (still draft)
    expect(draft).toContain('<span class="draft-note"> · đang đối chiếu bản gốc</span></p>');
    expect(DRAFT_NOTE).toBe(' · đang đối chiếu bản gốc');
    expect(html('83')).toContain('draft-note');
    expect(footerHtml(false)).not.toContain('draft-note');
    expect(footerHtml(false)).not.toContain('đối chiếu');
    // the note comes after the "Nguồn & giới hạn" link, inside the same paragraph
    expect(draft.indexOf('Nguồn &amp; giới hạn')).toBeLessThan(draft.indexOf('draft-note'));
  });

  it('noindex goes away together with the note once everything is verified', () => {
    const all = structuredClone(data);
    all.provinces.forEach((p) => (p.verified = true));
    all.codes.forEach((c) => (c.verified = true));
    expect(robotsContent(isDraft())).toBe('noindex,follow');
    expect(robotsContent(isDraft(all))).toBe('index,follow');
    expect(footerHtml(isDraft(all))).not.toContain('draft-note');
    expect(robotsContent()).toBe('noindex,follow');
  });
});
