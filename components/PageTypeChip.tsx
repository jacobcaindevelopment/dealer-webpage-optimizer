import { PageType, PAGE_TYPE_LABELS } from "@/lib/types";

const PAGE_TYPE_COLORS: Record<string, string> = {
  vdp: "bg-red/10 text-red border-red/20",
  "used-inventory-srp": "bg-amb/10 text-amb border-amb/20",
  "new-inventory-srp": "bg-blu/10 text-blu border-blu/20",
  "certified-inventory-srp": "bg-blu/10 text-blu border-blu/20",
  service: "bg-grn/10 text-grn border-grn/20",
  finance: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  trade: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  homepage: "bg-red/10 text-red border-red/20",
  specials: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  parts: "bg-surface-4 text-txt-3 border-border-2",
  about: "bg-surface-4 text-txt-3 border-border-2",
  contact: "bg-surface-4 text-txt-3 border-border-2",
  landing: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "model-research": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "oem-research": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  other: "bg-surface-4 text-txt-3 border-border-2",
};

export default function PageTypeChip({ type }: { type: PageType }) {
  const color = PAGE_TYPE_COLORS[type] || PAGE_TYPE_COLORS.other;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color} whitespace-nowrap`}>
      {PAGE_TYPE_LABELS[type]}
    </span>
  );
}
