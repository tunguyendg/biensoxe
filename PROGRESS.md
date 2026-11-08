# PROGRESS — append-only, ≤ 10 lines per entry, newest last

## 2026-11-08 — M0 handoff (claude.ai)
- Done:
  - product brief (`docs/PRODUCT_BRIEF.md`);
  - milestones (`docs/MILESTONES.md`);
  - draft data (`data/plate-codes.json`: 81 codes, 34 provinces, 63 former units, all `verified:false`);
  - sources (`data/SOURCES.md`).
- Decisions: static Astro site, data in JSON, no DB/API/Docker; Cloudflare Pages.
- Open:
  - Founder must check the data against the official Phụ lục 02 of TT 51/2025/TT-BCA;
  - the name used for code 75 (Huế vs Thừa Thiên Huế);
  - whether any rule requires re-plating after the merger.
- Next: M1.

## 2026-11-08 — M1 Skeleton + data contract (Claude Code)
- Done: Astro 7 static + TS strictest + ESLint + Vitest; `src/lib/data.ts` types/loads JSON; 11 tests (integrity + strict gate); `npm run verify` green.
- Strict gate: Astro integration (`astro.config.ts`) calls `assertStrictBuild`; `BIEN_SO_STRICT=1 npm run build` exits non-zero (115 unverified records). Normal build shows "DỮ LIỆU NHÁP" banner + `noindex`.
- Proven once: corrupting a record's `currentProvince` fails 2 integrity tests; reverted.
- Decisions: no UI framework; telemetry off; placeholder home page only (search comes in M3).
- Open: code 75 name (Huế vs Thừa Thiên Huế); re-plating rule; Founder data verification.
- Next: M2 (parser + lookup).

## 2026-11-08 — M2 Parser + lookup core (Claude Code)
- Done: `parsePlate` (`src/lib/parse.ts`) and `lookup` (`src/lib/lookup.ts`, `createLookup(data)`); 148 tests; 100% branch/line/function/statement coverage enforced by `npm test` (vitest thresholds).
- Footer fix: two dates from meta via `formatDate` (`src/lib/format.ts`): "Bảng mã hiệu lực từ 01/07/2025", "Kiểm tra lần cuối 08/11/2026".
- Decisions: full-width digits normalised (NFKC) → valid; single digit → `invalid`; letters-first → `letters` (no guess); lookup returns `province|special|unknown` + `changed` flag + `siblings`.
- Open: dates render as 01/07/2025 (dd/mm/yyyy), not "01/7/2025" — confirm; old M1 questions (code 75, re-plating) unchanged.
- Next: M3 (home search UI).

## 2026-11-08 — M3 Home search experience (Claude Code)
- Done: home page with live lookup (no submit), plate-style render, result card (current → former → sibling chips → limits → source/dates → Share), "mã hay bị nhầm" list + link to /bang-ma. 182 tests incl. jsdom UI tests; view logic in `src/lib/view.ts` (100% coverage).
- UX: 0–1 digit = neutral hint; invalid only for junk/≥2 chars w/o code; unknown code = info panel (not red); no re-render while typing the same code; card min-height reserved; autofocus desktop only (`hover:hover`+`pointer:fine`); `?q=83` prefill used by Share.
- Lookup JS: 17.3 KB raw / 4.6 KB gzip (budget 15 KB). Checked once at 360×640: province + former visible without scrolling.
- Decisions: `inputmode=numeric` (letters-first plates reachable by paste/desktop only); no-JS form submits to /bang-ma; chip/list links point to /[code] and /nguon which land in M4 (404 until then). Date examples in CLAUDE.md/MILESTONES fixed to 01/07/2025.
- Next: M4 (static pages + SEO). Open: M1 questions still pending Founder.

## 2026-11-08 — M4b Richer result card + affiliate (Claude Code)
- Data: `provinces[]` gained `mergedFrom`, `adminCenter`, `areaKm2`, `population` from NQ 202 PDF (an English translation by LuatVietnam). 23 merged provinces have area/pop; 11 unchanged = null. `adminCenter` = null for all 34 (not in the PDF). `mergedFrom` cross-checked against code `formerProvince`; all `verified:false`.
- Card: merge badge + "Miền …" line (`src/lib/card.ts`); area/pop helper ready for `/tinh/[slug]` (M4). Checked at 360×640 (HCM, worst case): province → badge → chips still above the fold.
- Offers: `data/offers.json` (4 samples inactive, url TODO), `OfferCards.astro` (≤2, disclosure label, sponsored+noopener, lazy fixed-size img), build gate for active non-https (proven), plate frame/cover ban. Only on home for now; /[code] and /tinh arrive with M4.
- Lookup JS: 5.4 KB gzip (was 4.6). 202 tests, coverage 100% on lib modules.
- Open: adminCenter source (Vietnamese NQ 202 text? other doc); area/pop for the 11 unchanged; Huế/75 name; re-plating rule.

## 2026-11-08 — M4c Shopee category cards (Claude Code)
- Replaced M4b offers: `data/offers.config.json` (4 categories) → `npm run offers:links` (ACCESSTRADE, Founder machine only) → `offers:check` → `data/offers.json` (`[]` in this commit). Agent never ran links/check against the real API or read `.env`.
- Render: `OfferCards.astro` static, only ok+active+checkedAt ≤ 30 d, ≤ 2/page, rotation by page key, hides entirely when empty; neutral colours; rel `sponsored noopener noreferrer` + `referrerpolicy`. Home only for now (`/[code]`, `/tinh` arrive with M4).
- Privacy: `history.replaceState` → `/{code}` (or `/`); `?q=` still accepted then removed. Share link still `/?q=<code>` (2 digits only).
- verify now ends with `npm run test:dist` (dist/ scans: no "Authorization"/token, no offers on nguon/bang-ma/404). 240 + 5 tests; coverage 100%. JS 5.43 KB gzip (+0.05 KB).
- Open: first real `offers:links` run is the Founder's; /{code} URLs 404 until M4.

## 2026-11-08 — M4 Static pages + SEO (Claude Code)
- Pages (119): `/[code]` ×81 (80 included; unknown codes → 404), `/tinh/[slug]` ×34, `/bang-ma`, `/nguon`, `/404`, plus `sitemap.xml`, `robots.txt`, 82 OG PNGs (≤ 36 KB). `build.format: file` → `/83` is `dist/83.html`.
- One result card: `renderResult()` (`src/lib/result-html.ts`) feeds both the static pages (`ResultCard.astro`) and the home search; one `LIMITS` string (`src/lib/copy.ts`); links/share now `/{code}`; `?q=` still accepted then dropped.
- Area & population HIDDEN everywhere (`SHOW_AREA_POPULATION=false`) until all 34 provinces have a source; data kept in JSON. `adminCenter` still null → not shown.
- SEO: canonical, OG/Twitter, BreadcrumbList (code/tinh), FAQPage (/nguon, 6 Qs from SOURCES.md), noindex while draft. Strict build now also needs `SITE_URL=https://…`; non-strict default is localhost.
- Offers (M4c) mounted under the card on `/[code]`, under content on `/tinh`; absent from /nguon, /bang-ma, /404 (tested).
- Home JS ≈ 6.1 KB gzip total (4 chunks). 258 unit + 133 dist smoke tests; coverage 100%. Build 119 pages in ~2 s.
- Open: final domain for `SITE_URL`; first `offers:links` run; old open data questions unchanged.

## 2026-11-08 — M5 Polish + launch readiness (Claude Code)
- Founder decisions applied: admin-centre line removed from display (`adminCenter` stays null in JSON); "Đọc hiểu biển số" dropped from MVP.
- Done: dark mode (system; AA contrast tested, light+dark), self-hosted Be Vietnam Pro (vietnamese+latin × 400/600/700, swap, only 700 preloaded), favicon SVG + PNG 32/180/192/512 + manifest (`scripts/make-icons.ts`), `PUBLIC_CF_ANALYTICS_TOKEN` (no token → no script), `public/_headers`, `.node-version`=22, `docs/LAUNCH.md`.
- Strict build fails only for `verified:false` and/or missing https `SITE_URL` (both listed together); proven: no SITE_URL, SITE_URL only, and all-verified+SITE_URL → 119 pages OK (temp data change reverted).
- Not verified locally: Cloudflare Pages serving `/83` from `83.html` and `_headers` detach rules → LAUNCH.md §2 has the curl checks to run after the first Preview deploy.
- Note: `data/offers.json` now holds Founder-generated real links (status ok); left uncommitted for the Founder to review/commit. Its old "must be []" test became a structural-safety test.
- Next: Founder reviews, then data verification → strict build → deploy.
