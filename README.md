# Dealer Webpage Optimizer

**v1.0.21** · Automotive AI Page Analysis Tool

A performance-focused web application that analyzes high-traffic automotive dealership website pages and delivers prioritized, actionable recommendations — including suggested replacement content — for SEO, conversions, and customer experience.

---

## What Is This?

Dealer Webpage Optimizer is built specifically for automotive dealerships. It is not a generic SEO checker. It understands the difference between a Used Inventory SRP and a VDP, why a Service page needs an online scheduler CTA, and why "all credit types welcome" on a Finance page directly impacts lead volume.

It produces:
- What is working on each page
- What is hurting performance (by severity)
- What to change, in priority order
- Suggested replacement content (H1 rewrites, intro copy, CTAs, FAQs, section ideas)
- Expected business impact (SEO, leads, engagement, trust)

---

## Who Is This For?

- **Automotive digital marketing agencies** managing dealership websites
- **In-house marketing teams** at single-point or dealer group operations
- **Digital performance consultants** running page audits at scale
- **OEM field teams** reviewing dealer digital standards

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** (custom design system)
- **jsPDF + jspdf-autotable** (PDF export)
- **Server-side fetch** via Next.js API routes

---

## How the Analysis Works

**No AI generation.** Every finding and recommendation comes from a deterministic, automotive-specific rules engine — not a language model. The same page always produces the same result: consistent, auditable, and hallucination-free, which matters when the report lands in front of a dealer principal. (The trade-off: output is reliable but not infinitely varied. Claude API integration for dealer-specific copy is on the roadmap.)

The pipeline has five stages:

### 1. Signal extraction
Each fetched page's HTML is parsed (client-side, via `DOMParser`) into ~25 measurable signals: title tag, meta description, canonical, Open Graph tags, viewport, heading structure (H1/H2/H3), word count, image count and alt-text coverage, internal/external link counts, JSON-LD schema types, plus automotive-specific detections — visible price, phone number, business hours, review/rating content, and call-to-action text.

### 2. Universal SEO & technical rules
Roughly a dozen checks every page must pass regardless of type: title tag present and 50–60 characters, meta description present and 140–160 characters, exactly one H1, canonical tag, complete Open Graph tags, viewport tag, full alt-text coverage, structured data present, adequate internal linking, and at least 300 words of real content (filter UI isn't content).

### 3. Page-type rules
The classifier assigns each URL one of 16 automotive page types (VDP, new/used/certified SRP, Service, Finance, Trade, Specials, Homepage, research pages, etc.), and each type gets its own conversion-focused checks. Examples:
- **VDP** — Vehicle schema markup, visible price in static HTML, a finance/payment CTA, a trade-in CTA
- **Service** — online scheduler CTA, visible service hours, current specials, technician credentialing content
- **Finance** — "all credit types welcome" messaging, a payment calculator, a pre-approval CTA
- **Used SRP** — inventory count in the title tag, supporting content above/below the grid, a CPO upsell mention

### 4. Findings
Every failed check emits a finding with a category (SEO / Technical / Content / Automotive / UX-CRO), a severity (critical / high / medium / low), a quick-win flag for low-effort-high-impact fixes, a plain-English explanation of why it matters for a dealership, and a specific recommendation — often with example copy ready to paste.

### 5. Priority scoring
Each page gets a 0–100 opportunity score: **traffic weight** (up to 35 points — where the page ranks in your GA4 data) + **business value** (up to 25 points — a VDP outranks an About page) + **issue severity** (up to 40 points — the summed weight of its findings). Scores map to priority tiers: 70+ **Fix Now**, 50+ **High Opportunity**, 30+ **Needs Content Rebuild**, below that **Monitor**. Suggested replacement content (H1 rewrites, intro copy, CTAs, FAQs, internal-link strategy) comes from curated per-page-type templates.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd dealer-webpage-optimizer-v1.0.21
npm install
npm run dev
```

App runs at: **http://localhost:3000**

---

## How to Deploy (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repo at vercel.com
```

No environment variables are required for basic use.

---

## How to Use the Tool

### Step 1 — New Audit
1. Enter the dealership's website URL (e.g. `https://acmeauto.com`)
2. Upload a GA4 CSV export, paste GA4 data, or use the demo dataset

### Step 2 — Select Pages
- Pages are ranked by traffic (Views/Sessions)
- Top 10 are pre-selected; max 25 can be selected
- Page type is auto-classified (VDP, SRP, Service, etc.)

### Step 3 — Analyze
- The app fetches each page server-side automatically
- If a page is blocked (Cloudflare, IP restriction), it is marked accordingly
- Analysis runs on all successfully fetched pages

### Step 4 — Review Results
- Findings are organized by severity (Critical → Low)
- Suggested content is ready to copy and implement
- Priority score guides where to start

### Step 5 — Export PDF
- Download a full report for client presentation or internal use

---

## How to Upload GA4 Data

1. Open **GA4 → Reports → Engagement → Pages and screens**
2. Set your date range
3. Click the **download icon → Download CSV**
4. Upload the CSV on the New Audit screen

Alternatively, paste the table data directly (copy from GA4 table → paste into the text area).

---

## Limitations

- **Blocked pages**: Many dealership websites (Dealer.com, DealerSocket, CDK) use Cloudflare or IP-based bot protection. Blocked pages receive a page-type-based analysis automatically — and any blocked page can be fully analyzed via the "Paste page HTML" fallback on the results screen (view source in your browser, paste, re-analyze).
- **Dynamic content**: JavaScript-rendered inventory counts may not be visible in the static HTML fetch.
- **No AI generation**: See "How the Analysis Works" above — recommendations are rules-based and automotive-specific, not AI-generated. Consistent and reliable, but not infinitely varied.
- **Single session**: Audit results are stored in sessionStorage. Closing the browser tab clears the current session.

---

## Future Improvements

- Claude API integration for AI-generated, dealer-specific content suggestions
- Competitor page comparison (compare against top-ranking competitor pages)
- Multi-location dealer group support
- Scheduled re-audit with change tracking
- Chrome extension for one-click page submission
- CMS-specific recommendations (Dealer.com, CDK, DealerSocket, Sincro)
- ROI projection per recommendation
