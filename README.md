# Dealer Webpage Optimizer

**v1.0.2** · Automotive AI Page Analysis Tool

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

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** (custom design system)
- **jsPDF + jspdf-autotable** (PDF export)
- **Server-side fetch** via Next.js API routes

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd dealer-webpage-optimizer-v1.0.2
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

- **Blocked pages**: Many dealership websites (Dealer.com, DealerSocket, CDK) use Cloudflare or IP-based bot protection. Blocked pages receive a generic page-type-based analysis rather than HTML-specific analysis.
- **Dynamic content**: JavaScript-rendered inventory counts may not be visible in the static HTML fetch.
- **No AI generation**: Recommendations are rules-based and automotive-specific, not AI-generated. This means consistent, reliable output but not infinitely varied.
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
