# Changelog

All notable changes to Dealer Webpage Optimizer are documented here.

---

## [1.0.6] — 2026-03-21

### Patch — Branded Password Splash + Route Protection

#### Added
- **`app/access/page.tsx`** — branded splash page with product logo, headline, password field, inline error, and continue button. Styled with the dark/red premium visual system.
- **`middleware.ts`** — Next.js Edge middleware checking every request for the `dwo_access` cookie. Unauthenticated requests are redirected to `/access`. Static assets, `/_next/**`, `/api/access`, and `/api/logout` are always public.
- **`app/api/access/route.ts`** — POST route validating the hardcoded password (`wyler`), then setting an `httpOnly` `dwo_access=granted` cookie (7-day expiry, `SameSite: strict`, `Secure` in production).
- **`app/api/logout/route.ts`** — GET route that deletes the `dwo_access` cookie and redirects to `/access`.
- **Nav "Lock" link** — small quiet link in the top-right nav bar that calls `/api/logout` and returns the user to the splash page.

---

## [1.0.5] — 2026-03-21

### Patch — Definitive PDF Callout Fix + Fictional Sample Data

#### Fixed
- **PDF callout/recommendation text is now definitively contained inside its box.**
  - Extracted all callout geometry into named top-level constants: `CALLOUT_PAD_L`, `CALLOUT_PAD_R`, `CALLOUT_STRIP`, `CALLOUT_PAD_T`, `CALLOUT_PAD_B`, `CALLOUT_SIZE`, `CALLOUT_TEXT_W`, `CALLOUT_TEXT_X`.
  - Inner text width = `TEXT_W − PAD_L − PAD_R = 156 mm`. Text renders at `TEXT_X + PAD_L = 30 mm`. Max right edge = `186 mm` — always 4 mm inside the right margin at `190 mm`.
  - **Root cause of persistent overflow:** `ensureSpace()` calls `drawFooter()` on page break, resetting jsPDF font state to 7 pt. If a page break occurred between `splitTextToSize()` (at 7.5 pt) and `doc.text()`, text rendered at 7 pt — breaking the width math. Fixed by re-asserting font state immediately before every `doc.text()` call inside boxed sections.
  - Same font re-assertion fix applied inside `wrappedText()` loop so body text also survives page breaks correctly.
  - Unified into a single `calloutBox()` function used by both recommendation rows and Quick Wins — one implementation, no divergence.
  - Only the wrapped lines array is ever rendered; raw strings are never passed to `doc.text()`.

#### Changed
- **Sample data replaced with fictional automotive data.** No real dealership references remain.
  - Domain: `demo-premium-auto.com`
  - Pages: `/`, `/new-inventory`, `/used-inventory`, `/service`, `/finance`, `/value-your-trade`, `/specials`, `/audi-q5`, `/audi-a6`, `/schedule-service`
  - Traffic values: 12,480 / 9,215 / 8,044 / 6,772 / 5,980 / 4,615 / 4,180 / 3,740 / 3,115 / 2,860
- Tab renamed from "Demo Data" → **"Sample Data"**; button renamed to **"Load Sample Data →"**.
- Helper text: *"Loads a fictional automotive dataset for demo and testing purposes."*

---

## [1.0.4] — 2026-03-20

### Patch — PDF Callout Text Clipping Fix

#### Fixed
- **PDF recommendation callout text no longer clips on the right edge** — Root cause: `recCallout()` called `splitTextToSize(text, TEXT_W)` (164mm) but rendered lines starting at `TEXT_X + 4` (30mm), so the right edge reached 194mm — 4mm past the 190mm right margin. Fixed by splitting at `innerW = TEXT_W - PAD_L - PAD_R = 156mm`, keeping rendered text fully within the box bounds.
- **Quick Wins recommendation split width made consistent** — Updated to use the same `qwInnerW = TEXT_W - 8 = 156mm` inner width so the rendered text aligns correctly within its card and does not touch the right box edge.
- **Box heights remain dynamic** — Both `recCallout()` and Quick Wins cards calculate `boxH` from the wrapped line count after the corrected split, so boxes continue to grow with content.

#### Root Cause Detail
The `splitTextToSize(text, width)` parameter is a **text-column width** measured from the render X position, not from the page edge. When the render X is `TEXT_X + 4 = 30mm` and split width is `TEXT_W = 164mm`, each line may be 164mm wide but starts at 30mm — overflowing to 194mm. The page right margin is 190mm. Subtracting padding from the split width (making it 156mm) means lines render from 30mm to at most 186mm, 4mm inside the right edge.

#### Not Changed
- All other rendering paths (body text, section headers, finding titles, suggested content) — unaffected.

---

## [1.0.3] — 2026-03-20

### Patch — Recent Audits Fix + PDF Layout Overhaul

#### Fixed
- **Recent Audits click now works reliably** — Root cause: `saveFullAudit()` silently swallowed localStorage quota errors, leaving history entries with no loadable data. Fixed by: (1) trimming stored `suggestedContent` fields aggressively before saving, (2) auto-evicting the oldest stored full audit on quota failure and retrying, (3) surfacing a clear message to the user if data is still unavailable instead of silently doing nothing.
- **PDF text overflow eliminated** — Completely rearchitected the PDF generator layout:
  - All body text now renders at a single consistent `TEXT_X` position (26mm) with a unified `TEXT_W` (164mm), eliminating all indentation-based width mismatches.
  - `splitTextToSize()` is called with the same width used for rendering in every case.
  - Finding titles are now wrapped (previously rendered as a single unbounded line).
  - Recommendation callouts are full-width with a left accent bar instead of a nested indented box.
  - `wrappedText()` helper inserts page breaks per-line so no line is ever rendered past the bottom safe zone.
  - `recCallout()` pre-calculates box height from wrapped line count before drawing.
  - Quick Wins card height is dynamically calculated from wrapped recommendation content.
- **PDF page break continuity** — Every `ensureSpace()` call redraws background and footer, so continuation pages are fully styled.

#### Not Changed
- Analysis engine, scoring logic, workflow, data model, routing — all unchanged.

---

## [1.0.2] — 2026-03-20

### Patch — Product Rename + PDF Layout Rewrite + Dev Cleanup

#### Added
- **Product renamed** — "Dealer Page Optimizer" is now **"Dealer Webpage Optimizer"** everywhere: Logo, Nav, footer, metadata, PDF cover, PDF footer, exported filename, README, CHANGELOG, VERSION, and package.json.

#### Fixed
- **PDF text overflow fully resolved** — Rewrote `pdf-generator.ts` with reusable helper closures (`drawBg`, `drawFooter`, `ensurePageBreak`, `addWrappedText`, `addCalloutBox`, `addSectionHeader`). All text blocks now split to fit within margins with no clipping.
- **PDF description + recommendation no longer capped** — Removed hard line-count caps from findings descriptions and recommendations; content wraps fully across pages as needed.
- **PDF quick wins cards now dynamic height** — Card height grows to fit the recommendation text rather than being fixed at 16mm.
- **PDF page breaks handled consistently** — `ensurePageBreak` redraws background and footer on every overflow, preventing orphaned text on plain-white overflow pages.
- **Version string consistency** — All visible version references read `v1.0.2` (Nav badge, footer, PDF footer, VERSION.md, CHANGELOG.md, package.json).
- **Next.js dev indicator removed** — `devIndicators: false` in `next.config.mjs` suppresses the bottom-left "N" widget.

#### Not Changed
- Analysis engine, scoring logic, workflow, data model, UI layout — all unchanged.

---

## [1.0.1] — 2026-03-20

### Patch — UI + PDF Polish

#### Fixed
- **Recent Audits clickable** — History rows on the dashboard now navigate to the full results view on click. Full audit data (minus raw HTML) is persisted to localStorage on completion and restored into session on re-open.
- **Audit row interaction affordance** — Added `cursor-pointer`, hover background, border, and a chevron `›` that reveals on hover. Domain name transitions to red on hover. Row feels clearly interactive.
- **PDF recommendation text wrapping** — Recommendation lines inside blue callout blocks no longer clip on the right side. Removed the 3-line cap on `recLines`; all lines now render. Corrected rect width to match text split width, preventing overflow past the container edge.
- **PDF description text** — Increased description line cap from 2 to 4 lines for fuller context in the PDF.
- **PDF page overflow guard** — Increased overflow threshold from 60mm to 70mm to give wrapped recommendation blocks enough clearance before a page break.

#### Not Changed
- Analysis engine, scoring logic, workflow, data model — all unchanged.

---

## [1.0.0] — 2026-03-19

### Initial Production Release

#### Added
- **Automotive-specific analysis engine** — 16 page type classifications with tailored recommendation rules for VDP, SRP, Service, Finance, Trade, Homepage, and more
- **Server-side page fetching** via `/api/fetch-page` — eliminates the need for users to copy/paste HTML source manually
- **Fixed CSV parsing** — corrected zero-value views bug; supports Views, Screen page views, Sessions, Active users columns; handles GA4 comment lines (#), comma and tab delimiters, quoted fields, K/M suffixes
- **Suggested replacement content** — per-page H1 rewrites, intro paragraphs, CTA recommendations, section ideas, FAQ templates, and internal linking strategy
- **Opportunity scoring** — priority calculation based on traffic rank × business value × quality gap × fixability
- **Priority labels** — Fix Now / High Opportunity / Needs Content Rebuild / Monitor
- **PDF export** — cover page, executive summary, ranked page findings, replacement content, quick wins
- **Dark + red UI** — premium automotive executive interface using Barlow Condensed + DM Sans
- **Audit history** — lightweight localStorage-based history (last 10 audits)
- **Demo-safe fetch fallback** — graceful handling of blocked/protected pages with clear status labels

#### Changed (from prior PageAudit prototype)
- Replaced browser-based Ctrl+U paste flow with server-side fetch
- Removed generic SEO tool framing — rebuilt as automotive conversion optimizer
- Replaced purple/blue color system with charcoal/red premium theme
- Migrated from single-file HTML to Next.js 14 App Router + TypeScript + Tailwind

#### Technical
- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS custom design system
- jsPDF + jspdf-autotable for PDF generation
- sessionStorage for inter-page state, localStorage for audit history
