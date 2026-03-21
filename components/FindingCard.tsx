import { Finding, Severity } from "@/lib/types";

const SEV_DOT: Record<Severity, string> = {
  critical: "bg-red",
  high: "bg-amb",
  medium: "bg-yellow-400",
  low: "bg-grn",
};

const SEV_LABEL: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const CAT_COLORS: Record<string, string> = {
  SEO: "text-blu border-blu/30 bg-blu/10",
  "UX/CRO": "text-purple-400 border-purple-400/30 bg-purple-500/10",
  Content: "text-amb border-amb/30 bg-amb/10",
  Technical: "text-txt-3 border-border-2 bg-surface-3",
  Automotive: "text-red border-red/30 bg-red/10",
};

export default function FindingCard({ finding }: { finding: Finding }) {
  const dotColor = SEV_DOT[finding.severity];
  const catColor = CAT_COLORS[finding.category] || CAT_COLORS.Technical;

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-4 mb-3 last:mb-0">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dotColor}`} />
          <span className="text-sm font-semibold text-txt">{finding.title}</span>
          {finding.isQuickWin && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-grn/10 text-grn border border-grn/20 whitespace-nowrap">
              ⚡ Quick Win
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${catColor}`}>
            {finding.category}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${finding.severity === "critical" ? "text-red" : finding.severity === "high" ? "text-amb" : finding.severity === "medium" ? "text-yellow-400" : "text-grn"}`}>
            {SEV_LABEL[finding.severity]}
          </span>
        </div>
      </div>
      <p className="text-xs text-txt-3 leading-relaxed mb-3">{finding.description}</p>
      <div className="bg-blu/5 border-l-2 border-blu/50 rounded-r-md px-3 py-2">
        <p className="text-xs text-blu/90 leading-relaxed">
          <span className="font-semibold">→ </span>{finding.recommendation}
        </p>
      </div>
      {finding.impact && (
        <p className="text-xs text-txt-4 mt-2 leading-relaxed">
          <span className="text-grn font-medium">Impact: </span>{finding.impact}
        </p>
      )}
    </div>
  );
}
