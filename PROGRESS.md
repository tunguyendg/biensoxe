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
