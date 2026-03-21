"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StepIndicator from "@/components/StepIndicator";
import PageTypeChip from "@/components/PageTypeChip";
import { getSession, saveSession } from "@/store/audit";
import { ParsedPage } from "@/lib/types";

const STEPS = [
  { label: "Setup", index: 0 },
  { label: "Select Pages", index: 1 },
  { label: "Analyze", index: 2 },
  { label: "Results", index: 3 },
];

const MAX_SELECT = 25;

export default function SelectPage() {
  const router = useRouter();
  const [pages, setPages] = useState<ParsedPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [metricLabel, setMetricLabel] = useState("Views");
  const [maxViews, setMaxViews] = useState(1);

  useEffect(() => {
    const session = getSession();
    if (!session?.allPages?.length) {
      router.replace("/new");
      return;
    }
    setPages(session.allPages);
    setSelected(new Set(session.selectedIds || session.allPages.slice(0, 10).map((p) => p.id)));
    setMetricLabel(session.metricLabel || "Views");
    setMaxViews(Math.max(...session.allPages.map((p) => p.views), 1));
  }, [router]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECT) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === pages.length) setSelected(new Set());
    else setSelected(new Set(pages.map((p) => p.id)));
  }

  function handleStart() {
    const sess = getSession();
    if (sess) saveSession({ id: sess.id, selectedIds: Array.from(selected) });
    router.push("/analyze");
  }

  const rankColors = ["text-red font-bold", "text-amb font-bold", "text-yellow-400 font-bold"];

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-txt">
              Select Pages
              <span className="ml-3 inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-red text-white text-base font-bold">
                {selected.size}
              </span>
            </h1>
            <p className="text-txt-3 text-sm mt-1">
              Ranked by {metricLabel} · Top 10 pre-selected · Max {MAX_SELECT}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StepIndicator steps={STEPS} current={1} />
            <button
              onClick={handleStart}
              disabled={selected.size === 0}
              className="btn-primary"
            >
              Start Audit →
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        selected.size === pages.length && pages.length > 0
                          ? "bg-red border-red"
                          : "border-border-2 hover:border-red"
                      }`}
                    >
                      {selected.size === pages.length && pages.length > 0 && (
                        <span className="text-white text-xs leading-none">✓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-txt-4 uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-4 uppercase tracking-wider">Page</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-4 uppercase tracking-wider w-36">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-4 uppercase tracking-wider w-44">{metricLabel}</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, i) => {
                  const sel = selected.has(page.id);
                  const pct = Math.round((page.views / maxViews) * 100);
                  return (
                    <tr
                      key={page.id}
                      onClick={() => toggle(page.id)}
                      className={`border-b border-border cursor-pointer transition-colors last:border-0 ${
                        sel ? "bg-red/5 hover:bg-red/8" : "hover:bg-surface-2"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          sel ? "bg-red border-red" : "border-border-2"
                        }`}>
                          {sel && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                      </td>
                      <td className={`px-2 py-3.5 text-sm ${rankColors[i] || "text-txt-4"}`}>
                        {i + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-semibold text-txt truncate max-w-xs">
                          {page.title || page.path}
                        </div>
                        <div className="text-xs font-mono text-txt-4 mt-0.5 truncate max-w-xs">{page.path}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <PageTypeChip type={page.pageType} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface-3 rounded-full flex-shrink-0">
                            <div
                              className="h-full bg-red rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-txt-3">{page.views.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-txt-4">{selected.size} of {pages.length} pages selected</p>
          <button
            onClick={handleStart}
            disabled={selected.size === 0}
            className="btn-primary"
          >
            Start Audit →
          </button>
        </div>
      </main>
    </div>
  );
}
