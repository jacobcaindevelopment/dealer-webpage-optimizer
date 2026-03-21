"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StepIndicator from "@/components/StepIndicator";
import PageTypeChip from "@/components/PageTypeChip";
import PriorityBadge from "@/components/PriorityBadge";
import FindingCard from "@/components/FindingCard";
import { getSession } from "@/store/audit";
import { generatePDF } from "@/lib/pdf-generator";
import { PageResult, DPOSession, Priority } from "@/lib/types";

const STEPS = [
  { label: "Setup", index: 0 },
  { label: "Select Pages", index: 1 },
  { label: "Analyze", index: 2 },
  { label: "Results", index: 3 },
];

const PRI_ORDER: Priority[] = ["Fix Now", "High Opportunity", "Needs Content Rebuild", "Monitor"];

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<DPOSession | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s?.results?.length) {
      router.replace("/new");
      return;
    }
    setSession(s);
    // Auto-expand first result
    if (s.results[0]) setExpanded(new Set([s.results[0].page.id]));
  }, [router]);

  if (!session) return null;

  const safeSession = session;
  const results = [...safeSession.results].sort(
    (a, b) => PRI_ORDER.indexOf(a.priority) - PRI_ORDER.indexOf(b.priority)
  );

  const allFindings = results.flatMap((r) => r.findings);
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const quickWins = allFindings.filter((f) => f.isQuickWin).length;
  const fixNow = results.filter((r) => r.priority === "Fix Now").length;

  const stats = [
    { label: "Pages Analyzed", value: results.length, color: "" },
    { label: "Total Findings", value: allFindings.length, color: "" },
    { label: "Critical + High", value: criticalCount + highCount, color: criticalCount + highCount > 0 ? "text-red" : "text-txt" },
    { label: "Quick Wins", value: quickWins, color: "text-grn" },
    { label: "Fix Now", value: fixNow, color: fixNow > 0 ? "text-red" : "text-txt" },
  ];

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setTab(id: string, tab: string) {
    setActiveTab((prev) => ({ ...prev, [id]: tab }));
  }

  function getTab(id: string) {
    return activeTab[id] || "issues";
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      await generatePDF(safeSession.results, safeSession.domain, safeSession.metricLabel);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-txt">Audit Report</h1>
            <p className="text-txt-3 text-sm mt-1">
              {safeSession.domain} · {new Date(session.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {results.length} pages
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StepIndicator steps={STEPS} current={3} />
            <button onClick={handleExportPDF} disabled={exporting} className="btn-primary">
              {exporting ? "Generating…" : "⬇ Export PDF"}
            </button>
            <button onClick={() => router.push("/new")} className="btn-ghost btn-sm">
              New Audit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <div className={`font-display font-bold text-3xl ${s.color || "text-txt"}`}>{s.value}</div>
              <div className="text-xs text-txt-4 mt-1 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="text-xs font-semibold text-txt-4 uppercase tracking-widest mb-3">Page Findings — Sorted by Priority</div>
        <div className="space-y-3">
          {results.map((r, idx) => {
            const open = expanded.has(r.page.id);
            const tab = getTab(r.page.id);
            return (
              <div key={r.page.id} className="card overflow-hidden">
                {/* Card header */}
                <div
                  onClick={() => toggleExpand(r.page.id)}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${open ? "bg-surface-2 border-b border-border" : "hover:bg-surface-2"}`}
                >
                  <span className="text-xs font-bold text-txt-4 w-5 flex-shrink-0">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-txt truncate">
                      {r.page.title || r.page.path}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-txt-4 truncate">{r.page.path}</span>
                      <span className="text-xs text-txt-4">·</span>
                      <span className="text-xs text-txt-4">{r.page.views.toLocaleString()} {safeSession.metricLabel.toLowerCase()}</span>
                      <span className="text-xs text-txt-4">·</span>
                      <span className="text-xs text-txt-4">{r.findings.length} finding{r.findings.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <PageTypeChip type={r.page.pageType} />
                    <PriorityBadge priority={r.priority} />
                    <div className="text-center w-12">
                      <div className="font-display font-bold text-xl text-txt">{r.opportunityScore}</div>
                      <div className="text-xs text-txt-4 leading-none">score</div>
                    </div>
                    <span className={`text-txt-3 transition-transform duration-200 text-lg ${open ? "rotate-90" : ""}`}>›</span>
                  </div>
                </div>

                {/* Card body */}
                {open && (
                  <div className="p-5">
                    {/* Fetch status warning */}
                    {r.fetchStatus !== "success" && (
                      <div className="mb-5 p-3 bg-amb/10 border border-amb/20 rounded-lg text-xs text-amb leading-relaxed">
                        <span className="font-semibold">Page fetch status: {r.fetchStatus}</span> — Analysis based on page type classification. Manual review recommended.
                      </div>
                    )}

                    {/* Tab nav */}
                    <div className="flex gap-1 border-b border-border mb-5">
                      {[
                        { id: "issues", label: `Issues (${r.findings.length})` },
                        { id: "actions", label: `Action Plan (${r.whatToChange.length})` },
                        { id: "content", label: "Suggested Content" },
                        { id: "impact", label: "Expected Impact" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); setTab(r.page.id, t.id); }}
                          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                            tab === t.id ? "border-red text-red" : "border-transparent text-txt-3 hover:text-txt"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* What is working */}
                    {r.whatIsWorking.length > 0 && (
                      <div className="mb-5 p-4 bg-grn/5 border border-grn/20 rounded-lg">
                        <div className="text-xs font-bold text-grn uppercase tracking-wider mb-2">What Is Working</div>
                        <ul className="space-y-1.5">
                          {r.whatIsWorking.map((w, i) => (
                            <li key={i} className="text-xs text-txt-3 flex items-start gap-2 leading-relaxed">
                              <span className="text-grn flex-shrink-0 mt-0.5">✓</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Issues tab */}
                    {tab === "issues" && (
                      <div>
                        {r.findings.length === 0 ? (
                          <p className="text-sm text-txt-3 text-center py-6">No issues found. This page is well-optimized.</p>
                        ) : (
                          r.findings.map((f) => <FindingCard key={f.id} finding={f} />)
                        )}
                      </div>
                    )}

                    {/* Actions tab */}
                    {tab === "actions" && (
                      <div className="space-y-2">
                        {r.whatToChange.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-surface-2 border border-border rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-red/15 text-red text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-txt-2 leading-relaxed">{item.action}</p>
                              <div className="flex gap-3 mt-1.5">
                                <span className="text-xs text-txt-4">
                                  Effort: <span className={`font-semibold ${item.effort === "low" ? "text-grn" : item.effort === "medium" ? "text-amb" : "text-red"}`}>{item.effort}</span>
                                </span>
                                <span className="text-xs text-txt-4">
                                  Impact: <span className={`font-semibold ${item.impact === "high" ? "text-grn" : item.impact === "medium" ? "text-amb" : "text-txt-3"}`}>{item.impact}</span>
                                </span>
                                <span className="text-xs text-txt-4">{item.category}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content suggestions tab */}
                    {tab === "content" && (
                      <div className="space-y-5">
                        {/* H1 Options */}
                        <div>
                          <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">H1 Rewrite Options</div>
                          <div className="space-y-2">
                            {r.suggestedContent.h1Options.map((h, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-surface-2 border border-border rounded-lg">
                                <span className="text-xs font-bold text-red flex-shrink-0 mt-0.5">H1</span>
                                <p className="text-sm text-txt leading-relaxed">{h}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Intro paragraph */}
                        <div>
                          <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">Suggested Intro Paragraph</div>
                          <div className="p-4 bg-surface-2 border border-border rounded-lg">
                            <p className="text-sm text-txt-2 leading-relaxed">{r.suggestedContent.introParagraph}</p>
                          </div>
                        </div>

                        {/* CTAs */}
                        <div>
                          <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">Recommended CTAs</div>
                          <div className="flex flex-wrap gap-2">
                            {r.suggestedContent.ctas.map((cta, i) => (
                              <span key={i} className="px-3 py-1.5 bg-red/10 border border-red/20 rounded-lg text-xs font-semibold text-red">
                                {cta}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Sections */}
                        <div>
                          <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">Recommended Page Sections</div>
                          <ul className="space-y-1.5">
                            {r.suggestedContent.sections.map((s, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-txt-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red/60 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* FAQs */}
                        {r.suggestedContent.faqs.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">FAQ Ideas</div>
                            <div className="space-y-3">
                              {r.suggestedContent.faqs.map((faq, i) => (
                                <div key={i} className="p-3 bg-surface-2 border border-border rounded-lg">
                                  <p className="text-xs font-semibold text-txt mb-1">Q: {faq.q}</p>
                                  <p className="text-xs text-txt-3 leading-relaxed">A: {faq.a}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Internal links */}
                        {r.suggestedContent.internalLinks.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-txt-2 uppercase tracking-wider mb-2">Internal Linking Strategy</div>
                            <ul className="space-y-1.5">
                              {r.suggestedContent.internalLinks.map((l, i) => (
                                <li key={i} className="text-xs text-blu leading-relaxed">{l}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Impact tab */}
                    {tab === "impact" && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "SEO", icon: "🔍", value: r.expectedImpact.seo },
                          { label: "Lead Generation", icon: "📞", value: r.expectedImpact.leads },
                          { label: "Engagement", icon: "👁", value: r.expectedImpact.engagement },
                          { label: "Trust & Credibility", icon: "⭐", value: r.expectedImpact.trust },
                        ].map((impact) => (
                          <div key={impact.label} className="p-4 bg-surface-2 border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base">{impact.icon}</span>
                              <span className="text-xs font-bold text-txt-2 uppercase tracking-wider">{impact.label}</span>
                            </div>
                            <p className="text-xs text-txt-3 leading-relaxed">{impact.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-between items-center">
          <button onClick={() => router.push("/new")} className="btn-ghost">← New Audit</button>
          <button onClick={handleExportPDF} disabled={exporting} className="btn-primary">
            {exporting ? "Generating PDF…" : "⬇ Download PDF Report"}
          </button>
        </div>
      </main>
    </div>
  );
}
