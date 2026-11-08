# BIEN SO — project memory (read first, keep ≤ 100 lines)

## What this is
A Vietnamese, mobile-first website. The user types a plate prefix (or a full plate) and immediately sees:
- the **current** province/city (after 01/7/2025);
- the **former** province;
- the other codes of the same province;
- what a plate **cannot** tell you.

It is a geographic-code lookup only. There is no vehicle or owner data.

Full rationale: `docs/PRODUCT_BRIEF.md`. Do **not** re-read it every session; read it only when a product decision is unclear.

## Stack (decided — don't relitigate)
- Astro (static output) + TypeScript + plain CSS (custom properties). No UI framework unless an island truly needs one.
- Data lives in `data/plate-codes.json`, imported at build time. No DB, no API, no Docker, no server.
- Lookup runs client-side in one small TS module. Pages for codes and provinces are pre-rendered.
- Tests: Vitest.
- Package manager: npm.
- Deploy target: Cloudflare Pages (static `dist/`).

## Commands
- `npm run dev` — local server (http://localhost:4321)
- `npm run check` — astro check + typecheck
- `npm run lint`
- `npm test` — Vitest (data integrity + parser + build smoke)
- `npm run build` — static build into `dist/`

`npm run verify` = check + lint + test + build. Run it once at the end of each milestone, not after every edit.

## Non-negotiables
1. **Accuracy over features.** All codes and province names come only from `data/plate-codes.json`. Never invent or "fix" a code from memory.
   - Records have `verified:false` until the Founder checks them against the official Phụ lục 02 of TT 51/2025/TT-BCA.
   - A production build (`BIEN_SO_STRICT=1`) must fail while any record is unverified.
2. **Never imply** that a prefix reveals the owner, the owner's address or where they live now, the ward/commune, or the vehicle's status.
   - Every result shows the limits line and the source + data date.
3. Never say "biển cũ không phải đổi" unless `data/SOURCES.md` cites a verified basis. Default wording: "Chưa thấy quy định bắt buộc đổi biển; hỏi công an nơi đăng ký để chắc chắn."
4. Privacy: lookups never leave the browser. No cookies and no cookie banner. Analytics is Cloudflare Web Analytics only.
5. Not a government site:
   - no police/state emblems;
   - no photos of real plates;
   - the footer says it is an independent site.
6. Performance: lookup JS ≤ 15 KB gzip. The site must be readable with JS off (full table is server-rendered).
7. Mobile first:
   - at 360×640 the result is visible without scrolling;
   - touch targets ≥ 44px;
   - WCAG AA contrast;
   - real `<label>`, and `aria-live` on the result.

## Vietnamese copy rules
- Plain Vietnamese, full diacritics. Example: "Biển **83** là xe đăng ký tại **Cần Thơ**. Trước 01/7/2025: **Sóc Trăng**."
- Show the current name first and biggest; the former name second.
- Never write "xe của người X".
- Dates as dd/mm/yyyy.

## Routes
- `/` — search
- `/[code]` — 81 pages, e.g. `/83`
- `/tinh/[slug]` — 34 pages
- `/bang-ma` — full table
- `/nguon` — sources, limits, FAQ
- `/404`

## Input parsing (spec lives in tests)
- Accept, case- and space-insensitive: `83`, `83A`, `83a1`, `83A12345`, `83A-123.45`, `51G 123.45`, `29-LD 012.34`.
- Extract the leading 2 digits.
- Letters-first input (NG/NN/QT, military 2-letter series) → explain briefly; never guess a province.
- Unknown code → "chưa được cấp cho tỉnh nào" + link to `/bang-ma`.

## Working agreement (Founder = Tony)
- Work milestone by milestone from `docs/MILESTONES.md`. One milestone per session when possible.
- At the end of each milestone:
  - append ≤ 10 lines to `PROGRESS.md` (done / decisions / open questions / next);
  - include a one-line purpose for each new file.
- QA:
  - Agents run technical QA (types, lint, tests, build, data validation).
  - The Founder does visual review in the browser himself.
  - Don't auto-screenshot or run Lighthouse/axe unless asked or a specific UI bug needs it.
  - Report: `Technical QA PASS — Pending Founder Visual Review`, with changed files, localhost URL, and ≤ 3 things to eyeball.
- Git:
  - Commit locally to `main` at the end of a milestone, after QA passes.
  - **Push, deploy, domain/DNS changes, and setting `verified:true` each need the Founder's explicit approval.**
- Don't install global software. Project devDependencies via npm are fine.
- Prefer few subagents; don't fan out for small tasks. Don't paste whole files into reports.
