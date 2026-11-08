import { mergeBadge, metaLine } from '../lib/card';
import { data } from '../lib/data';
import { formatDate } from '../lib/format';
import { getViewState, plateText, stateKey, type ViewState } from '../lib/view';

const input = document.querySelector<HTMLInputElement>('#plate-input');
const plate = document.querySelector<HTMLElement>('#plate');
const plateEl = document.querySelector<HTMLElement>('#plate-text');
const out = document.querySelector<HTMLElement>('#result');
const form = document.querySelector<HTMLFormElement>('#search-form');

type Child = Node | string | null | false;
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c);
  return el;
}

const LIMITS =
  'Mã biển số chỉ cho biết tỉnh/thành theo bảng mã. Không cho biết chủ xe là ai, hiện ở đâu, thuộc phường/xã nào, hay tình trạng của xe.';

function footer(): Node[] {
  const { dataVersion, lastReviewed } = data.meta;
  return [
    h('p', { class: 'limits' }, LIMITS),
    h(
      'p',
      { class: 'source' },
      `Nguồn: Phụ lục 02 TT 51/2025/TT-BCA · bảng mã hiệu lực từ ${formatDate(dataVersion)} · kiểm tra lần cuối ${formatDate(lastReviewed)}. `,
      h('a', { href: '/nguon' }, 'Nguồn & giới hạn'),
    ),
  ];
}

function shareButton(title: string, code: string): HTMLElement {
  const status = h('span', { class: 'share-status', role: 'status' });
  const btn = h('button', { type: 'button', class: 'btn' }, 'Chia sẻ kết quả');
  btn.addEventListener('click', async () => {
    const url = `${location.origin}/?q=${encodeURIComponent(code)}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      status.textContent = 'Đã sao chép liên kết';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return; // user closed the share sheet
      status.textContent = 'Không chia sẻ được. Hãy sao chép địa chỉ trang.';
    }
  });
  return h('div', { class: 'share' }, btn, status);
}

function render(s: ViewState): Child[] {
  switch (s.kind) {
    case 'hint':
      return [h('p', { class: 'hint' }, 'Nhập 2 số đầu của biển, ví dụ 83.')];
    case 'letters':
      return [
        h('p', { class: 'note' }, 'Biển bắt đầu bằng chữ cái không tra được theo 2 số đầu, và trang này không đoán tỉnh. Nếu biển có 2 số đầu, hãy nhập 2 số đó.'),
      ];
    case 'invalid':
      return [
        h('p', { class: 'note' }, 'Chưa nhận ra mã biển. Hãy nhập 2 chữ số đầu của biển, ví dụ 83.'),
      ];
    case 'result': {
      const r = s.result;
      if (r.kind === 'unknown') {
        return [
          h('p', { class: 'note note--info' }, `Mã ${r.code} chưa được cấp cho tỉnh nào. `, h('a', { href: '/bang-ma' }, 'Xem bảng mã đầy đủ')),
          ...footer(),
        ];
      }
      if (r.kind === 'special') {
        return [
          h('p', { class: 'lead' }, `Mã ${r.code} không gắn với tỉnh hay thành phố nào`),
          h('h2', { class: 'province' }, r.label),
          ...footer(),
          shareButton(`Mã biển số ${r.code}: ${r.label}`, r.code),
        ];
      }
      const name = r.province.name;
      const badge = mergeBadge(r.province);
      const formerLine = r.changed ? `Trước ${formatDate(data.meta.dataVersion)}: ${r.former}` : null;
      return [
        h('p', { class: 'lead' }, `Biển ${r.code} là xe đăng ký tại`),
        h('h2', { class: 'province' }, name),
        formerLine && h('p', { class: 'former' }, formerLine),
        h('p', { class: badge.merged ? 'badge badge--merged' : 'badge' }, badge.text),
        h('p', { class: 'meta' }, metaLine(r.province)),
        r.siblings.length > 0 &&
          h(
            'div',
            { class: 'siblings' },
            h('p', { class: 'siblings__label' }, `Các mã khác của ${name}:`),
            h('ul', { class: 'chips' }, ...r.siblings.map((c) => h('li', {}, h('a', { class: 'chip', href: `/${c}` }, c)))),
          ),
        ...footer(),
        shareButton(`Biển số ${r.code} là ${name}${formerLine ? ` (${formerLine.toLowerCase()})` : ''}`, r.code),
      ];
    }
  }
}

if (input && plate && plateEl && out && form) {
  let lastKey = 'hint'; // server-rendered markup is the hint state

  const update = () => {
    const text = plateText(input.value);
    plateEl.textContent = text || '83';
    plate.classList.toggle('plate--ghost', text === '');

    const state = getViewState(input.value);
    const key = stateKey(state);
    if (key === lastKey) return;
    lastKey = key;
    out.replaceChildren(...render(state).filter((c): c is Node | string => !!c));
    out.classList.remove('is-entering');
    void out.offsetWidth; // restart the fade-in
    out.classList.add('is-entering');
  };

  input.addEventListener('input', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // result is already live; Enter just confirms
    update();
  });

  const q = new URLSearchParams(location.search).get('q');
  if (q) input.value = q.slice(0, 20);
  update();

  // Desktop only: on phones the keyboard would cover the screen the moment the page opens.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) input.focus();
}
