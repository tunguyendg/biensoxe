import { getViewState } from '../lib/view';
import { renderResult } from '../lib/result-html';

const out = document.querySelector<HTMLElement>('#nf-result');
const input = document.querySelector<HTMLInputElement>('#plate-input');
const form = document.querySelector<HTMLFormElement>('#search-form');

if (out && input && form) {
  // /13 → friendly "code not issued" message instead of a bare 404.
  const m = /^\/(\d{2})\/?$/.exec(location.pathname);
  if (m) out.innerHTML = renderResult(getViewState(m[1] as string));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = getViewState(input.value);
    if (s.kind === 'result' && s.result.kind !== 'unknown') location.assign(`/${s.result.code}`);
    else out.innerHTML = renderResult(s.kind === 'hint' ? { kind: 'invalid' } : s);
  });
}
