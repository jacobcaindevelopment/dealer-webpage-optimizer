import { PageResult, Priority, Severity } from "./types";
import { VERSION } from "./version";

const SEV_COLORS: Record<Severity, [number, number, number]> = {
  critical: [220, 38, 38],
  high:     [245, 158, 11],
  medium:   [234, 179, 8],
  low:      [34,  197, 94],
};

const PRI_COLORS: Record<Priority, [number, number, number]> = {
  "Fix Now":              [220, 38,  38],
  "High Opportunity":     [245, 158, 11],
  "Needs Content Rebuild":[59,  130, 246],
  Monitor:                [34,  197, 94],
};

// ── Layout constants ─────────────────────────────────────────────────────────
// A4 = 210 × 297 mm.  All measurements in mm.
const MARGIN       = 20;               // left & right page margin
const ACCENT_W     = 6;               // left page accent bar
const TEXT_X       = MARGIN + ACCENT_W; // 26 mm — body text / box left edge
const FOOTER_SAFE  = 26;              // reserved at page bottom for footer
const LINE_H       = 4.5;            // standard line height
const SMALL_LINE_H = 4;              // dense line height

// ── Callout box geometry (shared by recCallout + Quick Wins) ─────────────────
// Box spans full text column: TEXT_X → TEXT_X + TEXT_W (= pageW − MARGIN = 190 mm)
// Left accent strip : 2 mm
// Left text padding : 4 mm  → textX = TEXT_X + 4 = 30 mm
// Right text padding: 4 mm  → max text right = TEXT_X + TEXT_W − 4 = 186 mm
// Inner text width  : TEXT_W − 4 − 4 = TEXT_W − 8
// (TEXT_W is computed inside generatePDF once pageW is known)
const CALLOUT_STRIP = 2;  // blue left strip inside the box
const CALLOUT_PAD_L = 4;  // space between box left and text left
const CALLOUT_PAD_R = 4;  // space between text right and box right
const CALLOUT_PAD_T = 2;  // space above text inside box
const CALLOUT_PAD_B = 3;  // space below text inside box
const CALLOUT_SIZE  = 7.5; // font size inside every callout/recommendation box

export async function generatePDF(
  results: PageResult[],
  domain: string,
  metricLabel: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();  // 297

  // Full-column text width: from TEXT_X to right margin
  // TEXT_W = 210 − 26 − 20 = 164 mm
  const TEXT_W = pageW - TEXT_X - MARGIN;

  // Inner callout text width: TEXT_W minus both horizontal paddings
  // 164 − 4 − 4 = 156 mm
  // textX = TEXT_X + CALLOUT_PAD_L = 30 mm
  // max right = 30 + 156 = 186 mm  ← always inside right margin (190 mm)
  const CALLOUT_TEXT_W = TEXT_W - CALLOUT_PAD_L - CALLOUT_PAD_R;
  const CALLOUT_TEXT_X = TEXT_X + CALLOUT_PAD_L;

  // ── Low-level primitives ───────────────────────────────────────────────────
  function rgb(r: number, g: number, b: number) { doc.setTextColor(r, g, b); }
  function fill(r: number, g: number, b: number) { doc.setFillColor(r, g, b); }
  function draw(r: number, g: number, b: number) { doc.setDrawColor(r, g, b); }

  // ── Page chrome ────────────────────────────────────────────────────────────

  function drawBg(accentColor: [number, number, number] = [220, 38, 38]) {
    fill(10, 10, 10);
    doc.rect(0, 0, pageW, pageH, "F");
    fill(...accentColor);
    doc.rect(0, 0, ACCENT_W, pageH, "F");
  }

  function drawFooter(label: string) {
    // NOTE: this deliberately resets font to 7 pt — callers that split text
    // before calling ensureSpace must re-assert their font after ensureSpace.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    rgb(80, 80, 80);
    doc.text(label, pageW / 2, pageH - 8, { align: "center" });
  }

  function ensureSpace(
    y: number,
    needed: number,
    accent: [number, number, number],
    footer: string
  ): number {
    if (y + needed > pageH - FOOTER_SAFE) {
      doc.addPage();
      drawBg(accent);
      drawFooter(footer);
      return 28;
    }
    return y;
  }

  // ── Text helpers ───────────────────────────────────────────────────────────

  function wrappedText(
    text: string,
    x: number,
    y: number,
    maxW: number,
    size: number,
    color: [number, number, number],
    style: "normal" | "bold" = "normal",
    lh = LINE_H,
    accent: [number, number, number] = [220, 38, 38],
    footer = ""
  ): number {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    rgb(...color);
    const lines: string[] = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      y = ensureSpace(y, lh + 1, accent, footer);
      // Re-assert font state: ensureSpace → drawFooter resets to 7 pt
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      rgb(...color);
      doc.text(line, x, y);
      y += lh;
    }
    return y;
  }

  function sectionHeader(
    label: string,
    y: number,
    color: [number, number, number],
    accent: [number, number, number],
    footer: string,
    size = 8.5
  ): number {
    y = ensureSpace(y, 12, accent, footer);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    rgb(...color);
    doc.text(label, TEXT_X, y);
    return y + 5;
  }

  /**
   * THE ONE CALLOUT BOX HELPER.
   *
   * Used for every highlighted/boxed text block in the report:
   *   • per-page recommendation rows
   *   • quick-wins recommendation rows
   *   • any future accented text block
   *
   * Geometry guarantee:
   *   textX + CALLOUT_TEXT_W  = CALLOUT_TEXT_X + (TEXT_W − 8)
   *                           = 30 + 156 = 186 mm
   *   right page margin       = pageW − MARGIN = 190 mm
   *   ∴ text is always 4 mm inside the right margin ✓
   *
   * Font contract:
   *   1. Font is set to (helvetica, normal, CALLOUT_SIZE) BEFORE splitTextToSize.
   *   2. Font is re-asserted to the SAME state immediately before doc.text,
   *      because ensureSpace → drawFooter can reset font to 7 pt on a page break.
   *   3. Only the pre-split wrapped lines array is ever passed to doc.text —
   *      the raw string is never drawn directly.
   */
  function calloutBox(
    text: string,
    y: number,
    accent: [number, number, number],
    footer: string
  ): number {
    // 1. Establish final font state BEFORE splitting.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CALLOUT_SIZE);

    // 2. Split using inner text width (not full box width).
    const lines: string[] = doc.splitTextToSize(text, CALLOUT_TEXT_W);

    // 3. Compute dynamic box height from actual wrapped line count.
    const boxH = lines.length * SMALL_LINE_H + CALLOUT_PAD_T + CALLOUT_PAD_B + 2;

    // 4. Page-break check BEFORE drawing anything.
    y = ensureSpace(y, boxH + 4, accent, footer);

    // 5. Draw dark background.
    fill(20, 20, 20);
    doc.rect(TEXT_X, y - CALLOUT_PAD_T, TEXT_W, boxH, "F");

    // 6. Draw coloured accent strip on left.
    fill(100, 160, 255);
    doc.rect(TEXT_X, y - CALLOUT_PAD_T, CALLOUT_STRIP, boxH, "F");

    // 7. Re-assert font state (ensureSpace may have called drawFooter → 7 pt).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CALLOUT_SIZE);
    rgb(100, 160, 255);

    // 8. Render only the wrapped lines array — never the raw string.
    doc.text(lines, CALLOUT_TEXT_X, y + 1.5);

    return y + boxH + 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  drawBg();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  rgb(220, 38, 38);
  doc.text("DEALER WEBPAGE OPTIMIZER", TEXT_X, 28);

  doc.setFontSize(36);
  rgb(240, 240, 240);
  doc.text("Page Audit", TEXT_X, 62);
  doc.text("Report",     TEXT_X, 76);

  doc.setFontSize(13);
  rgb(170, 170, 170);
  doc.text(domain, TEXT_X, 94);

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.setFontSize(10);
  rgb(150, 150, 150);
  doc.text(`Generated: ${dateStr}`, TEXT_X, 104);

  // Stats row
  const allFindings = results.flatMap((r) => r.findings);
  const critCount   = allFindings.filter((f) => f.severity === "critical").length;
  const highCount   = allFindings.filter((f) => f.severity === "high").length;
  const quickWins   = allFindings.filter((f) => f.isQuickWin).length;
  const fixNowCount = results.filter((r) => r.priority === "Fix Now").length;

  const stats = [
    { label: "Pages Analyzed",  value: String(results.length) },
    { label: "Total Findings",  value: String(allFindings.length) },
    { label: "Critical + High", value: String(critCount + highCount) },
    { label: "Quick Wins",      value: String(quickWins) },
    { label: "Fix Now",         value: String(fixNowCount) },
  ];

  const statW = TEXT_W / stats.length;
  let sx = TEXT_X;
  stats.forEach((s) => {
    fill(25, 25, 25);
    doc.roundedRect(sx, 122, statW - 3, 28, 2, 2, "F");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    if (s.label === "Critical + High") rgb(220, 38, 38);
    else if (s.label === "Quick Wins")  rgb(34, 197, 94);
    else                                rgb(240, 240, 240);
    doc.text(s.value, sx + (statW - 3) / 2, 135, { align: "center" });
    doc.setFontSize(7);
    rgb(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(s.label, sx + (statW - 3) / 2, 143, { align: "center" });
    sx += statW;
  });

  doc.setFontSize(8);
  rgb(80, 80, 80);
  doc.text(
    "Automotive-specific SEO, UX & conversion analysis for dealership websites.",
    TEXT_X, 172
  );
  doc.setFontSize(8);
  doc.text(`Generated by Dealer Webpage Optimizer v${VERSION} · Confidential`, TEXT_X, pageH - 14);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — EXECUTIVE SUMMARY TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawBg();

  let y = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  rgb(240, 240, 240);
  doc.text("Executive Summary", TEXT_X, y);
  y += 8;

  draw(50, 50, 50);
  doc.setLineWidth(0.3);
  doc.line(TEXT_X, y, pageW - MARGIN, y);
  y += 8;

  const sorted = [...results].sort((a, b) => b.opportunityScore - a.opportunityScore);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN + ACCENT_W, right: MARGIN },
    head: [["#", "Page", "Type", "Priority", "Score", metricLabel, "Issues"]],
    body: sorted.map((r, i) => [
      String(i + 1),
      r.page.path.length > 36 ? r.page.path.slice(0, 33) + "…" : r.page.path,
      r.page.pageType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      r.priority,
      String(r.opportunityScore),
      r.page.views.toLocaleString(),
      String(r.findings.length),
    ]),
    styles: {
      fillColor: [17, 17, 17],
      textColor: [200, 200, 200],
      fontSize: 7.5,
      lineColor: [40, 40, 40],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [25, 25, 25],
      textColor: [220, 38, 38],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      2: { cellWidth: 28 },
      3: { cellWidth: 26 },
      4: { cellWidth: 13, halign: "center" },
      5: { cellWidth: 17, halign: "right" },
      6: { cellWidth: 13, halign: "center" },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 3) {
        const pri = data.row.raw[3] as Priority;
        data.cell.styles.textColor = PRI_COLORS[pri] ?? [200, 200, 200];
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PER-PAGE SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  results.forEach((r, idx) => {
    doc.addPage();
    const accent: [number, number, number] = [220, 38, 38];
    const footer = `Page ${idx + 3} · Dealer Webpage Optimizer · ${domain}`;
    drawBg(accent);
    drawFooter(footer);

    let py = 26;

    // ── Page header card ─────────────────────────────────────────────────────
    const priColor = PRI_COLORS[r.priority];
    fill(22, 22, 22);
    doc.rect(TEXT_X, py - 5, TEXT_W, 24, "F");
    fill(...priColor);
    doc.rect(TEXT_X, py - 5, 3, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    rgb(240, 240, 240);
    const titleLines: string[] = doc.splitTextToSize(r.page.title || r.page.path, TEXT_W - 8);
    doc.text(titleLines.slice(0, 2), TEXT_X + 6, py + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    rgb(130, 130, 130);
    const subtitle = `${r.page.path}  ·  ${r.page.views.toLocaleString()} ${metricLabel}  ·  Score ${r.opportunityScore}  ·  ${r.priority}`;
    const subLines: string[] = doc.splitTextToSize(subtitle, TEXT_W - 8);
    doc.text(subLines.slice(0, 2), TEXT_X + 6, py + 13);

    py += 28;

    // ── What is working ───────────────────────────────────────────────────────
    py = sectionHeader("WHAT IS WORKING", py, [34, 197, 94], accent, footer);
    r.whatIsWorking.slice(0, 3).forEach((w) => {
      py = wrappedText(`✓  ${w}`, TEXT_X, py, TEXT_W, 8, [170, 170, 170], "normal", LINE_H, accent, footer);
      py += 1;
    });
    py += 5;

    // ── Issues found ──────────────────────────────────────────────────────────
    py = sectionHeader("ISSUES FOUND", py, [220, 38, 38], accent, footer);

    r.findings.slice(0, 8).forEach((f) => {
      py = ensureSpace(py, 30, accent, footer);

      const sevColor = SEV_COLORS[f.severity];
      fill(...sevColor);
      doc.circle(TEXT_X + 2.5, py - 1.5, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      rgb(225, 225, 225);
      const fTitleLines: string[] = doc.splitTextToSize(f.title, TEXT_W - 8);
      doc.text(fTitleLines.slice(0, 2), TEXT_X + 8, py);
      py += fTitleLines.slice(0, 2).length * LINE_H + 1;

      // Description
      py = wrappedText(
        f.description,
        TEXT_X, py, TEXT_W, 7.5, [145, 145, 145],
        "normal", SMALL_LINE_H, accent, footer
      );
      py += 2;

      // Recommendation — always via calloutBox
      py = calloutBox(`→  ${f.recommendation}`, py, accent, footer);
      py += 5;
    });

    // ── Suggested content ─────────────────────────────────────────────────────
    const hasH1    = r.suggestedContent.h1Options?.length > 0;
    const hasIntro = !!r.suggestedContent.introParagraph;

    if (hasH1 || hasIntro) {
      py = ensureSpace(py, 16, accent, footer);
      py += 2;
      py = sectionHeader("SUGGESTED CONTENT", py, [245, 158, 11], accent, footer);

      if (hasH1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        rgb(180, 180, 180);
        doc.text("H1 Option:", TEXT_X, py);
        py += LINE_H;
        py = wrappedText(
          r.suggestedContent.h1Options[0],
          TEXT_X, py, TEXT_W, 8, [235, 235, 235],
          "normal", LINE_H, accent, footer
        );
        py += 4;
      }

      if (hasIntro) {
        py = ensureSpace(py, 14, accent, footer);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        rgb(180, 180, 180);
        doc.text("Intro Paragraph:", TEXT_X, py);
        py += LINE_H;
        py = wrappedText(
          r.suggestedContent.introParagraph!,
          TEXT_X, py, TEXT_W, 7.5, [160, 160, 160],
          "normal", SMALL_LINE_H, accent, footer
        );
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK WINS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  const qwAccent: [number, number, number] = [34, 197, 94];
  const qwFooter = `Quick Wins · Dealer Webpage Optimizer · ${domain}`;
  drawBg(qwAccent);
  drawFooter(qwFooter);

  let qy = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  rgb(240, 240, 240);
  doc.text("Quick Wins", TEXT_X, qy);
  qy += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  rgb(150, 150, 150);
  doc.text("High-impact fixes requiring low effort — start here.", TEXT_X, qy);
  qy += 12;

  const allQW = results.flatMap((r) =>
    r.findings
      .filter((f) => f.isQuickWin)
      .map((f) => ({ page: r.page.path, finding: f }))
  );

  allQW.forEach((item, i) => {
    // ── Quick win card ──────────────────────────────────────────────────────
    // Pre-compute recommendation line count using the SAME font/size as calloutBox.
    // This must match exactly so cardH is correct.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CALLOUT_SIZE);
    const recText = `→  ${item.finding.recommendation}`;
    const recLines: string[] = doc.splitTextToSize(recText, CALLOUT_TEXT_W);

    // Card = title row + page path row + recommendation callout block
    const recBlockH = recLines.length * SMALL_LINE_H + CALLOUT_PAD_T + CALLOUT_PAD_B + 2;
    const cardH     = LINE_H + SMALL_LINE_H + recBlockH + 8;

    qy = ensureSpace(qy, cardH + 4, qwAccent, qwFooter);

    // Draw outer card background
    fill(20, 20, 20);
    doc.rect(TEXT_X, qy - 3, TEXT_W, cardH, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    rgb(220, 220, 220);
    doc.text(`${i + 1}.  ${item.finding.title}`, TEXT_X + 4, qy + 3);

    // Page path
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    rgb(130, 130, 130);
    doc.text(item.page, TEXT_X + 4, qy + 3 + LINE_H);

    // Recommendation — via calloutBox geometry, font re-asserted here too
    const recY = qy + 3 + LINE_H + SMALL_LINE_H + 1;
    fill(18, 18, 18);
    doc.rect(TEXT_X, recY - CALLOUT_PAD_T, TEXT_W, recBlockH, "F");
    fill(100, 160, 255);
    doc.rect(TEXT_X, recY - CALLOUT_PAD_T, CALLOUT_STRIP, recBlockH, "F");
    // Re-assert font (multiple doc.setFont calls above may have changed state)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CALLOUT_SIZE);
    rgb(100, 160, 255);
    doc.text(recLines, CALLOUT_TEXT_X, recY + 1.5);

    qy += cardH + 4;
  });

  // ── Save ─────────────────────────────────────────────────────────────────────
  const filename = `dealer-webpage-optimizer-${domain.replace(/[^a-z0-9]/gi, "-")}-${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(filename);
}
