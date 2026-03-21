"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StepIndicator from "@/components/StepIndicator";
import PageTypeChip from "@/components/PageTypeChip";
import { getSession, saveSession, saveToHistory } from "@/store/audit";
import { extractMeta } from "@/lib/meta-extractor";
import { analyzePage } from "@/lib/analysis-engine";
import { ParsedPage, PageResult, FetchStatus, DPOSession } from "@/lib/types";

const STEPS = [
  { label: "Setup", index: 0 },
  { label: "Select Pages", index: 1 },
  { label: "Analyze", index: 2 },
  { label: "Results", index: 3 },
];

type PageStatus = "pending" | "fetching" | "analyzing" | "done" | "failed";

interface PageProgress {
  page: ParsedPage;
  status: PageStatus;
  fetchStatus?: FetchStatus;
  result?: PageResult;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<PageProgress[]>([]);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState<DPOSession | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const s = getSession();
    if (!s?.allPages?.length || !s.selectedIds?.length) {
      router.replace("/new");
      return;
    }
    setSession(s);
    const selected = s.allPages.filter((p) => s.selectedIds.includes(p.id));
    setProgress(selected.map((p) => ({ page: p, status: "pending" })));
  }, [router]);

  useEffect(() => {
    if (!session || progress.length === 0 || started.current) return;
    started.current = true;
    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, progress.length]);

  async function runAnalysis() {
    const s = getSession()!;
    const selected = s.allPages.filter((p) => s.selectedIds.includes(p.id));
    const results: PageResult[] = [];

    for (let i = 0; i < selected.length; i++) {
      const page = selected[i];

      // Update status: fetching
      setProgress((prev) =>
        prev.map((pp) => pp.page.id === page.id ? { ...pp, status: "fetching" } : pp)
      );
      setCurrent(i);

      // Fetch page server-side
      let html: string | null = null;
      let fetchStatus: FetchStatus = "error";

      try {
        const res = await fetch("/api/fetch-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: page.url }),
        });
        const data = await res.json();
        fetchStatus = data.status as FetchStatus;
        html = data.html || null;
      } catch {
        fetchStatus = "error";
      }

      // Update status: analyzing
      setProgress((prev) =>
        prev.map((pp) => pp.page.id === page.id ? { ...pp, status: "analyzing", fetchStatus } : pp)
      );

      // Extract meta + analyze
      const meta = html ? extractMeta(html, page.url) : null;
      const result = analyzePage(page, meta, fetchStatus, selected.length, s.domain);
      results.push(result);

      // Update status: done
      setProgress((prev) =>
        prev.map((pp) => pp.page.id === page.id ? { ...pp, status: "done", fetchStatus, result } : pp)
      );

      // Small delay to prevent hammering
      await new Promise((r) => setTimeout(r, 300));
    }

    // Save results
    const completedAt = new Date().toISOString();
    const updatedSession: DPOSession = { ...s, results, completedAt };
    saveSession(updatedSession);
    saveToHistory(updatedSession);
    setDone(true);
    setTimeout(() => router.push("/results"), 800);
  }

  const STATUS_ICON: Record<PageStatus, React.ReactNode> = {
    pending: <span className="text-txt-4 text-xs">—</span>,
    fetching: <Spinner />,
    analyzing: <Spinner color="text-amb" />,
    done: <span className="text-grn text-sm">✓</span>,
    failed: <span className="text-red text-sm">✕</span>,
  };

  const STATUS_LABEL: Record<PageStatus, string> = {
    pending: "Waiting",
    fetching: "Fetching page…",
    analyzing: "Analyzing…",
    done: "Complete",
    failed: "Failed",
  };

  const doneCount = progress.filter((p) => p.status === "done" || p.status === "failed").length;
  const pct = progress.length > 0 ? Math.round((doneCount / progress.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-txt">
              {done ? "Analysis Complete" : "Analyzing Pages"}
            </h1>
            <p className="text-txt-3 text-sm mt-1">
              {done ? "Redirecting to results…" : `Fetching and analyzing ${progress.length} pages…`}
            </p>
          </div>
          <StepIndicator steps={STEPS} current={2} />
        </div>

        {/* Progress bar */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-txt-2 uppercase tracking-wider">
              {done ? "Complete" : `Page ${Math.min(current + 1, progress.length)} of ${progress.length}`}
            </span>
            <span className="text-sm font-bold font-mono text-txt">{pct}%</span>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-red rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {done && (
            <p className="text-xs text-grn mt-3 font-semibold">
              ✓ {doneCount} pages analyzed — opening results…
            </p>
          )}
        </div>

        {/* Page list */}
        <div className="space-y-2">
          {progress.map((p, i) => (
            <div
              key={p.page.id}
              className={`card-2 p-4 flex items-center gap-4 transition-all ${
                i === current && !done ? "border-border-2 shadow-sm shadow-red/10" : ""
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {STATUS_ICON[p.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-txt truncate">
                  {p.page.title || p.page.path}
                </div>
                <div className="text-xs font-mono text-txt-4 mt-0.5 truncate">{p.page.path}</div>
              </div>
              <PageTypeChip type={p.page.pageType} />
              <div className="text-xs text-txt-3 w-24 text-right flex-shrink-0">
                {STATUS_LABEL[p.status]}
                {p.fetchStatus && p.fetchStatus !== "success" && p.status === "done" && (
                  <div className="text-amb text-xs">{p.fetchStatus}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Note about blocked pages */}
        <div className="mt-6 p-4 bg-surface-2 border border-border rounded-lg">
          <p className="text-xs text-txt-3 leading-relaxed">
            <span className="text-txt font-semibold">Note: </span>
            Some pages may be protected by Cloudflare or IP restrictions. If a page can't be fetched, analysis will still run based on page type classification — providing relevant automotive recommendations.
          </p>
        </div>
      </main>
    </div>
  );
}

function Spinner({ color = "text-red" }: { color?: string }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${color}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
