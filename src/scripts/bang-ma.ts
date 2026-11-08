import { foldText } from '../lib/format';
import { parsePlate } from '../lib/parse';

const input = document.querySelector<HTMLInputElement>('#filter-input');
const count = document.querySelector<HTMLElement>('#filter-count');
const empty = document.querySelector<HTMLElement>('#filter-empty');
const rows = [...document.querySelectorAll<HTMLElement>('[data-q]')];
const groups = [...document.querySelectorAll<HTMLElement>('[data-group]')];

if (input && count && empty) {
  const apply = () => {
    const raw = input.value;
    const p = parsePlate(raw);
    const needle = foldText(raw);
    let shown = 0;
    for (const r of rows) {
      const hit = needle === '' || (p.kind === 'code' ? r.dataset.code === p.code : (r.dataset.q ?? '').includes(needle));
      r.hidden = !hit;
      if (hit) shown++;
    }
    for (const g of groups) g.hidden = g.querySelector('[data-q]:not([hidden])') === null;
    empty.hidden = shown > 0;
    count.textContent = needle === '' ? '' : `Hiển thị ${shown} mã`;
  };
  input.addEventListener('input', apply);
  input.form?.addEventListener('submit', (e) => e.preventDefault());

  // From the home form without JS-less fallback: /bang-ma?q=… prefills the filter, then the query is dropped.
  const q = new URLSearchParams(location.search).get('q');
  if (q !== null) {
    input.value = q.slice(0, 20);
    history.replaceState(null, '', '/bang-ma');
    apply();
  }
}
