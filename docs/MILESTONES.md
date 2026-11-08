# Milestones — each one is small, independently verifiable, and ends with `npm run verify` + a PROGRESS.md entry

Implementation details are Claude Code's call. The criteria below are what "done" means.

## M1 — Skeleton + data contract
- Scaffold Astro (static), TS strict, ESLint, Vitest. Add `verify` script.
- Type the data (`src/lib/data.ts`) and load `data/plate-codes.json`.
- Integrity tests:
  - 81 unique codes;
  - 34 provinces + 1 special code;
  - each province code exists and points back to its province;
  - 63 distinct former units;
  - no empty names.
- `BIEN_SO_STRICT=1 npm run build` fails while any record has `verified:false`. A normal build passes and shows a visible "DỮ LIỆU NHÁP" banner.

**Done when:** `npm run verify` passes, integrity tests fail if you corrupt one record (prove it once, then revert), and the strict build fails as intended.

## M2 — Parser + lookup core (pure functions, no UI)
- `parsePlate(input)` → `{ kind: 'code' | 'letters' | 'empty' | 'invalid', code?, raw }`.
- `lookup(code)` → current province, former province, sibling codes, special/unknown.
- Table-driven tests:
  - every one of the 81 codes;
  - ≥ 15 input formats from CLAUDE.md;
  - NG/NN/QT;
  - military-style letters;
  - unknown codes 13/42/87;
  - garbage, emoji, full-width digits.

**Done when:** 100% branch coverage on the parser and lookup modules.

## M3 — Home search experience (the product)
- One input:
  - auto-focus on desktop only;
  - `inputmode` tuned for mobile;
  - result appears as soon as 2 digits are typed (no submit needed); Enter also works.
- Result card, in this order:
  1. plate-style rendering of the input (CSS/SVG);
  2. current province, large;
  3. "Trước 01/07/2025: …" when different;
  4. sibling code chips (links to `/[code]`);
  5. the limits line;
  6. source + data date;
  7. Share button (Web Share API → copy-link fallback).
- States: unknown code, letters-first plates, special code 80.
- No layout shift. Works with JS off via a link to `/bang-ma`.
- Below the fold:
  - "Các mã hay bị nhầm sau sáp nhập" (e.g. 61, 72, 83, 92, 93, 34);
  - link to the full table.

**Done when:**
- result is visible at 360×640;
- touch targets ≥ 44px;
- lookup JS ≤ 15 KB gzip (measure and report);
- Founder visual review requested.

## M4 — Static pages + SEO
- `/[code]` (81 pages): same card as home + short explanation + the other codes of the province.
  - Title pattern: "Biển số 83 là tỉnh nào? Cần Thơ (trước là Sóc Trăng)".
- `/tinh/[slug]` (34 pages): codes list + former provinces merged in + one plain sentence about the merger.
- `/bang-ma`: full table grouped by region (Bắc / Trung & Tây Nguyên / Nam), client-side filter, readable on mobile (no wide table; cards or 2-column rows).
- `/nguon`:
  - legal basis with dates;
  - what a plate does and does not tell you;
  - 4–6 FAQ answers drawn only from `data/SOURCES.md`;
  - "independent site" statement;
  - data review date.
- `404`, `sitemap.xml`, `robots.txt`, canonical URLs, OG/Twitter meta, one OG image per code generated at build (simple plate graphic + province), JSON-LD (FAQPage on `/nguon`, BreadcrumbList on detail pages).
- Build smoke test: expected page count, sitemap lists every page, every code page contains the limits line.

**Done when:** `npm run verify` passes and the page count is 81 + 34 + home + bang-ma + nguon + 404.

## M4b — Richer result card + affiliate offers
**A. Province data (single source: NQ 202/2025/QH15)**
- Add to `provinces[]`: `adminCenter`, `areaKm2`, `population`, `mergedFrom` (all former units incl. the one that kept the name; `[]` if unchanged). Read from the NQ 202 PDF only; anything the PDF does not state stays `null` and goes to open questions. Keep `verified:false`.
- Update `data/SOURCES.md`; integrity tests: all 34 provinces have every field; `mergedFrom` equals the distinct `formerProvince` of the province's codes.

**B. Result card (home and `/[code]`)**
- Under "Trước 01/07/2025": badge "Không thay đổi sau sáp nhập 01/07/2025" when `mergedFrom` is empty, else "Hợp nhất từ: …".
- One small line "Trung tâm hành chính: … · Miền …" (the null part is hidden).
- Area / population only on `/tinh/[slug]`.
- Result still visible at 360×640.

**C. Affiliate**
- `data/offers.json`: `[{id,title,description,url,image?,placements:["result","tinh","code"],active}]`; image ≤ 40 KB webp in `public/offers/`. Ship 4 samples with `active:false`, url "TODO".
- `OfferCards` component: ≤ 2 cards per page, **below** the result card and below the main content of `/tinh` and `/[code]`. Never on `/nguon` or `/404`. Label "Liên kết tiếp thị — BIEN SO có thể nhận hoa hồng." Links `target="_blank" rel="sponsored noopener"`. Lazy images with fixed width/height. No third-party scripts.
- Tests: inactive or "TODO" offers never render; `/nguon` has no offers; build fails if an active offer has a non-https url. No license-plate frames/covers.

**Done when:** `npm run verify` passes; lookup JS ≤ 15 KB gzip.

## M4c — Shopee category cards (ACCESSTRADE), replaces M4b offers
Does **not** block launch: with no valid offer the whole affiliate area is hidden and the site builds/runs normally.
- `data/offers.config.json` (Founder-editable): 4 categories `{id,title,blurb ≤ 60 chars,keyword,active}`; placements fixed: `result` (home + `/[code]`) and `tinh` (`/tinh/[slug]`).
- `npm run offers:links` (Founder's machine only, token in `.env`): creates `aff_link`s via ACCESSTRADE `product_link/create`, writes `data/offers.json`; any failure keeps the old file, exit ≠ 0. `npm run offers:check` (no token): follows redirects, confirms final host is Shopee, stamps `checkedAt` + `status`.
- Render only offers that are `ok`, `active`, `checkedAt` ≤ 30 days at build; ≤ 2 cards/page chosen deterministically per page; static HTML, no JS, no prices/images/vouchers; never on `/nguon`, `/bang-ma`, `/404`.
- Privacy: after a lookup the home URL becomes `/{code}` (no `?q=` with a full plate); no plate/code in any sub/utm.
- Tests use a mocked fetch; no real API, no real `.env`; `dist/` and `data/` never contain the token or "Authorization".
- `docs/AFFILIATE.md` (≤ 40 lines).

**Done when:** `npm run verify` passes; lookup JS grows ≤ 0.5 KB gzip; `data/offers.json` is `[]` in the commit.

## M5 — Polish + launch readiness (no deploy)
- Dark mode (system); Vietnamese font with full diacritics (self-hosted, subset); favicon + manifest icons.
- Cloudflare Web Analytics snippet behind an env var (off locally).
- Optional, only if time and sources are verified: a "Đọc hiểu biển số" section (series letters, plate colours) **citing Điều 37 TT 79/2024/TT-BCA**. Skip it rather than guess.
- Write `docs/LAUNCH.md`: exact Cloudflare Pages settings (build cmd, output dir, env vars), Search Console steps, and the Founder data-verification procedure.

**Done when:** strict build is the only failing gate (blocked solely on `verified:false`), and the launch checklist in PRODUCT_BRIEF §7 is reproduced as a to-do list in `docs/LAUNCH.md`.

## After the Founder verifies the data
Founder approves → set `verified:true` → strict build passes → Founder approves push + Cloudflare Pages deploy.
