"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StepIndicator from "@/components/StepIndicator";
import { parseGA4Text, enrichPages } from "@/lib/csv-parser";
import { saveSession, generateId } from "@/store/audit";

const STEPS = [
  { label: "Setup", index: 0 },
  { label: "Select Pages", index: 1 },
  { label: "Analyze", index: 2 },
  { label: "Results", index: 3 },
];

const SAMPLE_DATA = `Page path and screen class,Views,Active users
/,12480,4215
/new-inventory,9215,3180
/used-inventory,8044,2960
/service,6772,2540
/finance,5980,2210
/value-your-trade,4615,1720
/specials,4180,1540
/audi-q5,3740,1380
/audi-a6,3115,1140
/schedule-service,2860,1050`;

export default function NewAuditPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"csv" | "paste" | "demo">("csv");
  const [pasteText, setPasteText] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err" | ""; msg: string }>({ type: "", msg: "" });
  const [loaded, setLoaded] = useState<{ count: number; topPage: string; metric: string } | null>(null);
  const [parsedData, setParsedData] = useState<{ pages: ReturnType<typeof parseGA4Text>["pages"]; metricLabel: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleParse(text: string, source: string) {
    const result = parseGA4Text(text, source);
    if (result.error || result.pages.length === 0) {
      setStatus({ type: "err", msg: result.error || "No pages found." });
      setLoaded(null);
      setParsedData(null);
      return;
    }
    setParsedData({ pages: result.pages, metricLabel: result.metricLabel });
    setLoaded({ count: result.pages.length, topPage: result.pages[0].path, metric: result.metricLabel });
    setStatus({ type: "ok", msg: "" });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleParse(ev.target?.result as string, file.name);
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => handleParse(ev.target?.result as string, file.name);
      reader.readAsText(file);
    }
  }

  function handleContinue() {
    if (!parsedData) return;
    let cleanUrl = url.trim().replace(/\/+$/, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    const domain = cleanUrl.replace(/https?:\/\//, "").replace(/[/?].*/, "");
    const enriched = enrichPages(parsedData.pages.slice(0, 25), cleanUrl);
    const id = generateId();
    saveSession({
      id,
      domain,
      baseUrl: cleanUrl,
      metricLabel: parsedData.metricLabel,
      allPages: enriched,
      selectedIds: enriched.slice(0, 10).map((p) => p.id),
      results: [],
      createdAt: new Date().toISOString(),
    });
    router.push("/select");
  }

  const canContinue = !!loaded && !!url.trim();

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-txt">New Audit</h1>
            <p className="text-txt-3 text-sm mt-1">Enter your dealership URL and upload GA4 page data</p>
          </div>
          <StepIndicator steps={STEPS} current={0} />
        </div>

        {/* URL input */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-sm">🌐</div>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-txt-2">Dealership Website URL</h2>
          </div>
          <label className="lbl">Website URL</label>
          <input
            className="inp"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            type="text"
          />
          <p className="text-xs text-txt-4 mt-1.5">Include https:// — used to build page URLs for the report</p>
        </div>

        {/* GA4 upload */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-sm">📊</div>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-txt-2">GA4 Page Data</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-5">
            {(["csv", "paste", "demo"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors capitalize ${
                  tab === t ? "border-red text-red" : "border-transparent text-txt-3 hover:text-txt"
                }`}
              >
                {t === "csv" ? "Upload CSV" : t === "paste" ? "Paste Data" : "Sample Data"}
              </button>
            ))}
          </div>

          {/* CSV tab */}
          {tab === "csv" && (
            <div>
              <div className="bg-blu/5 border border-blu/20 rounded-lg p-4 mb-4 text-xs text-txt-3 leading-loose">
                <span className="text-txt font-semibold">How to export from GA4: </span>
                Open <span className="text-blu">Reports → Engagement → Pages and screens</span> → set date range → click <span className="text-blu">Download ↓ → Download CSV</span>
              </div>
              <div
                className="border-2 border-dashed border-border-2 rounded-xl p-8 text-center cursor-pointer hover:border-red hover:bg-red-dim transition-all"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFile} />
                <div className="text-3xl mb-2">📂</div>
                <div className="text-sm font-semibold text-txt mb-1">Click to browse or drag & drop</div>
                <div className="text-xs text-txt-4">GA4 CSV export · All formats supported</div>
              </div>
            </div>
          )}

          {/* Paste tab */}
          {tab === "paste" && (
            <div>
              <label className="lbl">Paste GA4 table data</label>
              <textarea
                className="inp font-mono text-xs"
                rows={7}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Page path and screen class,Views,Active users\n/used-inventory/index.htm,54337,3536\n/,18986,5376`}
              />
              <button
                className="btn-ghost btn-sm mt-3"
                onClick={() => handleParse(pasteText, "pasted data")}
              >
                Parse Data →
              </button>
            </div>
          )}

          {/* Sample Data tab */}
          {tab === "demo" && (
            <div>
              <div className="bg-amb/5 border border-amb/20 rounded-lg p-4 mb-4 text-xs text-txt-3 leading-relaxed">
                Loads a fictional automotive dataset for demo and testing purposes.
              </div>
              <button
                className="btn-ghost"
                onClick={() => {
                  if (!url.trim()) setUrl("https://demo-premium-auto.com");
                  handleParse(SAMPLE_DATA, "sample data");
                }}
              >
                Load Sample Data →
              </button>
            </div>
          )}

          {/* Status */}
          {status.type === "err" && (
            <div className="mt-3 p-3 bg-red/10 border border-red/20 rounded-lg text-xs text-red leading-relaxed">{status.msg}</div>
          )}
          {loaded && (
            <div className="mt-3 p-3 bg-grn/10 border border-grn/20 rounded-lg text-xs text-grn leading-relaxed">
              ✅ <strong>{loaded.count} pages loaded</strong> · ranked by {loaded.metric} · top page: <span className="font-mono">{loaded.topPage}</span>
            </div>
          )}
        </div>

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="btn-primary w-full py-3.5 text-base rounded-xl"
        >
          Continue to Page Selection →
        </button>
        {!url.trim() && loaded && (
          <p className="text-xs text-red/70 text-center mt-2">Enter your website URL to continue</p>
        )}
      </main>
    </div>
  );
}
