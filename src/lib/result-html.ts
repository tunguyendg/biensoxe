import { mergeBadge, metaLine } from './card';
import { DRAFT_NOTE, LIMITS, sourceText } from './copy';
import { formatDate } from './format';
import { data, isDraft } from './data';
import type { ViewState } from './view';

/**
 * The single result-card renderer. Used at build time by the static pages
 * (via set:html) and in the browser by the home-page search, so both are identical.
 */
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function footerHtml(draft: boolean = isDraft()): string {
  const note = draft ? `<span class="draft-note">${esc(DRAFT_NOTE)}</span>` : '';
  return `<p class="limits">${esc(LIMITS)}</p><p class="source">${esc(sourceText())} <a href="/nguon">Nguồn &amp; giới hạn</a>${note}</p>`;
}

function shareHtml(title: string, code: string): string {
  return `<div class="share"><button type="button" class="btn" data-share data-code="${esc(code)}" data-title="${esc(title)}">Chia sẻ kết quả</button><span class="share-status" role="status"></span></div>`;
}

export function renderResult(s: ViewState): string {
  switch (s.kind) {
    case 'hint':
      return '<p class="hint">Nhập 2 số đầu của biển, ví dụ 83.</p>';
    case 'letters':
      return '<p class="note">Biển bắt đầu bằng chữ cái không tra được theo 2 số đầu, và trang này không đoán tỉnh. Nếu biển có 2 số đầu, hãy nhập 2 số đó.</p>';
    case 'invalid':
      return '<p class="note">Chưa nhận ra mã biển. Hãy nhập 2 chữ số đầu của biển, ví dụ 83.</p>';
    case 'result': {
      const r = s.result;
      if (r.kind === 'unknown') {
        return `<p class="note note--info">Mã ${esc(r.code)} chưa được cấp cho tỉnh nào. <a href="/bang-ma">Xem bảng mã đầy đủ</a></p>${footerHtml()}`;
      }
      if (r.kind === 'special') {
        return (
          `<p class="lead">Mã ${esc(r.code)} không gắn với tỉnh hay thành phố nào</p>` +
          `<h2 class="province">${esc(r.label)}</h2>` +
          footerHtml() +
          shareHtml(`Mã biển số ${r.code}: ${r.label}`, r.code)
        );
      }
      const name = r.province.name;
      const badge = mergeBadge(r.province);
      const formerLine = r.changed ? `Trước ${formatDate(data.meta.dataVersion)}: ${r.former}` : null;
      const siblings =
        r.siblings.length > 0
          ? `<div class="siblings"><p class="siblings__label">Các mã khác của ${esc(name)}:</p><ul class="chips">${r.siblings
              .map((c) => `<li><a class="chip" href="/${esc(c)}" aria-label="Biển số ${esc(c)}, ${esc(name)}">${esc(c)}</a></li>`)
              .join('')}</ul></div>`
          : '';
      return (
        `<p class="lead">Biển ${esc(r.code)} là xe đăng ký tại</p>` +
        `<h2 class="province">${esc(name)}</h2>` +
        (formerLine ? `<p class="former">${esc(formerLine)}</p>` : '') +
        `<p class="${badge.merged ? 'badge badge--merged' : 'badge'}">${esc(badge.text)}</p>` +
        `<p class="meta">${esc(metaLine(r.province))}</p>` +
        siblings +
        footerHtml() +
        shareHtml(`Biển số ${r.code} là ${name}${formerLine ? ` (${formerLine.toLowerCase()})` : ''}`, r.code)
      );
    }
  }
}
