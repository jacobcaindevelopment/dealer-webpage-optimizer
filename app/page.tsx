"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getHistory, getFullAudit, clearSession, saveSession } from "@/store/audit";
import { HistoryEntry, Priority } from "@/lib/types";
import { VERSION } from "@/lib/version";

const PRI_COLOR: Record<Priority, string> = {
  "Fix Now": "text-red",
  "High Opportunity": "text-amb",
  "Needs Content Rebuild": "text-blu",
  Monitor: "text-grn",
};

export default function Dashboard() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    clearSession();
    setHistory(getHistory());
  }, []);

  function openAudit(h: HistoryEntry) {
    const full = getFullAudit(h.id);
    if (!full) {
      // Full audit data unavailable (storage cleared or quota exceeded)
      alert(`Audit data for ${h.domain} is no longer available. Run a new audit to re-generate.`);
      return;
    }
    saveSession(full);
    router.push("/results");
  }

  const features = [
    { icon: "🎯", title: "Automotive-Specific", desc: "VDP, SRP, Service, Finance, Trade — 16 page types with tailored rules" },
    { icon: "🌐", title: "Server-Side Fetch", desc: "No copy-paste needed. Pages are fetched automatically." },
    { icon: "📊", title: "GA4 Traffic Data", desc: "Upload your GA4 CSV. Pages ranked by real traffic, not guesswork." },
    { icon: "✍️", title: "Replacement Copy", desc: "H1 rewrites, intro paragraphs, CTAs, FAQs — ready to implement." },
    { icon: "📄", title: "PDF Reports", desc: "Professional reports for client presentations and internal teams." },
    { icon: "⚡", title: "Priority Scoring", desc: "Opportunity score = traffic × business value × quality gap × fixability." },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Nav */}
      <nav className="h-14 bg-surface border-b border-border flex items-center px-6 sticky top-0 z-50">
        <Logo size="sm" />
        <div className="flex-1" />
        <span className="text-xs text-txt-4">🔒 Runs entirely in your browser</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-20 page-enter">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red/10 border border-red/20 text-red text-xs font-semibold mb-6 uppercase tracking-widest">
            Automotive · SEO · Conversion
          </div>
          <h1 className="font-display font-bold text-6xl md:text-7xl text-txt leading-none mb-6">
            Dealer Webpage<br />
            <span className="text-red">Optimizer</span>
          </h1>
          <p className="text-txt-2 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Upload your GA4 traffic data, select your highest-traffic pages, and get automotive-specific analysis with prioritized fixes and suggested replacement content — ready to act on.
          </p>
          <button
            onClick={() => router.push("/new")}
            className="btn-primary text-base px-8 py-3.5 rounded-xl shadow-lg shadow-red/20"
          >
            Start New Audit →
          </button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {features.map((f) => (
            <div key={f.title} className="card p-5 hover:border-border-2 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-txt mb-1.5">{f.title}</h3>
              <p className="text-xs text-txt-3 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg uppercase tracking-wider text-txt-2">Recent Audits</h2>
              <span className="text-xs text-txt-4">{history.length} audit{history.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => openAudit(h)}
                  className="card-2 p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-3 hover:border-border-2 hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-txt truncate group-hover:text-red transition-colors">{h.domain}</div>
                    <div className="text-xs text-txt-4 mt-0.5">
                      {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{h.pageCount} pages
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase ${PRI_COLOR[h.topPriority]}`}>
                    {h.topPriority}
                  </span>
                  <span className="text-txt-4 text-base opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border mt-auto py-8 text-center space-y-1">
          <p className="text-xs text-txt-4">
            Dealer Webpage Optimizer v{VERSION} · Automotive SEO &amp; Conversion Analysis Tool
          </p>
          <p className="text-xs text-txt-4">
            Built by{" "}
            <a
              href="https://jacobcain.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-txt-3 hover:text-white transition-colors underline underline-offset-2"
            >
              Jacob Cain
            </a>
            {" "}· © {new Date().getFullYear()}{" "}
            <a
              href="https://jacobcain.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-txt-3 hover:text-white transition-colors underline underline-offset-2"
            >
              JC Development
            </a>
            . All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
