import { plateText, getViewState, stateKey } from '../lib/view';
import { renderResult } from '../lib/result-html';
import './share';

const input = document.querySelector<HTMLInputElement>('#plate-input');
const plate = document.querySelector<HTMLElement>('#plate');
const plateEl = document.querySelector<HTMLElement>('#plate-text');
const out = document.querySelector<HTMLElement>('#result');
const form = document.querySelector<HTMLFormElement>('#search-form');

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
    // Privacy: never keep the typed plate in the address bar. Show only the 2-digit code of a known result.
    history.replaceState(null, '', state.kind === 'result' && state.result.kind !== 'unknown' ? `/${state.result.code}` : '/');
    out.innerHTML = renderResult(state);
    out.classList.remove('is-entering');
    void out.offsetWidth; // restart the fade-in
    out.classList.add('is-entering');
  };

  input.addEventListener('input', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // result is already live; Enter just confirms
    update();
  });

  // Old shared links (?q=…) still work, then the query is dropped from the URL.
  const q = new URLSearchParams(location.search).get('q');
  if (q !== null) {
    input.value = q.slice(0, 20);
    history.replaceState(null, '', '/');
  }
  update();

  // Desktop only: on phones the keyboard would cover the screen the moment the page opens.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) input.focus();
}
