// Share button (Web Share API → copy-link fallback). Delegated, so it also works for
// buttons the home search renders later. Shares /{code} only — never the typed plate.
document.addEventListener('click', async (e) => {
  const btn = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-share]');
  if (!btn) return;
  const status = btn.parentElement?.querySelector<HTMLElement>('.share-status');
  const title = btn.dataset.title ?? '';
  const url = `${location.origin}/${btn.dataset.code ?? ''}`;
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, text: title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    if (status) status.textContent = 'Đã sao chép liên kết';
  } catch (err) {
    if ((err as DOMException).name === 'AbortError') return; // user closed the share sheet
    if (status) status.textContent = 'Không chia sẻ được. Hãy sao chép địa chỉ trang.';
  }
});
